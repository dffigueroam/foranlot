import "server-only"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface RankingUser {
  user_id: number
  username: string
  total_predictions: number
  correct_predictions: number
  accuracy_percentage: number
  total_earnings_cents: number
  rank_position: number
}

export interface DailyAccuracy {
  date: string
  total: number
  correct: number
  accuracy: number
}

export interface AccuracyByType {
  lottery_type: string
  total: number
  correct: number
  accuracy: number
}

export interface UserDetailedScore {
  userId: number
  username: string
  contributionScore: number
  recurrenceScore: number
  consistencyScore: number
  totalScore: number
  scoreDate: string
}

// Obtener ranking de usuarios
export async function getRanking(limit = 50) {
  try {
    // Actualizar rankings primero
    await updateRankings()

    const ranking = await sql`
      SELECT 
        us.*,
        u.username
      FROM user_stats us
      JOIN users u ON us.user_id = u.id
      WHERE us.total_predictions > 0
      ORDER BY us.accuracy_percentage DESC, us.correct_predictions DESC
      LIMIT ${limit}
    `

    return ranking as RankingUser[]
  } catch (error) {
    console.error("[v0] Error getting ranking:", error)
    return []
  }
}

// Actualizar rankings de todos los usuarios
export async function updateRankings() {
  try {
    // Actualizar estadísticas
    await sql`
      UPDATE user_stats us
      SET 
        total_predictions = (
          SELECT COUNT(*) 
          FROM predictions 
          WHERE user_id = us.user_id AND is_verified = true
        ),
        correct_predictions = (
          SELECT COUNT(*) 
          FROM predictions 
          WHERE user_id = us.user_id AND is_correct = true
        ),
        accuracy_percentage = CASE 
          WHEN (SELECT COUNT(*) FROM predictions WHERE user_id = us.user_id AND is_verified = true) > 0 
          THEN (
            SELECT COUNT(*) FROM predictions WHERE user_id = us.user_id AND is_correct = true
          )::DECIMAL / 
          (SELECT COUNT(*) FROM predictions WHERE user_id = us.user_id AND is_verified = true) * 100
          ELSE 0 
        END,
        last_updated = CURRENT_TIMESTAMP
    `

    // Actualizar posiciones de ranking
    await sql`
      WITH ranked_users AS (
        SELECT 
          user_id,
          ROW_NUMBER() OVER (
            ORDER BY accuracy_percentage DESC, correct_predictions DESC
          ) as new_rank
        FROM user_stats
        WHERE total_predictions > 0
      )
      UPDATE user_stats us
      SET rank_position = ru.new_rank
      FROM ranked_users ru
      WHERE us.user_id = ru.user_id
    `

    return { success: true }
  } catch (error) {
    console.error("[v0] Error updating rankings:", error)
    return { error: "Error al actualizar rankings" }
  }
}

// Obtener accuracy diaria de un usuario (últimos 30 días)
export async function getDailyAccuracy(userId: number) {
  try {
    const dailyData = await sql`
      SELECT 
        DATE(draw_date) as date,
        COUNT(*) as total,
        COUNT(CASE WHEN is_correct = true THEN 1 END) as correct,
        ROUND(
          COUNT(CASE WHEN is_correct = true THEN 1 END)::DECIMAL / 
          COUNT(*) * 100,
          2
        ) as accuracy
      FROM predictions
      WHERE user_id = ${userId}
        AND is_verified = true
        AND draw_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(draw_date)
      ORDER BY DATE(draw_date) ASC
    `

    return dailyData as DailyAccuracy[]
  } catch (error) {
    console.error("[v0] Error getting daily accuracy:", error)
    return []
  }
}

// Obtener accuracy por tipo de lotería
export async function getAccuracyByType(userId: number) {
  try {
    const typeData = await sql`
      SELECT 
        lottery_type,
        COUNT(*) as total,
        COUNT(CASE WHEN is_correct = true THEN 1 END) as correct,
        ROUND(
          COUNT(CASE WHEN is_correct = true THEN 1 END)::DECIMAL / 
          COUNT(*) * 100,
          2
        ) as accuracy
      FROM predictions
      WHERE user_id = ${userId}
        AND is_verified = true
      GROUP BY lottery_type
      ORDER BY lottery_type
    `

    return typeData as AccuracyByType[]
  } catch (error) {
    console.error("[v0] Error getting accuracy by type:", error)
    return []
  }
}

// Obtener estadísticas generales de un usuario
export async function getUserStats(userId: number) {
  try {
    const stats = await sql`
      SELECT * FROM user_stats
      WHERE user_id = ${userId}
    `

    return stats[0] || null
  } catch (error) {
    console.error("[v0] Error getting user stats:", error)
    return null
  }
}

// Obtener scores detallados de compensación
export async function getRankingWithScores(limit = 50) {
  try {
    const rankings = await sql`
      SELECT 
        urs.user_id,
        u.username,
        urs.contribution_score,
        urs.recurrence_score,
        urs.consistency_score,
        urs.total_score,
        urs.score_date,
        us.total_predictions,
        us.correct_predictions,
        us.accuracy_percentage,
        us.total_earnings_cents
      FROM user_ranking_scores urs
      JOIN users u ON urs.user_id = u.id
      LEFT JOIN user_stats us ON urs.user_id = us.user_id
      WHERE urs.score_date = (
        SELECT MAX(score_date) 
        FROM user_ranking_scores 
        WHERE user_id = urs.user_id
      )
      ORDER BY urs.total_score DESC
      LIMIT ${limit}
    `

    return rankings.map((r: any) => ({
      userId: r.user_id,
      username: r.username,
      contributionScore: parseFloat(r.contribution_score),
      recurrenceScore: parseFloat(r.recurrence_score),
      consistencyScore: parseFloat(r.consistency_score),
      totalScore: parseFloat(r.total_score),
      scoreDate: r.score_date,
      totalPredictions: r.total_predictions || 0,
      correctPredictions: r.correct_predictions || 0,
      accuracyPercentage: parseFloat(r.accuracy_percentage) || 0,
      totalEarningsCents: r.total_earnings_cents || 0,
    }))
  } catch (error) {
    console.error("[v0] Error getting rankings with scores:", error)
    return []
  }
}
