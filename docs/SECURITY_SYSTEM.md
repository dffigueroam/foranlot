# Sistema de Seguridad - ForanLot

## Descripción General

Sistema completo de seguridad implementado para prevenir:
- ✅ **Rate Limiting**: Limitar requests por IP/usuario
- ✅ **SQL Injection**: Sanitización de inputs y queries parametrizadas
- ✅ **Auditoría**: Logging de actividades sospechosas

## 1. Rate Limiting

### Configuraciones por Endpoint

| Endpoint | Máx Requests | Ventana | Bloqueo |
|----------|-------------|---------|---------|
| **Login** | 5 intentos | 15 min | 30 min |
| **Register** | 3 intentos | 1 hora | 1 hora |
| **Prediction** | 50 predicciones | 1 hora | 10 min |
| **API General** | 100 requests | 1 hora | 5 min |

### Implementación

```typescript
import { rateLimitMiddleware } from "@/lib/security"

// En cualquier API route o server action
const rateLimit = await rateLimitMiddleware(request, "login", userId)

if (!rateLimit.allowed) {
  return Response.json(
    { error: rateLimit.reason },
    { status: 429 }
  )
}
```

### Base de Datos

Tabla `api_rate_limit`:
```sql
CREATE TABLE api_rate_limit (
  id SERIAL PRIMARY KEY,
  identifier TEXT NOT NULL,        -- IP o user_id
  limit_type TEXT NOT NULL,        -- 'login', 'register', etc.
  request_count INTEGER DEFAULT 1,
  blocked_until TIMESTAMP,         -- NULL si no está bloqueado
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_identifier ON api_rate_limit(identifier, limit_type, created_at);
```

## 2. Sanitización de Inputs

### Tipos de Validación

```typescript
import { sanitizeInput } from "@/lib/security"

// Username: solo alfanuméricos, guiones y underscores (3-30 chars)
const username = sanitizeInput(raw, "username")

// Email: formato válido de email
const email = sanitizeInput(raw, "email")

// Number: solo dígitos y espacios (para números de lotería)
const number = sanitizeInput(raw, "number")

// Text: remueve <> y limita a 1000 caracteres
const text = sanitizeInput(raw, "text")
```

### Protección SQL Injection

**Nivel 1**: Neon con tagged templates (automático)
```typescript
// ✅ SEGURO: Queries parametrizadas automáticamente
const results = await sql`
  SELECT * FROM users WHERE email = ${email}
`
```

**Nivel 2**: Sanitización adicional (lib/security.ts)
```typescript
// ✅ EXTRA SEGURO: Validación antes de query
const email = sanitizeInput(rawEmail, "email")
if (!email) return { error: "Email inválido" }

const results = await sql`SELECT * FROM users WHERE email = ${email}`
```

### Aplicado en:

- ✅ [app/actions/auth.ts](app/actions/auth.ts) - Login y registro
- ✅ [app/actions/predictions.ts](app/actions/predictions.ts) - Crear predicciones
- ✅ Todas las server actions que reciben input del usuario

## 3. Logging de Actividades Sospechosas

### Tabla de Auditoría

Tabla `blocked_queries_log`:
```sql
CREATE TABLE blocked_queries_log (
  id SERIAL PRIMARY KEY,
  identifier TEXT NOT NULL,      -- IP o user_id
  query_attempt TEXT,            -- Tipo de actividad
  blocked_reason TEXT,           -- Motivo del bloqueo
  severity TEXT,                 -- 'low', 'medium', 'high'
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Uso

```typescript
import { logSuspiciousActivity } from "@/lib/security"

await logSuspiciousActivity(
  `ip_${clientIp}`,
  "invalid_login_input",
  "Campos inválidos en login",
  "low"
)
```

### Eventos Registrados

| Evento | Severidad | Descripción |
|--------|-----------|-------------|
| `invalid_register_input` | Low | Datos mal formateados en registro |
| `invalid_login_input` | Low | Campos inválidos en login |
| `rate_limit_exceeded_*` | Medium | Límite de requests excedido |
| `sql_injection_attempt` | High | Patrones sospechosos detectados |

## 4. Cron Jobs de Mantenimiento

### Limpieza Diaria de Rate Limits

**Endpoint**: `/api/cron/cleanup-rate-limits`  
**Schedule**: `0 2 * * *` (2 AM diario)  
**Acción**: Elimina registros de rate limit mayores a 24 horas

```bash
# Configurar en cron-job.org
curl -X GET https://tudominio.com/api/cron/cleanup-rate-limits \
  -H "Authorization: Bearer [CRON_SECRET]"
```

## 5. Middleware de Seguridad

### Obtener IP del Cliente

```typescript
import { getClientIp } from "@/lib/security"

// En API routes
export async function POST(request: Request) {
  const ip = getClientIp(request)
  // ...
}

// En server actions (Next.js 14+)
import { headers } from "next/headers"

function getClientIp(): string {
  const headersList = headers()
  const forwarded = headersList.get("x-forwarded-for")
  return forwarded?.split(",")[0].trim() || "unknown"
}
```

### Headers de Seguridad

Agregar a `next.config.mjs`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

## 6. Panel de Administración

### Ver Actividad Sospechosa

**TODO**: Crear panel en `/admin` para visualizar:
- Rate limits activos
- Usuarios bloqueados
- Log de actividades sospechosas

Ejemplo de query:
```typescript
const suspicious = await sql`
  SELECT * FROM blocked_queries_log
  WHERE severity IN ('medium', 'high')
  ORDER BY created_at DESC
  LIMIT 50
`
```

## 7. Testing de Seguridad

### Probar Rate Limiting

```bash
# Probar límite de login (5 intentos en 15 min)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -d "email=test@test.com&password=wrong"
  echo "Intento $i"
done

# El 6to intento debe retornar 429 Too Many Requests
```

### Probar Sanitización

```typescript
// Intento de XSS
const malicious = "<script>alert('xss')</script>"
const sanitized = sanitizeInput(malicious, "text")
// Resultado: "scriptalert('xss')/script" (sin < y >)

// Intento de SQL injection (bloqueado por Neon automáticamente)
const injection = "'; DROP TABLE users; --"
const sanitized = sanitizeInput(injection, "username")
// Resultado: null (caracteres no permitidos)
```

## 8. Mejores Prácticas Implementadas

### ✅ Defense in Depth (Defensa en Profundidad)

1. **Capa 1**: Validación en cliente (React forms)
2. **Capa 2**: Sanitización en server actions
3. **Capa 3**: Queries parametrizadas (Neon)
4. **Capa 4**: Rate limiting por IP/usuario
5. **Capa 5**: Logging y auditoría

### ✅ Fail-Safe Defaults

```typescript
// Si hay error en rate limiting, permitir el request
catch (error) {
  return { allowed: true, remaining: -1 }
}
```

### ✅ Principle of Least Privilege

- Solo admins pueden ver logs de seguridad
- Usuarios bloqueados no pueden ver motivo exacto (previene fingerprinting)

## 9. Variables de Entorno Requeridas

```env
# .env.local
DATABASE_URL=postgresql://...
JWT_SECRET=your-jwt-secret-min-32-chars
CRON_SECRET=your-cron-secret-for-scheduled-jobs
```

## 10. Monitoreo en Producción

### Métricas Clave

- **Rate limit hits**: Cuántos usuarios son bloqueados por día
- **Suspicious activities**: Alertar si severidad = 'high'
- **Failed logins**: Detectar patrones de ataques de fuerza bruta

### Alertas Recomendadas

```typescript
// Alertar si más de 100 rate limits en 1 hora
const recentBlocks = await sql`
  SELECT COUNT(*) as count
  FROM api_rate_limit
  WHERE blocked_until > NOW()
    AND created_at >= NOW() - INTERVAL '1 hour'
`

if (recentBlocks[0].count > 100) {
  // Enviar notificación a admin
}
```

---

**Última Actualización**: Febrero 2026  
**Estado**: Implementado y listo para producción  
**Próximos pasos**: Panel de administración de seguridad, alertas automáticas
