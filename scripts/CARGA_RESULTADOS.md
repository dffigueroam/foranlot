# Guía de Carga de Resultados

Este documento explica cómo cargar resultados de loterías desde un archivo CSV.

## Problema de Encoding (ñ, tildes)

Si al cargar resultados ves que las **ñ** o **tildes** aparecen mal (caracteres extraños), sigue estos pasos:

### Paso 1: Verificar y Corregir Encoding del CSV

Ejecuta este comando en PowerShell:

```bash
npm run fix-csv
```

Esto convertirá el archivo `public/UltResultsApp.csv` a **UTF-8 con BOM**, preservando todos los caracteres especiales.

### Paso 2: Instalar Dependencias

Si es la primera vez que ejecutas el script:

```bash
npm install
```

### Paso 3: Cargar Resultados

```bash
npm run load-results
```

## Formato del Archivo CSV

El archivo debe estar en `public/UltResultsApp.csv` con este formato:

```
lottery_name;winning_number;digits_4;digits_3;digits_2;draw_date
Dorado Mañana;1950;1950;950;50;2026-02-09
Cafeterito Tarde;2037;2037;037;37;2026-02-09
Antioqueñita Día;1896;1896;896;96;2026-02-09
```

**Columnas:**
- `lottery_name`: Nombre de la lotería (con ñ y tildes)
- `winning_number`: Número ganador completo
- `digits_4`: Últimas 4 cifras
- `digits_3`: Últimas 3 cifras
- `digits_2`: Últimas 2 cifras
- `draw_date`: Fecha en formato YYYY-MM-DD

## Solución de Problemas

### Caracteres extraños en nombres

Si después de cargar ves `CafÃ©` en lugar de `Café`:

1. Ejecuta `npm run fix-csv` de nuevo
2. Abre el archivo CSV en Notepad++ o VS Code
3. Verifica que el encoding sea "UTF-8 con BOM"
4. Vuelve a ejecutar `npm run load-results`

### Errores de validación

Si ves errores como "value too long for type character varying(4)":

- Ya está solucionado con el script `017_expand_winning_number_field.sql`
- Verifica que lo hayas ejecutado en Neon

### CSV no encontrado

Verifica que el archivo esté en:
```
public/UltResultsApp.csv
```

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run fix-csv` | Convierte CSV a UTF-8 con BOM |
| `npm run load-results` | Carga resultados desde CSV a base de datos |

## Notas Técnicas

- El script usa `normalize('NFC')` para preservar composición canónica de caracteres
- `readFileSync` con `{ encoding: 'utf-8' }` asegura lectura correcta
- El matching en `verification.ts` usa normalización solo para comparación, no para guardar datos
