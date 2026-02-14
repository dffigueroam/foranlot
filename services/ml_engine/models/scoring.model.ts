"use server"

/**
 * Scoring Model - Modelo principal de scoring
 */

import { createFeatures } from "../data/feature.engineering"
import { baselineProbability, classifyConfidence } from "./baseline.model"

export interface PredictionScoreResult {
  calculatedScore: number
  suggestedConfidence: number
  confidenceLevel: string
  recommendation: string
}

/**
 * Calcular score para una predicción
 */
export async function calculateScore(prediction: any): Promise<PredictionScoreResult> {
  try {
    // Crear características
    const features = await createFeatures(prediction)
    
    // Calcular probabilidad baseline
    const score = await baselineProbability({
      numberFrequency: features.numberFrequency,
      recencyScore: features.recencyScore,
      volatility: features.volatility,
      historicalAccuracy: features.historicalAccuracy,
    })

    // Clasificar por confianza
    const confidence = await classifyConfidence(score)

    // Generar recomendación
    let recommendation = "Predicción débil - Considera revisar tu estrategia"
    if (score >= 70) {
      recommendation = "Predicción fuerte - Alta probabilidad de éxito"
    } else if (score >= 50) {
      recommendation = "Predicción moderada - Cumple estándares mínimos"
    } else if (score >= 30) {
      recommendation = "Predicción baja - Requiere validación adicional"
    }

    return {
      calculatedScore: Math.round(score * 100) / 100,
      suggestedConfidence: confidence.percentage,
      confidenceLevel: confidence.level,
      recommendation,
    }
  } catch (error) {
    console.error("[v0] Error calculating score:", error)
    return {
      calculatedScore: 0,
      suggestedConfidence: 1,
      confidenceLevel: "very_low",
      recommendation: "Error al calcular score",
    }
  }
}
