"use server"

/**
 * Feature Engineering - Extrae características de predicciones
 */

export interface PredictionFeatures {
  numberFrequency: number
  digitPattern: string
  recencyScore: number
  volatility: number
  historicalAccuracy: number
}

/**
 * Crear características para análisis de machine learning
 */
export async function createFeatures(prediction: any): Promise<PredictionFeatures> {
  // Análisis de número
  const numberStr = String(prediction.predicted_number || "").trim()
  const digits = numberStr.split("")

  // Frecuencia de dígitos (número de dígitos únicos / total)
  const uniqueDigits = new Set(digits).size
  const numberFrequency = digits.length > 0 ? uniqueDigits / digits.length : 0

  // Patrón de dígitos
  const digitPattern = digits.length > 0 ? `D${digits.length}` : "UNKNOWN"

  // Score de recencia (días desde creación)
  const createdDate = prediction.created_at ? new Date(prediction.created_at) : new Date()
  const recencyDays = Math.floor(
    (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  const recencyScore = Math.max(0, 100 - recencyDays)

  // Volatilidad (variación de dígitos)
  const volatility = digits.length > 1 
    ? Math.max(...digits.map((d) => parseInt(d))) - 
      Math.min(...digits.map((d) => parseInt(d)))
    : 0

  // Exactitud histórica del usuario
  const historicalAccuracy = prediction.user_accuracy || 50

  return {
    numberFrequency,
    digitPattern,
    recencyScore,
    volatility,
    historicalAccuracy,
  }
}

/**
 * Normalizar características para el modelo
 */
export async function normalizeFeatures(features: PredictionFeatures): Promise<number[]> {
  return [
    features.numberFrequency,
    features.recencyScore / 100,
    features.volatility / 9,
    features.historicalAccuracy / 100,
  ]
}
