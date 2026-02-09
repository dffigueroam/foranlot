# Pronósticos Chance - Plataforma de Predicciones de Lotería

Plataforma completa para pronósticos del chance con sistema de membresías, ranking, y distribución de ganancias.

## Características Principales

- 🎯 **Pronósticos de Lotería**: Soporta 2, 3 y 4 cifras
- 👥 **Sistema de Usuarios**: Autenticación segura con bcrypt
- 💳 **Membresías Premium**: Integración con Stripe para suscripciones
- 🏆 **Ranking y Estadísticas**: Gráficos con colores para identificar aciertos
- ⭐ **Sistema de Créditos**: Los usuarios premium pueden seguir números y usuarios
- � **Contratos de Seguimiento**: Sistema de contratos semanales/mensuales con límites diferenciados (1 sintético, 2 orgánicos por mes)
- 🔄 **Renovación Automática**: Los contratos se renuevan automáticamente si el usuario tiene créditos
- 🔔 **Notificaciones**: Sistema interno para alertas de créditos, vencimientos y renovaciones
- 💰 **Distribución de Ganancias**: 20% para usuarios que postean, 80% para la plataforma
- 🤖 **Verificación Automática**: Integración con API de lotería
- 🔧 **Herramientas de Análisis**: 
  - 🔥 **Números Calientes**: Detecta números frecuentes en últimos 15 sorteos con coincidencia de posiciones
  - ❄️ **Números Fríos**: Identifica dígitos que no han salido en posiciones específicas
  - 📊 **Análisis de Patrones**: Detecta secuencias, sumas balanceadas, repeticiones
- 📈 **Límites de Uso**: 3 análisis/día gratis, 10 análisis/día premium por herramienta

## Configuración de Cron Jobs

Para que el sistema funcione correctamente, necesitas configurar **cuatro** cron jobs en Vercel:

### 1. Verificación Diaria de Resultados

**Endpoint**: `/api/cron/verify`  
**Frecuencia**: Diariamente a las 9:00 PM  
**Cron Expression**: `0 21 * * *`

Este cron job verifica automáticamente los pronósticos del día comparándolos con los resultados oficiales de la API de lotería.

### 2. Descuento Diario de Créditos

**Endpoint**: `/api/cron/deduct-credits`  
**Frecuencia**: Diariamente a las 12:00 AM  
**Cron Expression**: `0 0 * * *`

Este cron job descuenta 1 crédito por día de cada selección activa de los usuarios premium.

### 3. Renovación Automática de Contratos

**Endpoint**: `/api/cron/renew-contracts`  
**Frecuencia**: Diariamente a las 3:00 AM  
**Cron Expression**: `0 3 * * *`

Este cron job procesa automáticamente las renovaciones de contratos en la ventana de 0-9 AM. Renueva contratos si el usuario tiene créditos disponibles y está habilitada la renovación automática.

### 4. Reinicio de Límites de Herramientas

**Endpoint**: `/api/cron/reset-tool-limits`  
**Frecuencia**: Diariamente a las 12:00 AM  
**Cron Expression**: `0 0 * * *`

Este cron job reinicia los contadores de uso diario de las herramientas analíticas (3 usos gratis, 10 usos premium).

### Configurar en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Navega a Settings → Cron Jobs
3. Agrega los dos cron jobs con sus respectivas configuraciones
4. Asegúrate de que la variable de entorno `CRON_SECRET` esté configurada

## Variables de Entorno Requeridas

```env
# Base de datos (Neon PostgreSQL)
DATABASE_URL=your_neon_database_url

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Autenticación
JWT_SECRET=your_secret_key_minimum_32_characters

# Cron Jobs
CRON_SECRET=your_random_secret_for_cron_protection

# API de Lotería (opcional)
LOTTERY_API_KEY=your_lottery_api_key
```

## Instalación y Desarrollo

1. Clona el repositorio
2. Instala las dependencias: `npm install`
3. Configura las variables de entorno (ver sección abajo)
4. Ejecuta los scripts SQL en orden:
   - `scripts/001_create_tables.sql` - Tablas base
   - `scripts/002_seed_data.sql` - Datos iniciales
   - `scripts/003_create_credits_system.sql` - Sistema de créditos
   - `scripts/004_create_manual_payments.sql` - Pagos manuales
   - `scripts/005_create_tools_system.sql` - Sistema de herramientas
   - `scripts/006_remove_draw_time.sql` - Limpieza de esquema
   - `scripts/008_enhance_contracts_system.sql` - Contratos con renovación automática
   - `scripts/009_tool_daily_limits.sql` - Límites diarios de herramientas
5. Inicia el servidor de desarrollo: `npm run dev`
6. Configura los cron jobs en Vercel (ver sección de Cron Jobs)

## Sistema de Créditos

### Para Usuarios Premium

- **Mensual**: 30 créditos al suscribirse
- **Anual**: 365 créditos al suscribirse
- Cada selección activa consume 1 crédito por día
- Las selecciones se desactivan automáticamente al quedarse sin créditos
- Notificaciones cuando quedan 5 créditos o menos

### Tipos de Selecciones

1. **Por Número**: Sigue un número específico y recibe pronósticos de cualquier usuario que lo publique
2. **Por Usuario**: Sigue todos los pronósticos de un usuario específico

## Sistema de Contratos

### Tipos de Contratos

Los contratos permiten seguir números o usuarios por períodos definidos:

- **Semanal**: 7 días de seguimiento (costo: 7 créditos)
- **Mensual**: 30 días de seguimiento (costo: 30 créditos)

### Límites por Tipo de Usuario

Para evitar abuso del sistema, existen límites mensuales:

- **Usuarios Sintéticos** (del ranking): Máximo **1 contrato activo** por mes
- **Usuarios Orgánicos** (reales): Máximo **2 contratos activos** por mes

### Renovación Automática

Los contratos pueden configurarse con renovación automática:

1. Al vencimiento, si el usuario tiene créditos suficientes, el contrato se renueva automáticamente
2. Ventana de renovación: entre las **0:00 y 9:00 AM** del día siguiente al vencimiento
3. El usuario recibe notificaciones:
   - El día que vence el contrato
   - Si la renovación fue exitosa
   - Si no se pudo renovar por falta de créditos
4. Máximo 3 intentos de renovación por contrato

## Herramientas de Análisis

### Límites de Uso

- **Usuarios Gratis**: 3 usos totales por día (entre todas las herramientas)
- **Usuarios Premium**: 10 usos por herramienta por día

Los límites se reinician automáticamente a las 12:00 AM.

### Herramientas Disponibles

#### 🔥 Números Calientes

Analiza los últimos 15 sorteos del país seleccionado y detecta:
- Números que se repiten con mayor frecuencia
- Validación de coincidencia en al menos 2 posiciones con tus números
- Calidad de coincidencia: Excelente (3+ posiciones), Buena (2 posiciones), Parcial (1 posición)
- Fecha del último sorteo donde apareció

#### ❄️ Números Fríos

Examina los últimos 60 días y detecta:
- Dígitos específicos que no han aparecido en sus posiciones exactas
- Estado por antigüedad:
  - **Muy Frío**: Más de 30 días sin salir
  - **Frío**: Entre 15 y 30 días sin salir
  - **Tibio**: Menos de 15 días sin salir
- Análisis por posición específica (unidades, decenas, centenas, etc.)

#### 📊 Análisis de Patrones

Detecta patrones estadísticos en tus números:
- **Secuencias**: Números consecutivos ascendentes o descendentes
- **Repeticiones**: Dígitos repetidos en el número
- **Suma Balanceada**: Suma de dígitos en rangos óptimos
- Nivel de confianza: Alto, Medio, Bajo

## Distribución de Ganancias

Cada pago de membresía se distribuye así:
- **80%** para la plataforma
- **20%** distribuido entre usuarios con aciertos verificados del último mes, proporcionalmente según sus aciertos

## Tecnologías

- **Framework**: Next.js 16 con App Router
- **Base de Datos**: Neon PostgreSQL
- **Pagos**: Stripe
- **Autenticación**: JWT con bcrypt
- **UI**: shadcn/ui + Tailwind CSS v4
- **Gráficos**: Recharts
- **TypeScript**: Full type safety

## Estructura del Proyecto

```
├── app/
│   ├── (auth)/          # Páginas de autenticación
│   ├── actions/         # Server Actions
│   │   ├── contracts.ts  # Gestión de contratos
│   │   └── tool-analyzers.ts  # Acciones de herramientas de análisis
│   ├── api/             # API Routes y webhooks
│   │   └── cron/        # Endpoints para cron jobs
│   ├── contracts/       # Página de contratos
│   ├── dashboard/       # Dashboard de usuario
│   ├── ranking/         # Página de ranking
│   ├── selections/      # Gestión de selecciones premium
│   ├── stats/           # Estadísticas y gráficos
│   └── tools/           # Herramientas de análisis
├── components/
│   ├── auth/            # Componentes de autenticación
│   ├── charts/          # Gráficos de estadísticas
│   ├── contracts/       # Sistema de contratos
│   ├── credits/         # Sistema de créditos
│   ├── layout/          # Header y layout
│   ├── notifications/   # Centro de notificaciones
│   ├── predictions/     # Sistema de pronósticos
│   ├── ranking/         # Tablas de ranking
│   └── tools/           # Herramientas analíticas
│       └── number-analyzer-tools.tsx  # Analizadores de números
├── lib/
│   ├── auth.ts          # Funciones de autenticación
│   ├── contracts.ts     # Gestión de contratos y renovaciones
│   ├── credits.ts       # Sistema de créditos
│   ├── predictions.ts   # Gestión de pronósticos
│   ├── ranking.ts       # Cálculo de rankings
│   ├── tool-analyzers.ts # Algoritmos de análisis (calientes, fríos, patrones)
│   └── verification.ts  # Verificación automática
└── scripts/             # Scripts SQL para base de datos
    ├── 008_enhance_contracts_system.sql  # Contratos + renovación automática
    └── 009_tool_daily_limits.sql        # Límites de uso de herramientas
```

## Soporte

Para soporte o preguntas, contacta al equipo de desarrollo.
