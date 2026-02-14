"use server"

/**
 * Prediction Adapter - Adaptador para integración del modelo con predicciones
 */

import { calculateScore } from "../models/scoring.model"
import { buildDataset } from "../data/dataset.builder"

export interface PredictionWithScore {
  predictionId: number
  lotteryType: string
  predictedNumber: string
  score: number
  confidence: number
  recommendation: string
}

/**
 * Obtener predicciones con scores del modelo
 */
export async function getPredictionsWithScores(): Promise<PredictionWithScore[]> {
  try {
    const dataset = await buildDataset()

    const scoredPredictions: PredictionWithScore[] = []
    for (const prediction of dataset) {
      const scoreResult = await calculateScore({
        predicted_number: prediction.predictedNumber,
        created_at: prediction.timestamp,
        user_accuracy: 50, // Valor por defecto
      })

      scoredPredictions.push({
        predictionId: prediction.predictionId,
        lotteryType: prediction.lotteryType,
        predictedNumber: prediction.predictedNumber,
        score: scoreResult.calculatedScore,
        confidence: scoreResult.suggestedConfidence,
        recommendation: scoreResult.recommendation,
      })
    }

    return scoredPredictions
  } catch (error) {
    console.error("[v0] Error getting predictions with scores:", error)
    return []
  }
}

/**
 * Filtrar predicciones por umbral de confianza
 */
export async function filterPredictionsByConfidence(
  minConfidence: number
): Promise<PredictionWithScore[]> {
  try {
    const allPredictions = await getPredictionsWithScores()

    return allPredictions.filter((p) => p.confidence >= minConfidence)
  } catch (error) {
    console.error("[v0] Error filtering predictions:", error)
    return []
  }
}

/**
 * Obtener ranking de predicciones por score
 */
export async function getRankedPredictions(limit = 50): Promise<PredictionWithScore[]> {
  try {
    const allPredictions = await getPredictionsWithScores()

    return allPredictions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  } catch (error) {
    console.error("[v0] Error getting ranked predictions:", error)
    return []
  }
}
