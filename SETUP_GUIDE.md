# Guía de Configuración - ForanLot

## 📋 Resumen de Implementación

Esta guía describe todas las características implementadas recientemente (Features 23-26) y los pasos necesarios para completar el despliegue.

---

## ✅ Características Completadas

### Feature 23: Sistema de Herramientas de Análisis

**Descripción**: Herramientas estadísticas con límites de uso diario (3 gratis, 10 premium por herramienta)

**Archivos Creados**:
- `scripts/009_tool_daily_limits.sql` - Schema y funciones SQL
- `lib/tool-analyzers.ts` - Algoritmos de análisis (595 líneas)
- `app/actions/tool-analyzers.ts` - Server actions con validación de límites
- `app/api/cron/reset-tool-limits/route.ts` - Cron job para reinicio diario
- `components/tools/number-analyzer-tools.tsx` - Componente UI completo

**Archivos Modificados**:
- `app/tools/tools-client.tsx` - Agregada pestaña "Analizadores"

**Herramientas Implementadas**:

1. **🔥 Números Calientes**
   - Analiza últimos 15 sorteos filtrados por país
   - Detecta números con alta frecuencia de aparición
   - Valida coincidencias en ≥2 posiciones con números del usuario
   - Calidad: Excelente (3+ pos), Buena (2 pos), Parcial (1 pos)

2. **❄️ Números Fríos**
   - Examina últimos 60 días por país
   - Identifica dígitos antiguos en posiciones específicas
   - Estados: Muy Frío (>30 días), Frío (15-30 días), Tibio (<15 días)
   - Análisis por posición exacta (unidades, decenas, centenas)

3. **📊 Análisis de Patrones**
   - Detecta secuencias ascendentes/descendentes
   - Identifica dígitos repetidos
   - Evalúa suma balanceada
   - Nivel de confianza: Alto, Medio, Bajo

**Límites de Uso**:
- Usuarios gratis: 3 usos totales/día
- Usuarios premium: 10 usos por herramienta/día
- Reinicio automático: 12:00 AM diariamente

---

### Feature 24: Limpieza de Header

**Descripción**: Eliminado botón "Subir" del header (ya existe en panel Admin)

**Archivos Modificados**:
- `components/layout/header.tsx` - Removido enlace "Subir Resultados"

**Estado**: ✅ Completado

---

### Feature 25: Renovación Automática de Contratos

**Descripción**: Sistema automático de renovación con ventana horaria 0-9 AM

**Archivos Creados**:
- `scripts/008_enhance_contracts_system.sql` - Schema mejorado
- `lib/contracts.ts` - Lógica de contratos y renovación (463 líneas)
- `app/actions/contracts.ts` - Server actions para contratos
- `app/api/cron/renew-contracts/route.ts` - Cron job para renovaciones a las 3 AM
- `components/contracts/contract-form.tsx` - Formulario de contratos
- `components/contracts/contracts-section.tsx` - Vista de contratos activos
- `app/contracts/page.tsx` - Página de contratos

**Funcionalidades**:
- Renovación automática si usuario tiene créditos
- Ventana de renovación: 0:00-9:00 AM día siguiente al vencimiento
- Notificaciones: día de vencimiento + resultado de renovación
- Máximo 3 intentos de renovación por contrato
- Desactivación automática si no hay créditos

**Estado**: ✅ Completado

---

### Feature 26: Contratos Diferenciados (Sintéticos vs Orgánicos)

**Descripción**: Límites diferentes según tipo de usuario objetivo

**Límites Implementados**:
- **Usuarios Sintéticos** (ranking): Máximo 1 contrato activo/mes
- **Usuarios Orgánicos** (reales): Máximo 2 contratos activos/mes

**Validación**:
- Verificación en `createContract()` antes de crear
- Conteo por tipo de usuario con `get_active_contracts_count()`
- Mensajes de error específicos en español

**Estado**: ✅ Completado

---

## 🗄️ Migraciones de Base de Datos

### Migraciones Pendientes de Ejecutar

Ejecuta estos scripts SQL en tu base de datos Neon en orden:

#### 1. `scripts/008_enhance_contracts_system.sql`

**Propósito**: Sistema de contratos con renovación automática

**Crea**:
- Columnas en `user_selections`: `contract_duration`, `is_synthetic_target`, `auto_renew`, `renewal_attempts`, `last_renewal_date`
- Función `get_active_contracts_count(p_user_id, p_is_synthetic)` - Cuenta contratos por tipo
- Función `get_expiring_contracts(p_days_before)` - Encuentra contratos próximos a vencer
- Función `auto_renew_contract(p_selection_id)` - Lógica de renovación automática

**Comando**:
```sql
-- Ejecutar todo el contenido de scripts/008_enhance_contracts_system.sql
```

#### 2. `scripts/009_tool_daily_limits.sql`

**Propósito**: Sistema de límites diarios para herramientas analíticas

**Crea**:
- Tabla `daily_tool_limits` - Tracking de usos por usuario/día
- Tabla `tool_usage_tracking` - Log detallado de uso de herramientas
- Función `get_user_daily_limits(p_user_id)` - Obtiene límites actuales
- Función `can_use_tool(p_user_id)` - Valida si puede usar herramienta
- Función `record_tool_use(...)` - Registra uso y decrementa contador
- Función `reset_daily_tool_limits()` - Reinicia límites (cron diario)

**Comando**:
```sql
-- Ejecutar todo el contenido de scripts/009_tool_daily_limits.sql
```

### Verificación Post-Migración

Después de ejecutar las migraciones, verifica:

```sql
-- Verificar tablas creadas
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('daily_tool_limits', 'tool_usage_tracking');

-- Verificar columnas de contratos
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'user_selections' 
AND column_name IN ('contract_duration', 'is_synthetic_target', 'auto_renew', 'renewal_attempts', 'last_renewal_date');

-- Verificar funciones SQL creadas
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE '%contract%' OR routine_name LIKE '%tool%';
```

---

## ⚙️ Configuración de Cron Jobs en Vercel

### Cron Jobs Requeridos

Configura estos 4 cron jobs en Vercel Dashboard → Settings → Cron Jobs:

#### 1. Verificación de Resultados (Existente)
- **Endpoint**: `https://your-domain.com/api/cron/verify`
- **Schedule**: `0 21 * * *` (9:00 PM diariamente)
- **Descripción**: Verifica pronósticos contra resultados oficiales

#### 2. Descuento de Créditos (Existente)
- **Endpoint**: `https://your-domain.com/api/cron/deduct-credits`
- **Schedule**: `0 0 * * *` (12:00 AM diariamente)
- **Descripción**: Descuenta 1 crédito por selección activa

#### 3. Renovación de Contratos (NUEVO)
- **Endpoint**: `https://your-domain.com/api/cron/renew-contracts`
- **Schedule**: `0 3 * * *` (3:00 AM diariamente)
- **Descripción**: Procesa renovaciones automáticas de contratos
- **Headers**: 
  ```
  Authorization: Bearer YOUR_CRON_SECRET
  ```

#### 4. Reinicio de Límites de Herramientas (NUEVO)
- **Endpoint**: `https://your-domain.com/api/cron/reset-tool-limits`
- **Schedule**: `0 0 * * *` (12:00 AM diariamente)
- **Descripción**: Reinicia contadores de uso de herramientas
- **Headers**: 
  ```
  Authorization: Bearer YOUR_CRON_SECRET
  ```

### Configuración en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Navega a **Settings** → **Cron Jobs**
3. Para cada cron job:
   - Click **"Create Cron Job"**
   - Ingresa el endpoint completo (con tu dominio)
   - Configura el schedule (cron expression)
   - Agrega el header `Authorization` con tu `CRON_SECRET`
   - Guarda

---

## 🔐 Variables de Entorno

### Verificar Variables Existentes

Asegúrate de tener estas variables en Vercel → Settings → Environment Variables:

```env
# Base de Datos
DATABASE_URL=postgresql://user:password@host/db

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Autenticación
JWT_SECRET=your_minimum_32_character_secret_string

# Cron Jobs (CRÍTICO para features 23 y 25)
CRON_SECRET=your_random_secret_for_cron_protection

# API de Lotería (opcional)
LOTTERY_API_KEY=your_lottery_api_key

# URL de la aplicación
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Variable Crítica: CRON_SECRET

Si no tienes configurado `CRON_SECRET`, genera uno:

```bash
# En PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# O usa este ejemplo (CAMBIALO en producción)
CRON_SECRET=f8a7c9d2e1b4a6c8d9e7f5a3b2c1d0e9
```

Agrega esta variable en Vercel para los **4 entornos**: Production, Preview, Development

---

## 🧪 Testing Local

### Antes de Desplegar

1. **Instala dependencias** (si no lo hiciste):
   ```bash
   npm install
   ```

2. **Ejecuta migraciones SQL**:
   - Conecta a tu base de datos Neon
   - Ejecuta `008_enhance_contracts_system.sql`
   - Ejecuta `009_tool_daily_limits.sql`

3. **Configura `.env.local`**:
   ```env
   DATABASE_URL=postgresql://...
   JWT_SECRET=your_local_secret
   CRON_SECRET=local_cron_secret_for_testing
   # ... resto de variables
   ```

4. **Inicia servidor de desarrollo**:
   ```bash
   npm run dev
   ```

5. **Prueba las herramientas**:
   - Ve a `http://localhost:3000/tools`
   - Haz login (crea un usuario de prueba si es necesario)
   - Selecciona la pestaña **"Analizadores"**
   - Ingresa números de 2, 3 o 4 cifras
   - Prueba las 3 herramientas:
     - 🔥 Números Calientes
     - ❄️ Números Fríos
     - 📊 Análisis de Patrones

6. **Prueba los contratos**:
   - Ve a `http://localhost:3000/contracts`
   - Crea un contrato semanal/mensual
   - Verifica que aparezca en la lista
   - Comprueba límites (1 sintético, 2 orgánicos)

7. **Prueba renovación automática**:
   - Crea un contrato con `auto_renew = true`
   - Ajusta manualmente `end_date` a hoy en la base de datos:
     ```sql
     UPDATE user_selections 
     SET end_date = CURRENT_DATE 
     WHERE id = X;
     ```
   - Llama al endpoint de renovación:
     ```bash
     curl -X GET http://localhost:3000/api/cron/renew-contracts \
       -H "Authorization: Bearer local_cron_secret_for_testing"
     ```
   - Verifica en DB que `end_date` se extendió

8. **Prueba límites de herramientas**:
   - Usa las herramientas 3 veces (usuario gratis)
   - En el 4to intento debe mostrar error de límite
   - Cambia `is_premium = true` en DB
   - Verifica que ahora tienes 10 usos disponibles

---

## 🚀 Despliegue

### Checklist Pre-Despliegue

- [ ] Migraciones ejecutadas en base de datos de producción
- [ ] Variables de entorno configuradas en Vercel
- [ ] `CRON_SECRET` generado y configurado
- [ ] Código subido al repositorio Git
- [ ] Tests locales pasados

### Pasos de Despliegue

1. **Push al repositorio**:
   ```bash
   git add .
   git commit -m "Features 23-26: Herramientas de análisis, contratos mejorados"
   git push origin main
   ```

2. **Deploy automático en Vercel**:
   - Vercel detectará el push automáticamente
   - Espera a que termine el build
   - Revisa los logs en Vercel Dashboard

3. **Configurar Cron Jobs**:
   - Mientras el deploy corre, configura los 4 cron jobs (ver sección anterior)
   - Usa URLs de **producción**: `https://your-domain.com/api/cron/...`

4. **Verificación Post-Deploy**:
   - [ ] Visita `https://your-domain.com/tools`
   - [ ] Verifica que aparece la pestaña "Analizadores"
   - [ ] Prueba crear un análisis de números calientes
   - [ ] Verifica que muestra el contador de usos restantes
   - [ ] Visita `https://your-domain.com/contracts`
   - [ ] Crea un contrato de prueba
   - [ ] Verifica que respeta los límites (1 sintético, 2 orgánicos)

5. **Monitoreo de Cron Jobs**:
   - Vercel Dashboard → Deployments → Logs
   - Filtra por "cron" para ver ejecuciones
   - Verifica que los 4 cron jobs se ejecutan sin errores
   - Primer ejecución esperada:
     - `reset-tool-limits`: Próximo 12:00 AM
     - `renew-contracts`: Próximo 3:00 AM
     - `deduct-credits`: Próximo 12:00 AM
     - `verify`: Próximo 9:00 PM

---

## 📊 Estructura de Datos

### Tabla `daily_tool_limits`

```sql
CREATE TABLE daily_tool_limits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_uses INTEGER DEFAULT 0,
  free_uses_remaining INTEGER DEFAULT 3,
  premium_uses_remaining INTEGER DEFAULT 10,
  last_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, usage_date)
);
```

### Tabla `tool_usage_tracking`

```sql
CREATE TABLE tool_usage_tracking (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  tool_name VARCHAR(100) NOT NULL,
  lottery_type VARCHAR(20) NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  usage_count INTEGER DEFAULT 1,
  is_premium_user BOOLEAN DEFAULT FALSE,
  input_numbers TEXT,
  result_summary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Columnas Nuevas en `user_selections`

```sql
ALTER TABLE user_selections ADD COLUMN IF NOT EXISTS 
  contract_duration VARCHAR(20) DEFAULT 'monthly',
  is_synthetic_target BOOLEAN DEFAULT FALSE,
  auto_renew BOOLEAN DEFAULT FALSE,
  renewal_attempts INTEGER DEFAULT 0,
  last_renewal_date TIMESTAMP;
```

---

## 🐛 Debugging y Troubleshooting

### Problema: "No tienes usos restantes"

**Causa**: Usuario alcanzó límite diario (3 gratis o 10 premium)

**Soluciones**:
1. Esperar al siguiente día (reinicia a las 12 AM)
2. Reiniciar manualmente en DB:
   ```sql
   DELETE FROM daily_tool_limits WHERE user_id = X;
   ```
3. Verificar que cron job `reset-tool-limits` se ejecuta:
   ```sql
   SELECT * FROM daily_tool_limits WHERE usage_date = CURRENT_DATE;
   ```

### Problema: Contratos no se renuevan automáticamente

**Diagnóstico**:
```sql
-- Ver contratos que deberían renovarse
SELECT * FROM user_selections 
WHERE auto_renew = true 
AND end_date <= CURRENT_DATE 
AND is_active = true;

-- Ver intentos de renovación
SELECT id, renewal_attempts, last_renewal_date 
FROM user_selections 
WHERE auto_renew = true;
```

**Soluciones**:
1. Verificar que cron job está configurado en Vercel
2. Revisar logs de cron en Vercel Dashboard
3. Verificar headers: `Authorization: Bearer CRON_SECRET`
4. Probar endpoint manualmente:
   ```bash
   curl -X GET https://your-domain.com/api/cron/renew-contracts \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

### Problema: Análisis no devuelve resultados

**Causa**: Base de datos sin suficientes resultados históricos

**Verificación**:
```sql
-- Verificar sorteos disponibles
SELECT lottery_type, country, COUNT(*) as total_draws
FROM lottery_results
WHERE draw_date >= CURRENT_DATE - INTERVAL '60 days'
GROUP BY lottery_type, country;
```

**Soluciones**:
1. Verificar que tabla `lottery_results` tiene datos recientes
2. Si está vacía, ejecutar `002_seed_data.sql` o agregar datos manualmente
3. Verificar que API de lotería está poblando resultados

### Problema: Límites no se aplican correctamente

**Diagnóstico**:
```sql
-- Ver estado actual de límites
SELECT u.id, u.username, u.is_premium, 
       dtl.total_uses, dtl.free_uses_remaining, dtl.premium_uses_remaining
FROM users u
LEFT JOIN daily_tool_limits dtl ON u.id = dtl.user_id 
WHERE dtl.usage_date = CURRENT_DATE;
```

**Soluciones**:
1. Verificar función `can_use_tool()`:
   ```sql
   SELECT can_use_tool(USER_ID);
   ```
2. Verificar que `record_tool_use()` se ejecuta correctamente
3. Revisar logs de server action `analyzeHotNumbersAction()`

---

## 📚 Referencias de Código

### Server Actions Principales

#### Herramientas de Análisis
```typescript
// app/actions/tool-analyzers.ts
export async function analyzeHotNumbersAction(
  userNumbers: string[],
  lotteryType: string,
  country: string
)

export async function analyzeColdNumbersAction(
  userNumbers: string[],
  lotteryType: string,
  country: string
)

export async function analyzeNumberPatternsAction(
  userNumbers: string[],
  lotteryType: string
)

export async function getUserDailyLimitsAction()
```

#### Contratos
```typescript
// app/actions/contracts.ts
export async function createContractActionV2(
  selectionType: "number" | "user",
  targetValue: string,
  contractDuration: "weekly" | "monthly",
  autoRenew: boolean = false
)

export async function getContractLimitsAction()

export async function renewContractAction(selectionId: number)
```

### Funciones SQL Clave

```sql
-- Verificar si usuario puede usar herramienta
SELECT can_use_tool(USER_ID);

-- Registrar uso de herramienta
SELECT record_tool_use(
  USER_ID,
  'hot_numbers',
  '3_cifras',
  TRUE, -- is_premium
  '{"numbers": ["123", "456"]}',
  'Encontrados 2 números calientes'
);

-- Obtener contratos por expirar (Feature 25)
SELECT * FROM get_expiring_contracts(1); -- 1 día antes

-- Auto-renovar contrato
SELECT auto_renew_contract(SELECTION_ID);

-- Contar contratos activos por tipo (Feature 26)
SELECT get_active_contracts_count(USER_ID, TRUE); -- sintéticos
SELECT get_active_contracts_count(USER_ID, FALSE); -- orgánicos
```

---

## 📝 Notas Finales

### Lo que Funciona ✅

1. **Herramientas de Análisis**:
   - 3 algoritmos funcionando: calientes, fríos, patrones
   - Límites de uso con tracking por día
   - UI completa con formularios y resultados
   - Reinicio automático diario

2. **Sistema de Contratos**:
   - Creación con límites (1 sintético, 2 orgánicos)
   - Renovación automática con ventana 0-9 AM
   - Notificaciones de vencimiento y renovación
   - Máximo 3 intentos por contrato

3. **Integración**:
   - Pestaña "Analizadores" en `/tools`
   - Página de contratos en `/contracts`
   - Header limpio (sin botón "Subir")
   - README actualizado con toda la info

### Próximos Pasos Opcionales 🎯

Si quieres mejorar aún más el sistema, considera:

1. **Analytics**: Agregar tracking de qué herramientas se usan más
2. **Historial**: Mostrar historial de análisis previos del usuario
3. **Exportar**: Permitir exportar resultados en CSV/PDF
4. **Favoritos**: Guardar análisis favoritos para referenciar después
5. **Comparación**: Comparar análisis de diferentes fechas
6. **Recomendaciones**: AI-powered sugerencias basadas en análisis históricos

### Soporte

Si encuentras problemas durante el despliegue:
1. Revisa logs en Vercel Dashboard
2. Verifica que todas las migraciones se ejecutaron
3. Confirma que variables de entorno están configuradas
4. Prueba endpoints de cron manualmente con curl
5. Consulta esta guía para troubleshooting

---

**Última Actualización**: Febrero 2025  
**Versión**: ForanLot v2.0 - Features 23-26 Completados ✅
