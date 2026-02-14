"use server"

/**
 * Baseline Model - Modelo base de probabilidad
 */

export interface ModelFeatures {
  numberFrequency: number
  recencyScore: number
  volatility: number
  historicalAccuracy: number
}

/**
 * Calcular probabilidad base usando features
 */
export async function baselineProbability(features: ModelFeatures): Promise<number> {
  // Pesos del modelo
  const frequencyWeight = 0.25
  const recencyWeight = 0.25
  const volatilityWeight = 0.15
  const accuracyWeight = 0.35

  // Normalizar y calcular score
  const numberFreqScore = features.numberFrequency * 100 * frequencyWeight
  const recencyScore = features.recencyScore * recencyWeight
  const volatilityScore = Math.min(features.volatility, 9) / 9 * 100 * volatilityWeight
  const accuracyScore = features.historicalAccuracy * accuracyWeight

  const totalScore = numberFreqScore + recencyScore + volatilityScore + accuracyScore

  return Math.min(100, Math.max(0, totalScore))
}

/**
 * Clasificar predicción por confianza
 */
export async function classifyConfidence(score: number): Promise<{
  level: "very_low" | "low" | "medium" | "high" | "very_high"
  percentage: number
}> {
  if (score >= 80) {
    return { level: "very_high", percentage: 5 }
  } else if (score >= 60) {
    return { level: "high", percentage: 4 }
  } else if (score >= 40) {
    return { level: "medium", percentage: 3 }
  } else if (score >= 20) {
    return { level: "low", percentage: 2 }
  } else {
    return { level: "very_low", percentage: 1 }
  }
}
