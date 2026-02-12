import "server-only"

/* ======================================================
   INTERFACES
====================================================== */

export interface StrategyRule {
  id: string
  type: "position" | "sum" | "subtract" | "last_digit" | "mirror"
  sourcePosition?: number // Posición a extraer (0-indexed)
  targetPosition?: number // Posición destino (0-indexed)
  operation?: "add" | "subtract"
  value?: number // Valor fijo para sumar/restar
  lookbackDays?: number // Cuántos sorteos atrás mirar (1 = último, 2 = penúltimo, etc.)
  sourceLottery?: string // Lotería de origen opcional
}

export interface StrategyParameters {
  rules: StrategyRule[]
  combineLogic: "sequential" | "combinations" // Cómo combinar las reglas
  limitPerRule?: number // Límite de variaciones por regla
}

/* ======================================================
   ANÁLISIS DE RESULTADOS HISTÓRICOS
====================================================== */

/**
 * Extrae un dígito de una posición específica de un resultado
 * @param result - Número como string (ej: "1234")
 * @param position - Posición 0-indexed (0 = primer dígito)
 */
export function extractDigitFromPosition(result: string, position: number): number {
  const normalized = result.trim()
  if (position < 0 || position >= normalized.length) {
    return 0 // Default si la posición no existe
  }
  return parseInt(normalized[position], 10) || 0
}

/**
 * Obtiene el último dígito de un número
 */
export function getLastDigit(number: number): number {
  return Math.abs(number) % 10
}

/**
 * Normaliza un número para que esté entre 0-9
 */
export function normalizeToDigit(value: number): number {
  return Math.abs(value) % 10
}

/**
 * Aplica una operación matemática a un dígito
 */
export function applyOperation(
  baseValue: number,
  operation: "add" | "subtract",
  operand: number
): number {
  let result: number
  
  if (operation === "add") {
    result = baseValue + operand
  } else {
    result = baseValue - operand
  }
  
  // Asegurar que el resultado esté entre 0-9
  return normalizeToDigit(result)
}

/* ======================================================
   GENERACIÓN DE PREDICCIONES BASADAS EN ESTRATEGIA
====================================================== */

/**
 * Genera números basados en parámetros de estrategia y resultados históricos
 */
export function generatePredictionsFromStrategy(
  historicalResults: string[],
  digits: number,
  parameters: StrategyParameters,
  maxCombinations: number = 10,
  historicalResultsByLottery: Record<string, string[]> = {}
): string[] {
  const predictions = new Set<string>()

  const resolveResults = (rule?: StrategyRule) => {
    if (rule?.sourceLottery && historicalResultsByLottery[rule.sourceLottery]?.length) {
      return historicalResultsByLottery[rule.sourceLottery]
    }
    return historicalResults
  }
  
  // Si no hay reglas, generar aleatorios
  if (!parameters.rules || parameters.rules.length === 0) {
    return generateRandomCombinations(digits, maxCombinations)
  }
  
  // Si no hay resultados históricos suficientes
  if (historicalResults.length === 0) {
    return generateRandomCombinations(digits, maxCombinations)
  }
  
  // Aplicar estrategia secuencial
  if (parameters.combineLogic === "sequential") {
    predictions.add(...generateSequentialPredictions(
      historicalResults,
      digits,
      parameters.rules,
      maxCombinations,
      resolveResults
    ))
  } else {
    // Generar combinaciones de todas las reglas
    predictions.add(...generateCombinedPredictions(
      historicalResults,
      digits,
      parameters.rules,
      maxCombinations,
      resolveResults
    ))
  }
  
  // Si no se generaron suficientes, completar con aleatorios
  while (predictions.size < maxCombinations) {
    predictions.add(generateRandomNumber(digits))
  }
  
  return Array.from(predictions).slice(0, maxCombinations)
}

/**
 * Genera predicciones aplicando reglas secuencialmente
 */
function generateSequentialPredictions(
  historicalResults: string[],
  digits: number,
  rules: StrategyRule[],
  maxCombinations: number,
  resolveResults: (rule: StrategyRule) => string[]
): string[] {
  const predictions: string[] = []
  const limitPerRule = Math.ceil(maxCombinations / rules.length)
  
  for (const rule of rules) {
    const ruleResults = resolveResults(rule)
    const rulePredictions = applyRuleToPredictions(
      ruleResults,
      digits,
      rule,
      limitPerRule
    )
    predictions.push(...rulePredictions)
    
    if (predictions.length >= maxCombinations) break
  }
  
  return predictions
}

/**
 * Genera predicciones combinando múltiples reglas
 */
function generateCombinedPredictions(
  historicalResults: string[],
  digits: number,
  rules: StrategyRule[],
  maxCombinations: number,
  resolveResults: (rule: StrategyRule) => string[]
): string[] {
  const predictions = new Set<string>()
  const attempts = maxCombinations * 5 // Intentar más veces para encontrar combinaciones
  
  for (let i = 0; i < attempts && predictions.size < maxCombinations; i++) {
    // Aplicar todas las reglas en orden para construir un número
    let prediction = ""
    
    for (let pos = 0; pos < digits; pos++) {
      // Encontrar una regla que aplique a esta posición
      const applicableRule = rules.find(r => 
        r.targetPosition === undefined || r.targetPosition === pos
      ) || rules[0]
      
      const digit = applyRuleToPosition(
        resolveResults(applicableRule),
        applicableRule,
        pos
      )
      
      prediction += digit
    }
    
    predictions.add(prediction)
  }
  
  return Array.from(predictions)
}

/**
 * Aplica una regla para generar múltiples predicciones
 */
function applyRuleToPredictions(
  historicalResults: string[],
  digits: number,
  rule: StrategyRule,
  limit: number
): string[] {
  const predictions: string[] = []
  
  // Determinar cuántos resultados históricos usar
  const lookback = Math.min(
    rule.lookbackDays || 1,
    historicalResults.length
  )
  
  // Generar predicciones basadas en diferentes resultados históricos
  for (let i = 0; i < lookback && predictions.length < limit; i++) {
    const historicalResult = historicalResults[i]
    const prediction = applyRuleToResult(historicalResult, digits, rule)
    
    if (prediction) {
      predictions.push(prediction)
    }
  }
  
  // Si no se generaron suficientes, crear variaciones
  while (predictions.length < limit) {
    const baseIndex = predictions.length % Math.max(1, historicalResults.length)
    const baseResult = historicalResults[baseIndex]
    const variation = applyRuleWithVariation(baseResult, digits, rule, predictions.length)
    predictions.push(variation)
  }
  
  return predictions
}

/**
 * Aplica una regla a un resultado histórico para generar una predicción
 */
function applyRuleToResult(
  historicalResult: string,
  digits: number,
  rule: StrategyRule
): string | null {
  let prediction = ""
  
  try {
    switch (rule.type) {
      case "position":
        // Extraer dígito de una posición y colocarlo en otra
        const sourceDigit = extractDigitFromPosition(
          historicalResult,
          rule.sourcePosition || 0
        )
        
        // Construir número con el dígito en la posición objetivo
        for (let i = 0; i < digits; i++) {
          if (i === (rule.targetPosition || 0)) {
            prediction += sourceDigit
          } else {
            prediction += Math.floor(Math.random() * 10)
          }
        }
        break
        
      case "sum":
      case "subtract":
        // Extraer dígito, aplicar operación y usar el resultado
        const digit = extractDigitFromPosition(
          historicalResult,
          rule.sourcePosition || 0
        )
        const operation = rule.type === "sum" ? "add" : "subtract"
        const resultDigit = applyOperation(digit, operation, rule.value || 1)
        
        // Construir número
        for (let i = 0; i < digits; i++) {
          if (i === (rule.targetPosition || 0)) {
            prediction += resultDigit
          } else {
            prediction += Math.floor(Math.random() * 10)
          }
        }
        break
        
      case "last_digit":
        // Usar el último dígito del resultado completo
        const lastDigit = getLastDigit(parseInt(historicalResult) || 0)
        prediction = lastDigit.toString().repeat(digits)
        break
        
      case "mirror":
        // Invertir el resultado histórico
        prediction = historicalResult.split("").reverse().join("").substring(0, digits)
        // Rellenar si es más corto
        while (prediction.length < digits) {
          prediction += Math.floor(Math.random() * 10)
        }
        break
        
      default:
        return null
    }
    
    return prediction
  } catch (error) {
    return null
  }
}

/**
 * Aplica una regla a una posición específica
 */
function applyRuleToPosition(
  historicalResults: string[],
  rule: StrategyRule,
  position: number
): number {
  const lookback = Math.min(
    rule.lookbackDays || 1,
    historicalResults.length
  )
  
  const historicalResult = historicalResults[lookback - 1] || historicalResults[0]
  const sourcePos = rule.sourcePosition !== undefined ? rule.sourcePosition : position
  
  let digit = extractDigitFromPosition(historicalResult, sourcePos)
  
  // Aplicar operación si existe
  if (rule.operation && rule.value !== undefined) {
    digit = applyOperation(digit, rule.operation, rule.value)
  }
  
  return digit
}

/**
 * Aplica una regla con variación para generar números diferentes
 */
function applyRuleWithVariation(
  historicalResult: string,
  digits: number,
  rule: StrategyRule,
  variationIndex: number
): string {
  const base = applyRuleToResult(historicalResult, digits, rule)
  
  if (!base) {
    return generateRandomNumber(digits)
  }
  
  // Aplicar variación modificando algunos dígitos
  const chars = base.split("")
  const positionsToVary = Math.min(variationIndex + 1, digits)
  
  for (let i = 0; i < positionsToVary; i++) {
    const pos = (i + variationIndex) % digits
    chars[pos] = ((parseInt(chars[pos]) + variationIndex) % 10).toString()
  }
  
  return chars.join("")
}

/* ======================================================
   GENERACIÓN ALEATORIA (FALLBACK)
====================================================== */

/**
 * Genera un número aleatorio de N dígitos
 */
function generateRandomNumber(digits: number): string {
  let number = ""
  for (let i = 0; i < digits; i++) {
    number += Math.floor(Math.random() * 10)
  }
  return number
}

/**
 * Genera combinaciones aleatorias (método original como fallback)
 */
export function generateRandomCombinations(
  digits: number,
  maxCombinations: number
): string[] {
  const combinations = new Set<string>()

  while (combinations.size < maxCombinations) {
    combinations.add(generateRandomNumber(digits))
  }

  return Array.from(combinations)
}
