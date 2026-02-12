# Sistema de Estrategias Avanzadas Premium

## 🎯 Funcionalidad Implementada

Los usuarios premium ahora pueden crear **estrategias inteligentes** basadas en análisis de sorteos anteriores con:
- ✅ Extracción de posiciones específicas de cifras
- ✅ Operaciones matemáticas (sumar/restar valores)
- ✅ Múltiples reglas combinables
- ✅ Análisis de sorteos históricos (hasta 10 sorteos atrás)
- ✅ Generación automática de predicciones

---

## 📋 Tipos de Reglas Disponibles

### 1. **Copiar Posición**
Extrae un dígito de una posición específica del sorteo histórico y lo coloca en el número generado.

**Ejemplo:**
- Sorteo anterior: `1234`
- Regla: Copiar posición 2 → colocar en posición 1
- Resultado: `2XXX` (X = aleatorio)

### 2. **Sumar a Posición**
Extrae un dígito, le suma un valor (0-9), y coloca el resultado normalizado (módulo 10).

**Ejemplo:**
- Sorteo anterior: `1234`
- Regla: Tomar posición 1 (valor: 2), sumar 3
- Resultado: `5XXX` (2+3=5)

### 3. **Restar a Posición**
Extrae un dígito, le resta un valor, y normaliza el resultado.

**Ejemplo:**
- Sorteo anterior: `1234`
- Regla: Tomar posición 3 (valor: 4), restar 2
- Resultado: `XX2X` (4-2=2)

### 4. **Último Dígito**
Usa el último dígito del sorteo completo para generar el número.

**Ejemplo:**
- Sorteo anterior: `1234` → último dígito = 4
- Resultado: `4444`

### 5. **Espejo (Mirror)**
Invierte el resultado histórico.

**Ejemplo:**
- Sorteo anterior: `1234`
- Resultado: `4321`

---

## 🔄 Modos de Combinación

### **Secuencial**
Cada regla genera números independientes.
- Si tienes 3 reglas y generas 9 números → 3 por cada regla

### **Combinado**
Todas las reglas trabajan juntas para construir cada número.
- Cada regla aplica a una parte del número final
- Genera números más coherentes con la estrategia completa

---

## 📊 Análisis de Sorteos Históricos

Cada regla puede analizar diferentes sorteos pasados:
- **Último sorteo** (1 día atrás)
- **Penúltimo** (2 días atrás)
- **Antepenúltimo** (3 días atrás)
- **5 sorteos atrás**
- **10 sorteos atrás**

Esto permite crear estrategias que identifiquen patrones a diferentes escalas temporales.

---

## 🏗️ Arquitectura Técnica

### Archivos Modificados/Creados

#### 1. **lib/strategy-generator.ts** (Reescrito)
```typescript
// Interfaces principales
interface StrategyRule {
  id: string
  type: "position" | "sum" | "subtract" | "last_digit" | "mirror"
  sourcePosition?: number  // 0-indexed
  targetPosition?: number  // 0-indexed
  operation?: "add" | "subtract"
  value?: number  // 0-9
  lookbackDays?: number  // 1-15
}

interface StrategyParameters {
  rules: StrategyRule[]
  combineLogic: "sequential" | "combinations"
  limitPerRule?: number
}

// Funciones principales
- generatePredictionsFromStrategy() // Motor principal
- extractDigitFromPosition() // Extrae dígito de posición
- applyOperation() // Aplica suma/resta normalizada
- normalizeToDigit() // Asegura valor 0-9
```

**Lógica de Generación:**
1. Lee resultados históricos (últimos 15)
2. Aplica cada regla según su tipo
3. Normaliza resultados (módulo 10)
4. Combina según modo seleccionado
5. Genera hasta 10 predicciones únicas

#### 2. **components/dashboard/strategy-builder.tsx** (Nuevo)
Componente UI para construir estrategias visualmente:
- Gestión de múltiples reglas (hasta 10)
- Selección de tipo de regla
- Configuración de posiciones origen/destino
- Valores para operaciones
- Selección de sorteo a analizar
- Descripción en tiempo real de cada regla

#### 3. **components/dashboard/strategy-simulator.tsx** (Actualizado)
Integra el StrategyBuilder con tabs:
- **Tab "Configurar"**: Selección de lotería + constructor de reglas
- **Tab "Simular"**: Ejecuta la estrategia y muestra resultados

#### 4. **app/api/strategies/simulate/route.ts** (Actualizado)
```typescript
// Usa el nuevo generador con parámetros
const parameters: StrategyParameters = strategy.parameters || {
  rules: [],
  combineLogic: "sequential"
}

const combinations = generatePredictionsFromStrategy(
  results,  // Últimos 15 resultados
  strategy.digits_type,  // 3, 4 o 5 dígitos
  parameters,  // Reglas de la estrategia
  10  // Máximo de combinaciones
)
```

---

## 💾 Estructura de Datos

### Tabla `user_strategies` (Campo `parameters`)
```json
{
  "rules": [
    {
      "id": "1707678000000",
      "type": "sum",
      "sourcePosition": 1,
      "targetPosition": 0,
      "operation": "add",
      "value": 3,
      "lookbackDays": 1
    },
    {
      "id": "1707678001000",
      "type": "position",
      "sourcePosition": 3,
      "targetPosition": 2,
      "lookbackDays": 2
    }
  ],
  "combineLogic": "sequential",
  "limitPerRule": 5
}
```

---

## 🎮 Flujo de Usuario

### 1. **Crear Estrategia**
```
Dashboard → Card "Estrategia Inteligente Premium" → Tab "Configurar"
↓
Seleccionar lotería (ej: Medellín)
↓
Seleccionar dígitos (ej: 4 dígitos)
↓
Añadir reglas:
  - Regla 1: Sumar 2 a posición 1 del último sorteo
  - Regla 2: Copiar posición 3 del penúltimo sorteo
↓
Guardar Estrategia
```

### 2. **Simular Estrategia**
```
Tab "Simular" (ahora habilitado)
↓
Click "Ejecutar Simulación"
↓
Sistema analiza últimos 15 resultados
↓
Genera 10 números según reglas
↓
Compara con resultados históricos
↓
Muestra:
  - Cantidad de aciertos
  - Números que acertaron (verde)
  - Todas las combinaciones generadas
```

### 3. **Cambiar Estrategia**
```
Click "Cambiar Estrategia"
↓
Vuelve a Tab "Configurar"
↓
Modifica reglas o selecciona otra lotería
↓
Guardar (reemplaza la estrategia anterior)
```

---

## 🧪 Ejemplos de Estrategias

### **Estrategia de Tendencia**
```json
{
  "rules": [
    {
      "type": "sum",
      "sourcePosition": 0,
      "targetPosition": 0,
      "value": 1,
      "lookbackDays": 1
    }
  ],
  "combineLogic": "sequential"
}
```
**Lógica:** Si el primer dígito del último sorteo fue 3, genera 4XXX (3+1).

### **Estrategia de Posiciones Cruzadas**
```json
{
  "rules": [
    {
      "type": "position",
      "sourcePosition": 0,
      "targetPosition": 3,
      "lookbackDays": 1
    },
    {
      "type": "position",
      "sourcePosition": 3,
      "targetPosition": 0,
      "lookbackDays": 1
    }
  ],
  "combineLogic": "combinations"
}
```
**Lógica:** Intercambia primer y último dígito del sorteo anterior.

### **Estrategia Temporal Múltiple**
```json
{
  "rules": [
    { "type": "position", "sourcePosition": 0, "lookbackDays": 1 },
    { "type": "position", "sourcePosition": 1, "lookbackDays": 5 },
    { "type": "position", "sourcePosition": 2, "lookbackDays": 10 }
  ],
  "combineLogic": "sequential"
}
```
**Lógica:** Analiza 3 momentos diferentes del historial (reciente, medio, antiguo).

---

## 🔐 Seguridad y Validaciones

### Servidor (API Routes)
- ✅ Autenticación JWT obligatoria
- ✅ Validación de usuario premium
- ✅ Verificación de que la lotería tenga ≥15 resultados
- ✅ Normalización de valores (módulo 10)
- ✅ Límite de 10 reglas por estrategia

### Cliente (React)
- ✅ Validación de formularios
- ✅ Límites de valores (0-9 para operaciones)
- ✅ Posiciones válidas según cantidad de dígitos
- ✅ Descripción en tiempo real de cada regla

### Base de Datos
- ✅ Campo `parameters` como JSONB (flexible)
- ✅ Constraint UNIQUE en user_id (1 estrategia por usuario)
- ✅ Validación de digits_type (3, 4, 5)

---

## 📈 Ventajas del Sistema

### Para Usuarios
1. **Control Total**: Define exactamente qué analizar y cómo
2. **Basado en Datos**: Usa resultados históricos reales
3. **Flexibilidad**: Combina múltiples reglas
4. **Aprendizaje**: Descripción clara de cada regla

### Para el Proyecto
1. **Diferenciación**: Feature único vs competencia
2. **Valor Premium**: Justifica la suscripción
3. **Escalabilidad**: Fácil añadir nuevos tipos de reglas
4. **Extensibilidad**: Campo JSONB permite evolucionar

---

## 🚀 Próximas Mejoras Opcionales

### 1. **Estadísticas de Rendimiento**
```sql
CREATE TABLE strategy_performance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  simulation_date DATE,
  hits INTEGER,
  total_predictions INTEGER,
  accuracy DECIMAL(5,2),
  strategy_snapshot JSONB
);
```

### 2. **Reglas Adicionales**
- **Hot/Cold Numbers**: Detectar números frecuentes/raros
- **Gaps**: Analizar distancia entre repeticiones
- **Patterns**: Detectar secuencias (ej: consecutivos, pares)
- **Modular**: Aplicar módulo X a resultados

### 3. **Plantillas de Estrategias**
```typescript
const templates = [
  { name: "Tendencia Ascendente", rules: [...] },
  { name: "Espejo Temporal", rules: [...] },
  { name: "Posiciones Cruzadas", rules: [...] }
]
```

### 4. **Backtesting Automático**
Simular la estrategia contra todos los resultados históricos y mostrar accuracy.

### 5. **Exportación**
- Descargar predicciones como CSV
- Copiar al portapapeles
- Compartir estrategia (link/código)

---

## 🐛 Solución de Problemas

### Error: "No hay resultados históricos"
**Causa:** La lotería seleccionada tiene <15 resultados en la BD  
**Solución:** Cargar más datos históricos o seleccionar otra lotería

### Números generados son todos iguales
**Causa:** Regla con `combineLogic: "combinations"` y una sola regla que genera valor fijo  
**Solución:** Añadir más reglas o usar modo "sequential"

### Estrategia no genera aciertos
**Causa:** Las reglas no capturan patrones válidos  
**Solución:** Experimentar con diferentes combinaciones y lookback periods

---

## 📝 Testing

### Test Manual Rápido
```bash
# 1. Login como usuario premium
# 2. Dashboard → Estrategia Inteligente Premium
# 3. Configurar:
#    - Lotería: Medellín
#    - Dígitos: 4
#    - Regla 1: Sumar 1 a posición 0 del último sorteo
# 4. Guardar Estrategia
# 5. Ejecutar Simulación
# 6. Verificar: 10 números generados, hits calculados
```

### Test de Validación
```typescript
// En browser console:
const params = {
  rules: [{
    id: "test",
    type: "sum",
    sourcePosition: 0,
    targetPosition: 0,
    value: 3,
    lookbackDays: 1
  }],
  combineLogic: "sequential"
}

// Debe guardarse correctamente en parameters JSONB
```

---

## 💡 Casos de Uso Reales

### Usuario Principiante
**Estrategia Simple:**
- 1 regla: Copiar posición 3 del último sorteo
- Modo: Sequential
- **Objetivo:** Entender el sistema

### Usuario Intermedio
**Estrategia de Tendencia:**
- 3 reglas: Sumar 1/2/3 a diferentes posiciones
- Modo: Sequential
- **Objetivo:** Explorar variaciones

### Usuario Avanzado
**Estrategia Compleja:**
- 5+ reglas combinando tipos diferentes
- Múltiples lookback periods
- Modo: Combinations
- **Objetivo:** Maximizar precision

---

**Implementado:** 11 de Febrero, 2026  
**Estado:** ✅ Funcional y probado  
**Versión:** 1.0 - Sistema Avanzado de Estrategias
