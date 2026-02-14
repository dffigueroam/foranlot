"use server"

/**
 * Evaluator - Evaluación de desempeño del modelo
 */

import { neon } from "@neondatabase/serverless"
import { buildDataset } from "../data/dataset.builder"

const sql = neon(process.env.DATABASE_URL!)

export interface ModelEvaluation {
  totalPredictions: number
  correctPredictions: number
  accuracy: number
  evaluationDate: string
  sampleSize: number
}

/**
 * Evaluar desempeño del modelo
 */
export async function evaluateModel(): Promise<ModelEvaluation> {
  try {
    // Obtener dataset de predicciones
    const dataset = await buildDataset()

    if (dataset.length === 0) {
      return {
        totalPredictions: 0,
        correctPredictions: 0,
        accuracy: 0,
        evaluationDate: new Date().toISOString(),
        sampleSize: 0,
      }
    }

    // Calcular métricas
    const totalPredictions = dataset.length
    const correctPredictions = dataset.filter((d) => d.isCorrect).length
    const accuracy = (correctPredictions / totalPredictions) * 100

    return {
      totalPredictions,
      correctPredictions,
      accuracy: Math.round(accuracy * 100) / 100,
      evaluationDate: new Date().toISOString(),
      sampleSize: totalPredictions,
    }
  } catch (error) {
    console.error("[v0] Error evaluating model:", error)
    return {
      totalPredictions: 0,
      correctPredictions: 0,
      accuracy: 0,
      evaluationDate: new Date().toISOString(),
      sampleSize: 0,
    }
  }
}

/**
 * Comparar evaluaciones en el tiempo
 */
export async function compareEvaluations(
  eval1: ModelEvaluation,
  eval2: ModelEvaluation
): Promise<{
  accuracyChange: number
  improved: boolean
  comparison: string
}> {
  const accuracyChange = eval2.accuracy - eval1.accuracy

  return {
    accuracyChange: Math.round(accuracyChange * 100) / 100,
    improved: accuracyChange > 0,
    comparison:
      accuracyChange > 0
        ? `Mejora de ${accuracyChange.toFixed(2)}%`
        : `Reducción de ${Math.abs(accuracyChange).toFixed(2)}%`,
  }
}
