# Configuración de Sincronización Dropbox

Este documento explica cómo configurar la integración con Dropbox para cargar resultados automáticamente.

## 1. Crear App en Dropbox

1. Ve a [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Click en "Create app"
3. Selecciona:
   - **Scoped access**
   - **Full Dropbox** (o "App folder" si prefieres acceso limitado)
   - Nombre: `ForanLot Results Sync`

## 2. Configurar Permisos

En la app que creaste:

1. Ve a la pestaña **Permissions**
2. Activa los siguientes scopes:
   - `files.metadata.read`
   - `files.content.read`
3. Click en **Submit**

## 3. Generar Access Token

1. Ve a la pestaña **Settings**
2. En la sección "OAuth 2", encuentra "Generated access token"
3. Click en **Generate** (o **Regenerate** si ya existe uno)
4. **Copia el token** - lo necesitarás en el siguiente paso

⚠️ **IMPORTANTE**: Este token da acceso completo a tu Dropbox. Nunca lo compartas ni lo subas a repositorios públicos.

## 4. Configurar Variables de Entorno

Agrega estas variables a tu archivo `.env.local`:

```env
# Dropbox Configuration
DROPBOX_ACCESS_TOKEN=sl.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DROPBOX_FILE_PATH=/resultados-loteria.csv
```

**Explicación:**
- `DROPBOX_ACCESS_TOKEN`: El token que generaste en el paso 3
- `DROPBOX_FILE_PATH`: Ruta al archivo CSV en tu Dropbox (debe empezar con `/`)

## 5. Formato del Archivo CSV

El archivo CSV debe tener el siguiente formato:

```csv
lottery_name,winning_number,draw_date
Baloto,123456,2026-02-05
Chance,789,2026-02-05
Fantástica,4567,2026-02-05
```

**Columnas requeridas:**
1. `lottery_name`: Nombre de la lotería (ej: Baloto, Chance, Fantástica)
2. `winning_number`: Número ganador como string (preserva ceros iniciales)
3. `draw_date`: Fecha en formato `YYYY-MM-DD`

**Notas importantes:**
- La primera fila puede ser header (será detectada automáticamente)
- Números con ceros iniciales se preservan (ej: `001`, `0456`)
- Formato de fecha: `YYYY-MM-DD` (año-mes-día con 4 y 2 dígitos)

## 6. Ubicar el Archivo en Dropbox

1. Sube tu archivo CSV a Dropbox
2. Obtén la ruta exacta del archivo:
   - Si está en la raíz: `/resultados-loteria.csv`
   - Si está en carpeta: `/resultados/loteria.csv`
3. Asegúrate de que la ruta en `.env.local` coincida exactamente

## 7. Probar la Integración

1. Reinicia tu servidor Next.js (`npm run dev`)
2. Ve al **Panel de Administración** (`/admin`)
3. Click en la pestaña **Sincronización**
4. Deberías ver:
   - ✅ Estado: Conectado
   - Información del archivo (nombre, tamaño, última modificación)
5. Click en **Sincronizar Ahora** para cargar los resultados

## 8. Sistema de Alarmas

El panel te alertará si:

### ⚠️ Archivo Desactualizado
- **Condición**: El archivo no ha sido modificado en las últimas 24 horas
- **Solución**: Actualiza el archivo en Dropbox o sincroniza manualmente

### ❌ Archivo No Encontrado
- **Condición**: La ruta en `DROPBOX_FILE_PATH` no existe
- **Solución**: Verifica que la ruta sea correcta y que el archivo exista

### ❌ Error de Acceso
- **Condición**: Token inválido o sin permisos
- **Solución**: Regenera el token y verifica los permisos de la app

## 9. Sincronización Automática (Opcional)

Para automatizar la sincronización cada hora, puedes configurar un cron job de Vercel:

### En Vercel Dashboard:

1. Ve a tu proyecto → **Settings** → **Cron Jobs**
2. Agrega un nuevo cron job:
   - **Path**: `/api/admin/sync-dropbox`
   - **Schedule**: `0 * * * *` (cada hora, al minuto 0)
   - **Method**: POST
   - **Headers**: 
     - `Authorization: Bearer [TU_CRON_SECRET]`

3. Agrega `CRON_SECRET` a tus variables de entorno en Vercel

### Actualizar el endpoint:

Modifica `/api/admin/sync-dropbox/route.ts` para aceptar cron jobs:

```typescript
// Verificar si es cron job
const authHeader = request.headers.get("authorization")
const isCronJob = authHeader === `Bearer ${process.env.CRON_SECRET}`

if (!isCronJob) {
  // Verificar usuario admin
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }
}
```

## 10. Auditoría y Logs

Todas las sincronizaciones se registran en la tabla `lottery_sync_audit`:

- **source**: `dropbox`
- **status**: `success`, `failed`, o `partial`
- **rows_processed**: Cantidad de resultados insertados
- **error_message**: Detalles de errores (si los hay)
- **synced_at**: Fecha y hora de sincronización

Puedes consultar el historial en el panel de administración.

## 11. Troubleshooting

### Error: "DROPBOX_ACCESS_TOKEN not configured"
- Verifica que agregaste el token a `.env.local`
- Reinicia el servidor después de agregar variables de entorno

### Error: "No se pudo acceder al archivo"
- Verifica que `DROPBOX_FILE_PATH` sea correcto
- Asegúrate de que el archivo existe en Dropbox
- Revisa que el path empiece con `/`

### Error: "Archivo CSV vacío o formato inválido"
- Verifica que el archivo tenga al menos una fila de datos
- Asegúrate de que use comas (`,`) como separador
- Revisa que las columnas estén en el orden correcto

### Sincronización parcial
- Revisa los logs en el panel de administración
- Busca filas con formato de fecha incorrecto
- Verifica que los nombres de loterías sean válidos

## 12. Seguridad

- ✅ El token de Dropbox nunca se envía al cliente
- ✅ Solo usuarios con rol `admin` pueden sincronizar
- ✅ Todas las sincronizaciones quedan auditadas
- ✅ El token está en variables de entorno, no en el código

---

**¿Necesitas ayuda?** Contacta al equipo de desarrollo.
