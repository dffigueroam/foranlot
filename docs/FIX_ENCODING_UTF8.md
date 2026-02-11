# Fix: Encoding UTF-8 para Nombres de Loterías

## Problema Identificado

Los nombres de loterías con caracteres especiales (ñ, tildes) se estaban guardando con encoding corrupto en la base de datos:
- "Antioque�ita" en vez de "Antioqueñita"
- "Caribe�a" en vez de "Caribeña"
- "ma�ana" en vez de "mañana"

## Causa

El método `file.text()` no estaba manejando correctamente el encoding UTF-8 al leer archivos CSV.

## Solución Implementada

### 1. Fix en Carga de CSV (`upload-lottery-results.ts`)

**Cambio**: Usar `TextDecoder` con UTF-8 explícito

```typescript
// ANTES (incorrecto)
const content = await file.text()

// DESPUÉS (correcto)
const buffer = await file.arrayBuffer()
const decoder = new TextDecoder('utf-8')
const content = decoder.decode(buffer)
```

**Normalización adicional**:
```typescript
const lotteryName = values[col.lottery]?.trim()
```

### 2. Simplificación en Verificación (`verification.ts`)

**Cambio**: Eliminar `translate()` y usar comparación directa

```typescript
// ANTES (complejo y fallaba)
AND LOWER(
  translate(lottery_name, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')
) = LOWER(
  translate(${result.lottery_name}, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')
)

// DESPUÉS (simple y funciona)
AND LOWER(TRIM(lottery_name)) = LOWER(TRIM(${result.lottery_name}))
```

**Razón**: Si los nombres se guardan correctamente con UTF-8, la comparación directa funciona perfectamente.

### 3. Actualización de Definiciones (`lotteries.ts`)

- Agregada: "Caribeña Dia" que faltaba en la lista
- Confirmado que todos los nombres usan UTF-8 correcto

## Pasos para Corregir Datos Existentes

### Paso 1: Ejecutar Script de Limpieza

Ejecuta el script SQL en tu base de datos:

```bash
# En la consola de tu proveedor (Neon, etc.)
# O usando herramienta SQL
```

Archivo: `scripts/fix-lottery-names-encoding.sql`

Este script:
1. Corrige nombres con caracteres corruptos (� → ñ, tildes correctas)
2. Normaliza capitalización (Title Case)
3. Actualiza tanto `lottery_results` como `predictions`

### Paso 2: Re-cargar CSV con Nuevo Código

Después de ejecutar el script de limpieza:
1. Ve al panel de administración
2. Vuelve a cargar los archivos CSV con resultados
3. Los nombres ahora se guardarán correctamente con UTF-8

### Paso 3: Verificar Predicciones

Una vez corregidos los nombres:
1. Ve a Admin → Verificación
2. Haz clic en "Verificar con resultados cargados"
3. Las predicciones con "Antioqueñita", "Caribeña", etc. ahora validarán correctamente

## Validación

Para confirmar que todo funciona, ejecuta este query:

```sql
-- Ver nombres correctos
SELECT DISTINCT lottery_name 
FROM lottery_results 
WHERE draw_date = '2026-02-09'
ORDER BY lottery_name;
```

Deberías ver:
- ✅ "Antioqueñita Dia" (no "Antioque�ita")
- ✅ "Caribeña Dia" (no "Caribe�a")
- ✅ "Dorado Mañana" (no "ma�ana")

## Prevención Futura

Con los cambios implementados, **todos los futuros archivos CSV preservarán automáticamente** los caracteres especiales españoles:

- ñ Ñ
- á é í ó ú
- Á É Í Ó Ú
- ü Ü

## Archivos Modificados

1. `app/admin/actions/upload-lottery-results.ts` - UTF-8 explícito en lectura
2. `lib/verification.ts` - Comparación directa sin translate()
3. `lib/lotteries.ts` - Agregada "Caribeña Dia"
4. `scripts/fix-lottery-names-encoding.sql` - Script de limpieza (nuevo)

## Notas Técnicas

- **TextDecoder('utf-8')**: API estándar de JavaScript para decodificación de caracteres
- **LOWER(TRIM())**: PostgreSQL maneja UTF-8 nativamente, no necesita normalización
- **Case-insensitive**: La comparación con LOWER() permite variaciones ("Dia" = "dia")

---

**Fecha**: Febrero 10, 2026  
**Estado**: ✅ Implementado y probado
