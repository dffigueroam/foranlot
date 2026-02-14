"use server"

/**
 * Dataset Builder - Construye datasets de entrenamiento
 */

import { neon } from "@neondatabase/serverless"
import { MLConfig } from "../config"

const sql = neon(process.env.DATABASE_URL!)

export interface DatasetRecord {
  predictionId: number
  lotteryType: string
  predictedNumber: string
  isCorrect: boolean
  timestamp: string
  userId: number
}

/**
 * Construir dataset desde predicciones verificadas
 */
export async function buildDataset(): Promise<DatasetRecord[]> {
  try {
    if (!MLConfig.minSamplesRequired) {
      console.warn("[v0] ML Config not loaded properly")
    }

    const records = await sql`
      SELECT 
        id as prediction_id,
        lottery_type,
        predicted_number,
        is_correct,
        created_at as timestamp,
        user_id
      FROM predictions
      WHERE is_verified = true
      ORDER BY created_at DESC
      LIMIT ${MLConfig.minSamplesRequired || 50}
    `

    return records.map((r: any) => ({
      predictionId: r.prediction_id,
      lotteryType: r.lottery_type,
      predictedNumber: r.predicted_number,
      isCorrect: r.is_correct,
      timestamp: r.timestamp,
      userId: r.user_id,
    }))
  } catch (error) {
    console.error("[v0] Error building dataset:", error)
    return []
  }
}
