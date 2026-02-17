// Ranking por usuario filtrado por lotería
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL!);
export interface LoteriaRankingRow {
  user_id: number;
  username: string;
  score: number;
  aciertos: number;
  inversion: number;
  beneficio: number;
}

/**
 * Calcula ranking de usuarios para una lotería específica
 * @param lotteryName Nombre de la lotería
 * @param country País de la lotería
 * @param date Fecha (opcional, por defecto hoy)
 */
export async function getLoteriaRanking(lotteryName: string, country: string, date?: string): Promise<LoteriaRankingRow[]> {
  try {
    // Si no hay fecha, usar hoy
    const today = date || new Date().toISOString().slice(0, 10);
    // Obtener todos los pronósticos validados para esa lotería y fecha
    const rows = await sql`
      SELECT p.user_id, u.username,
        COUNT(*) FILTER (WHERE p.is_correct = true) AS aciertos,
        SUM(p.inversion) AS inversion,
        SUM(p.beneficio) AS beneficio
      FROM predictions p
      JOIN users u ON p.user_id = u.id
      WHERE p.lottery_name = ${lotteryName}
        AND p.country = ${country}
        AND p.draw_date = ${today}
        AND p.is_validated = true
      GROUP BY p.user_id, u.username
      ORDER BY aciertos DESC, beneficio DESC
    `;
    // Calcular score usando función existente (simulación: score = aciertos * 10 + beneficio - inversion)
    const result = (rows as any[]).map((r) => ({
      user_id: r.user_id,
      username: r.username,
      aciertos: Number(r.aciertos) || 0,
      inversion: Number(r.inversion) || 0,
      beneficio: Number(r.beneficio) || 0,
      score: (Number(r.aciertos) || 0) * 10 + (Number(r.beneficio) || 0) - (Number(r.inversion) || 0),
    }));
    return result;
  } catch (e) {
    console.log("[v0] getLoteriaRanking error", e);
    return [];
  }
}
import "server-only"
import { LOTTERIES } from "./lotteries"
import { notifyRankingChange } from "./notifications"

export interface RankingUser {
  user_id: number
  username: string
  total_predictions: number
  correct_predictions: number
  accuracy_percentage: number
  total_score: number
  total_earnings_cents: number
  rank_position: number
  subscribers_count?: number
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
        u.username,
        (
          SELECT COUNT(*)::int
          FROM user_selections
          WHERE selected_user_id = us.user_id AND is_active = true
        ) as subscribers_count
      FROM user_stats us
      JOIN users u ON us.user_id = u.id
      WHERE us.total_predictions > 0
      ORDER BY 
        us.accuracy_percentage DESC, 
        us.total_score DESC, 
        us.correct_predictions DESC
      LIMIT ${limit}
    `

    return ranking as RankingUser[]
  } catch (error) {
    console.error("[v0] Error getting ranking:", error)
    return []
  }
}

// Obtener ranking dividido en oficial y en espera
export async function getRankingWithWaitlist(limit = 50) {
  try {
    await updateRankings()

    const MIN_ACCURACY = 30  // Mínimo 30% de exactitud
    const MIN_SCORE = 5      // O mínimo 5 puntos de combinaciones

    const allUsers = await sql`
      SELECT 
        us.*,
        u.username,
        (
          SELECT COUNT(*)::int
          FROM user_selections
          WHERE selected_user_id = us.user_id AND is_active = true
        ) as subscribers_count
      FROM user_stats us
      JOIN users u ON us.user_id = u.id
      WHERE us.total_predictions > 0
      ORDER BY 
        us.accuracy_percentage DESC, 
        us.total_score DESC, 
        us.correct_predictions DESC
      LIMIT ${limit}
    `

    // Filtrar por exactitud O puntos
    const official = (allUsers as RankingUser[]).filter(u => 
      u.accuracy_percentage >= MIN_ACCURACY || (u.total_score || 0) >= MIN_SCORE
    )
    const waitlist = (allUsers as RankingUser[]).filter(u => 
      u.accuracy_percentage < MIN_ACCURACY && (u.total_score || 0) < MIN_SCORE
    )

    return {
      official,
      waitlist,
      minAccuracy: MIN_ACCURACY,
      minScore: MIN_SCORE
    }
  } catch (error) {
    console.error("[v0] Error getting ranking with waitlist:", error)
    return { official: [], waitlist: [], minAccuracy: 30, minScore: 5 }
  }
}

// Actualizar rankings de todos los usuarios
export async function updateRankings() {
  try {
    // PASO 1: Obtener ranking anterior de todos los usuarios
    const previousRanks = await sql`
      SELECT user_id, rank_position
      FROM user_stats
      WHERE rank_position IS NOT NULL
    ` as any[]
    
    const previousRankMap = new Map(
      previousRanks.map(row => [row.user_id, row.rank_position])
    )

    // PASO 2: Actualizar estadísticas incluyendo total_score
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
        total_score = (
          SELECT COALESCE(SUM(match_score), 0)
          FROM predictions
          WHERE user_id = us.user_id AND is_verified = true
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

    // PASO 3: Actualizar posiciones de ranking (considerando score además de accuracy)
    await sql`
      WITH ranked_users AS (
        SELECT 
          user_id,
          ROW_NUMBER() OVER (
            ORDER BY 
              accuracy_percentage DESC, 
              total_score DESC,
              correct_predictions DESC
          ) as new_rank
        FROM user_stats
        WHERE total_predictions > 0
      )
      UPDATE user_stats us
      SET rank_position = ru.new_rank
      FROM ranked_users ru
      WHERE us.user_id = ru.user_id
    `

    // PASO 4: Obtener nuevos rankings y notificar cambios
    const newRanks = await sql`
      SELECT 
        us.user_id,
        us.rank_position,
        us.accuracy_percentage
      FROM user_stats us
      WHERE us.rank_position IS NOT NULL
    ` as any[]

    for (const user of newRanks) {
      const previousRank = previousRankMap.get(user.user_id)
      const newRank = user.rank_position
      
      // Si es la primera vez que aparece en el ranking o si se movió, notificar
      if (previousRank !== newRank) {
        try {
          await notifyRankingChange(
            user.user_id,
            newRank,
            previousRank || null,
            user.accuracy_percentage
          )
        } catch (error) {
          console.log("[v0] Error notifying ranking change for user", user.user_id, error)
        }
      }
    }

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

// Obtener usuarios del ranking con filtros para selecciones
export async function getRankingForSelection(filters?: {
  country?: string
  lotteryType?: string
  searchTerm?: string
}) {
  try {
    await updateRankings()

    // Primero obtener todos los usuarios del ranking
    const allUsers = await sql`
      SELECT 
        us.*,
        u.username,
        (
          SELECT COUNT(*)::int
          FROM user_selections
          WHERE selected_user_id = us.user_id AND is_active = true
        ) as subscribers_count
      FROM user_stats us
      JOIN users u ON us.user_id = u.id
      WHERE us.total_predictions > 0
      ORDER BY 
        us.accuracy_percentage DESC, 
        us.total_score DESC, 
        us.correct_predictions DESC
      LIMIT 100
    ` as RankingUser[]

    // Aplicar filtros en JavaScript
    let filtered = allUsers

    // Filtro por país
    if (filters?.country) {
      // Obtener lottery_names del país especificado
      const countryLotteries = LOTTERIES
        .filter(l => l.country === filters.country)
        .map(l => l.name)

      // Para cada usuario, verificar si tiene predicciones en alguna lotería de ese país
      const userIdsWithCountry = await sql`
        SELECT DISTINCT user_id
        FROM predictions
        WHERE lottery_name = ANY(${countryLotteries})
      `
      
      const validUserIds = new Set(userIdsWithCountry.map((r: any) => r.user_id))
      filtered = filtered.filter(u => validUserIds.has(u.user_id))
    }

    // Filtro por tipo de lotería
    if (filters?.lotteryType) {
      const userIdsWithType = await sql`
        SELECT DISTINCT user_id
        FROM predictions
        WHERE lottery_type = ${filters.lotteryType}
      `
      
      const validUserIds = new Set(userIdsWithType.map((r: any) => r.user_id))
      filtered = filtered.filter(u => validUserIds.has(u.user_id))
    }

    // Filtro por búsqueda de nombre o posición
    if (filters?.searchTerm) {
      const term = filters.searchTerm.toLowerCase().trim()
      // Si es un número, buscar por posición; si no, por nombre
      if (!isNaN(Number(term)) && term !== '') {
        filtered = filtered.filter(u => u.rank_position === Number(term))
      } else if (term !== '') {
        filtered = filtered.filter(u => 
          u.username.toLowerCase().includes(term)
        )
      }
    }

    return filtered
  } catch (error) {
    console.error("[v0] Error getting ranking for selection:", error)
    return []
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
