"use server"

import { getCurrentUser } from "@/lib/auth"
import { analyzeDataset, scorePrediction, evaluateModelEngine } from "@/services/ml_engine"
import { getPredictionsWithScores, getRankedPredictions } from "@/services/ml_engine/integration/prediction.adapter"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

/**
 * Analizar dataset de predicciones
 * Solo para administradores
 */
export async function analyzePredictionsAction() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== "admin") {
    return { error: "No autorizado - Se requiere rol de administrador" }
  }

  try {
    console.log("[v0] Admin analyzing predictions dataset")
    const dataset = await analyzeDataset()
    
    return {
      success: true,
      dataset,
      totalRecords: dataset.length,
      analysis: {
        correctCount: dataset.filter((d: any) => d.isCorrect).length,
        incorrectCount: dataset.filter((d: any) => !d.isCorrect).length,
        accuracy: dataset.length > 0 
          ? (dataset.filter((d: any) => d.isCorrect).length / dataset.length) * 100 
          : 0,
      }
    }
  } catch (error) {
    console.error("[v0] Error analyzing predictions:", error)
    return { error: "Error al analizar predicciones" }
  }
}

/**
 * Evaluar desempeño del modelo ML
 * Solo para administradores
 */
export async function evaluateModelAction() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== "admin") {
    return { error: "No autorizado - Se requiere rol de administrador" }
  }

  try {
    console.log("[v0] Admin evaluating ML model")
    const evaluation = await evaluateModelEngine()
    
    // Guardar evaluación en base de datos
    await sql`
      INSERT INTO ml_evaluations (
        evaluation_date,
        total_predictions,
        correct_predictions,
        accuracy_percentage,
        sample_size,
        evaluated_by
      ) VALUES (
        ${new Date().toISOString()},
        ${evaluation.totalPredictions},
        ${evaluation.correctPredictions},
        ${evaluation.accuracy},
        ${evaluation.sampleSize},
        ${user.id}
      )
    `.catch(() => {
      // Tabla puede no existir, ignorar
      console.log("[v0] ML evaluations table not found")
    })

    return {
      success: true,
      evaluation,
      message: "Evaluación completada exitosamente"
    }
  } catch (error) {
    console.error("[v0] Error evaluating model:", error)
    return { error: "Error al evaluar modelo" }
  }
}

/**
 * Obtener predicciones con scores del modelo
 * Solo para administradores
 */
export async function getPredictionsWithScoresAction() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== "admin") {
    return { error: "No autorizado - Se requiere rol de administrador" }
  }

  try {
    console.log("[v0] Admin fetching predictions with scores")
    const predictions = await getPredictionsWithScores()
    
    return {
      success: true,
      predictions,
      totalCount: predictions.length,
      avgScore: predictions.length > 0
        ? predictions.reduce((sum: number, p: any) => sum + p.score, 0) / predictions.length
        : 0
    }
  } catch (error) {
    console.error("[v0] Error getting predictions with scores:", error)
    return { error: "Error al obtener predicciones con scores" }
  }
}

/**
 * Obtener predicciones mejor ranqueadas por score
 * Solo para administradores
 */
export async function getRankedPredictionsAction(limit = 50) {
  const user = await getCurrentUser()
  
  if (!user || user.role !== "admin") {
    return { error: "No autorizado - Se requiere rol de administrador" }
  }

  try {
    console.log("[v0] Admin fetching ranked predictions, limit:", limit)
    const predictions = await getRankedPredictions(limit)
    
    return {
      success: true,
      predictions,
      totalCount: predictions.length
    }
  } catch (error) {
    console.error("[v0] Error getting ranked predictions:", error)
    return { error: "Error al obtener predicciones ranqueadas" }
  }
}

/**
 * Obtener historial de evaluaciones del modelo
 * Solo para administradores
 */
export async function getMLEvaluationHistoryAction() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== "admin") {
    return { error: "No autorizado - Se requiere rol de administrador" }
  }

  try {
    console.log("[v0] Admin fetching ML evaluation history")
    
    const history = await sql`
      SELECT 
        id,
        evaluation_date,
        total_predictions,
        correct_predictions,
        accuracy_percentage,
        sample_size,
        evaluated_by,
        u.username as evaluated_by_username
      FROM ml_evaluations
      LEFT JOIN users u ON ml_evaluations.evaluated_by = u.id
      ORDER BY evaluation_date DESC
      LIMIT 20
    `.catch(() => {
      // Tabla puede no existir
      return []
    })

    return {
      success: true,
      history,
      totalCount: history.length || 0
    }
  } catch (error) {
    console.error("[v0] Error getting evaluation history:", error)
    return { error: "Error al obtener historial de evaluaciones" }
  }
}

/**
 * Obtener estadísticas del modelo ML
 * Solo para administradores
 */
export async function getMLStatsAction() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== "admin") {
    return { error: "No autorizado - Se requiere rol de administrador" }
  }

  try {
    console.log("[v0] Admin fetching ML statistics")

    // Encontrar última evaluación
    const lastEval = await sql`
      SELECT 
        accuracy_percentage,
        evaluation_date,
        total_predictions,
        correct_predictions
      FROM ml_evaluations
      ORDER BY evaluation_date DESC
      LIMIT 1
    `.catch(() => [])

    // Contar predicciones por estado
    const predictionStats = await sql`
      SELECT 
        is_verified,
        COUNT(*) as count,
        SUM(CASE WHEN is_correct = true THEN 1 ELSE 0 END) as correct
      FROM predictions
      GROUP BY is_verified
    `

    return {
      success: true,
      lastEvaluation: lastEval[0] || null,
      predictionStats,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error("[v0] Error getting ML stats:", error)
    return { error: "Error al obtener estadísticas" }
  }
}
