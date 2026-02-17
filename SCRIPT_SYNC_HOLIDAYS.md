# 🚀 SCRIPT: Sincronizar Festivos desde Excel

## ¿QUÉ HACE?

El script `parse-holidays-excel.ts` automatiza la lectura del archivo Excel de festivos y actualiza `lib/holidays-calendar.ts` automáticamente.

```
Excel (festivos.xlsx)
        ↓
    SCRIPT
        ↓
lib/holidays-calendar.ts (actualizado automáticmente)
```

---

## ✅ FLUJO DE TRABAJO ACTUALIZADO

### Antes (Manual):
```
1. Abres Excel
2. Copias manualmente cada festivo
3. Los pegas en lib/holidays-calendar.ts
4. Esperas a que no haya errores
```

### Ahora (Automático para festivos):
```
1. Actualizas el Excel (festivos.xlsx)
2. Corre: npm run sync-holidays
3. ✅ lib/holidays-calendar.ts actualizado automáticamente
4. Tú solo configuras manualmente los HORARIOS en lib/lotteries.ts
```

---

## 📖 CÓMO USAR

### Paso 1: Preparar el Excel
```
Archivo: c:\foranlot\public\festivos.xlsx
Pestaña: Hoja1 (o Sheet1)

Columnas necesarias:
├─ Fecha (formato: "01 Jan", "23-mar", "02 Apr", etc.)
├─ Día (opcional, para referencia)
├─ Nombre (nombre del festivo)
├─ Pais (país, generalmente "Colombia")
└─ año (año del festivo)
```

**El Excel que proporcionaste es perfecto:**
```
Fecha | Día | Nombre | Pais | año
01 Jan | Thu | Año Nuevo | Colombia | 2026
... más festivos ...
```

### Paso 2: Ejecutar el Script
```bash
npm run sync-holidays
```

**Salida esperada:**
```
======================================================================
📅 PARSER DE FESTIVOS DESDE EXCEL
======================================================================

📂 Leyendo: c:\foranlot\public\festivos.xlsx
📄 Pestañas encontradas: Hoja1
📊 Filas encontradas: 18
✅ 18 festivos parseados correctamente
📝 Leyendo: c:\foranlot\lib\holidays-calendar.ts
✅ Archivo actualizado: c:\foranlot\lib\holidays-calendar.ts

======================================================================
✅ ÉXITO: Festivos actualizados correctamente
======================================================================

📊 Resumen:
   Total de festivos: 18
   País: Colombia
   Rango de fechas: 2026-01-01 a 2026-12-25

✨ Próximo paso: Actualiza manualmente los horarios en lib/lotteries.ts
```

### Paso 3: Verificar
```bash
# Abre lib/holidays-calendar.ts y verifica que los festivos estén actualizados
# Los festivos deben estar en formato YYYY-MM-DD
```

---

## 🔄 CUÁNDO EJECUTAR

### Ejecuta el script cuando:
- ✅ Cambios en fechas de festivos
- ✅ Agregas nuevos festivos
- ✅ Actualizas festivos del año que viene
- ✅ Cambias el Excel

### NO ejecutes cuando:
- ❌ Solo cambias horarios (eso es en lib/lotteries.ts)
- ❌ No hay cambios en el Excel

---

## 📄 FORMATOS DE FECHA SOPORTADOS

El script reconoce automáticamente estos formatos de fecha:

```
"01 Jan"       → 2026-01-01
"23-mar"       → 2026-03-23
"02 Apr"       → 2026-04-02
"8-jun"        → 2026-06-08
"25 Dec"       → 2026-12-25
```

**En cualquier idioma:** español, inglés, con mayúsculas o minúsculas

---

## ⚙️ CÓMO FUNCIONA INTERNAMENTE

### El script:

1. **Lee el Excel**
   - Abre `/public/festivos.xlsx`
   - Lee la primera pestaña (Hoja1)
   - Convierte a JSON

2. **Parsea fechas**
   - Detecta automáticamente el formato
   - Soporta diez diferentes formatos
   - Convierte a YYYY-MM-DD

3. **Valida datos**
   - Verifica que tenga fecha y nombre
   - Avisa si hay errores
   - Continúa con lo válido

4. **Genera TypeScript**
   - Crea el array `COLOMBIAN_HOLIDAYS`
   - Mantiene el tipo `Holiday`
   - Ordena por fecha

5. **Actualiza archivo**
   - Preserva funciones de utilidad
   - Solo reemplaza el array
   - Guarda el archivo

---

## 🎯 EJEMPLO PRÁCTICO

### Tu Excel es:
```
Fecha   | Día | Nombre                  | Pais      | año
01 Jan  | Thu | Año Nuevo               | Colombia  | 2026
12 Jan  | Mon | Día de los Reyes Magos  | Colombia  | 2026
23-mar  | Mon | Día de San José         | Colombia  | 2026
...
```

### Ejecutas:
```bash
npm run sync-holidays
```

### Resultado en lib/holidays-calendar.ts:
```typescript
export const COLOMBIAN_HOLIDAYS: Holiday[] = [
  { date: "2026-01-01", name: "Año Nuevo", country: "Colombia", type: "festivo" },
  { date: "2026-01-12", name: "Día de los Reyes Magos", country: "Colombia", type: "festivo" },
  { date: "2026-03-23", name: "Día de San José", country: "Colombia", type: "festivo" },
  ...
]
```

---

## 🐛 SOLUCIONAR PROBLEMAS

### Problema: "Archivo no encontrado"
```
❌ Archivo no encontrado: c:\foranlot\public\festivos.xlsx
```
**Solución:** Asegúrate que el Excel esté en `/public/festivos.xlsx`

### Problema: "No se encontró el patrón"
```
❌ No se encontró el patrón 'export const COLOMBIAN_HOLIDAYS'
```
**Solución:** El archivo `lib/holidays-calendar.ts` está corrupto. Verifica que tenga la estructura correcta.

### Problema: "Fecha inválida"
```
⚠️ No se pudo parsear la fecha: "invalid format"
```
**Solución:** Usa uno de los formatos soportados (ver "Formatos de fecha soportados" arriba)

### Problema: "Permission denied"
```
EACCES: permission denied
```
**Solución:** En Windows, abre PowerShell *como administrador* y ejecuta el script

---

## 📊 VERIFICACIÓN

Después de ejecutar el script, verifica:

```bash
# 1. Abre el archivo generado
code lib/holidays-calendar.ts

# 2. Verifica que:
# - Tenga fechas en formato YYYY-MM-DD
# - Tenga la cantidad correcta de festivos (debe ser 18 en tu Excel)
# - No tengas errores de TypeScript

npm run lint

# 3. Si todo está bien, los festivos están sincronizados
```

---

## 🔄 FLUJO COMPLETO CON EL SCRIPT

```
1. EXCEL (festivos.xlsx)
   └─ Contiene 18 festivos

2. EJECUTAS: npm run sync-holidays
   ├─ Lee Excel
   ├─ Parsea fechas
   └─ Actualiza lib/holidays-calendar.ts ✅ AUTOMÁTICO

3. TÚ ACTUALIZAS: lib/lotteries.ts
   ├─ dayTypeHours.festivo
   ├─ dayTypeHours.sabado
   └─ dayTypeHours.domingo

4. VALIDAS: npm run lint
   └─ Verifica que todo esté bien

5. ¡LISTO! Sistema completo
```

---

## ✨ VENTAJAS

| Aspecto | Antes | Ahora |
|--------|-------|-------|
| Festivos | Manual ❌ | Automático ✅ |
| Horarios | Manual ❌ | Manual (tú controlas) ✅ |
| Errores | Posibles | Mínimos |
| Tiempo | 45 min | 15 min |

---

## 📋 CHECKLIST

- [ ] El Excel está en `/public/festivos.xlsx`
- [ ] El Excel tiene las columnas correctas
- [ ] Tienes al menos Node.js 18+
- [ ] Ejecutaste: `npm run sync-holidays`
- [ ] Viste "✅ ÉXITO" en la salida
- [ ] Verificaste que `lib/holidays-calendar.ts` esté actualizado
- [ ] No hay errores de `npm run lint`

---

## 💡 CONSEJOS

### Ejecutar regularmente
```bash
# Si cambias el Excel, ejecuta:
npm run sync-holidays

# Cada vez que actualices festivos
```

### Verificar cambios
```bash
# Ver qué cambió en lib/holidays-calendar.ts
git diff lib/holidays-calendar.ts

# Si todo está bien
git add lib/holidays-calendar.ts
git commit -m "chore: actualizar festivos desde Excel"
```

### Mantenimiento
- Mantén el Excel actualizado
- Ejecuta el script antes de hacer cambios en horarios
- Usa `npm run lint` para detectar errores

---

## 🎯 RESUMEN

```
ANTES:
Excel → Copia manual → Código → Errores → Correcciones

AHORA:
Excel → npm run sync-holidays → Código automático ✅
```

**¡Mucho más simple y seguro!**

---

**Script creado:** Febrero 15, 2026  
**Versión:** 1.0  
**Estado:** ✅ Listo para usar

