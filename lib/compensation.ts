// Obtener contratos activos con tarifa pactada y predictor
export interface ActiveContract {
  id: number;
  subscriberId: number;
  predictorId: number;
  tarifaPactada: number;
  startDate: string;
  endDate: string;
}

/**
 * Devuelve todos los contratos activos con tarifa pactada y predictor
 */
export async function getActiveContractsWithTariff(): Promise<ActiveContract[]> {
  const result = await sql`
    SELECT id, subscriber_id, selected_user_id, tarifa_creditos_pactada, start_date, expiry_date
    FROM user_selections
    WHERE is_active = true AND tarifa_creditos_pactada IS NOT NULL
  `;
  return result.map((row: any) => ({
    id: row.id,
    subscriberId: row.subscriber_id,
    predictorId: row.selected_user_id,
    tarifaPactada: row.tarifa_creditos_pactada,
    startDate: row.start_date,
    endDate: row.expiry_date,
  }));
}

/**
 * Calcula la compensación para cada predictor contratado usando el 20% de la tarifa pactada
 * Devuelve un array con predictorId, contratos y totalCompensacion
 */
export async function calculateContractCompensation(): Promise<Array<{ predictorId: number, contratos: number, totalCompensacion: number }>> {
  const contracts = await getActiveContractsWithTariff();
  const percent = 0.20;
  // Agrupar por predictor
  const map = new Map<number, { contratos: number, totalCompensacion: number }>();
  for (const c of contracts) {
    const comp = Math.round(c.tarifaPactada * percent);
    if (!map.has(c.predictorId)) {
      map.set(c.predictorId, { contratos: 1, totalCompensacion: comp });
    } else {
      const prev = map.get(c.predictorId)!;
      map.set(c.predictorId, { contratos: prev.contratos + 1, totalCompensacion: prev.totalCompensacion + comp });
    }
  }
  return Array.from(map.entries()).map(([predictorId, v]) => ({ predictorId, ...v }));
}
import "server-only"
import { neon } from "@neondatabase/serverless"
import { ENVIRONMENT_CONFIG } from "@/lib/environment-config"

const sql = neon(process.env.DATABASE_URL!)

/**
 * Sistema de compensación económica basado en:
 * - 50% Aporte económico
 * - 30% Recurrencia del número
 * - 20% Consistencia histórica
 */

export interface UserScore {
  userId: number
  username: string
  contributionScore: number  // 0-1 (50% peso)
  recurrenceScore: number    // 0-1 (30% peso)
  consistencyScore: number   // 0-1 (20% peso)
  totalScore: number         // Suma ponderada
}

export interface EligibleCompensationUser {
  userId: number
  username: string
  profitAndLoss: number
}

function getNormalizedWeights() {
  const weights = ENVIRONMENT_CONFIG.SCORING_WEIGHTS
  const total = weights.contribution + weights.recurrence + weights.consistency
  return {
    contribution: total > 0 ? weights.contribution / total : 0.5,
    recurrence: total > 0 ? weights.recurrence / total : 0.3,
    consistency: total > 0 ? weights.consistency / total : 0.2,
  }
}

/**
 * Calcular scores de ranking basados en histórico acumulado.
 * Criterios: Aporte económico P&G acumulado (50%), Recurrencia (30%), Consistencia (20%)
 */
export async function calculateRankingScoresForPeriod(_days = 0): Promise<UserScore[]> {
  try {
    const weights = getNormalizedWeights()

    const totalPredictions = await sql`
      SELECT COUNT(*)::int as total
      FROM predictions
      WHERE is_verified = true
    `

    const totalCorrect = await sql`
      SELECT COUNT(*)::int as total
      FROM predictions
      WHERE is_verified = true
        AND is_correct = true
    `

    const perUserPredictions = await sql`
      SELECT user_id, COUNT(*)::int as total
      FROM predictions
      WHERE is_verified = true
      GROUP BY user_id
    `

    const perUserCorrect = await sql`
      SELECT user_id, COUNT(*)::int as total
      FROM predictions
      WHERE is_verified = true
        AND is_correct = true
      GROUP BY user_id
    `

    const perUserAccuracy = await sql`
      SELECT 
        user_id,
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE is_correct = true)::int as correct
      FROM predictions
      WHERE is_verified = true
      GROUP BY user_id
    `

    const perUserPnG = await sql`
      SELECT
        user_id,
        COALESCE(SUM(valor_ganado - valor_inversion), 0)::bigint as total_pyg
      FROM user_daily_pyg
      GROUP BY user_id
    `

    const totalPred = totalPredictions[0]?.total || 0
    const totalCorr = totalCorrect[0]?.total || 0

    const userIdSet = new Set<number>()
    perUserPredictions.forEach((row: any) => userIdSet.add(row.user_id))
    perUserCorrect.forEach((row: any) => userIdSet.add(row.user_id))
    perUserAccuracy.forEach((row: any) => userIdSet.add(row.user_id))
    perUserPnG.forEach((row: any) => userIdSet.add(row.user_id))

    const userIds = Array.from(userIdSet)
    if (userIds.length === 0) return []

    const usernames = await sql`
      SELECT id, username
      FROM users
      WHERE id = ANY(${userIds})
    `

    const usernameMap = new Map<number, string>()
    usernames.forEach((row: any) => usernameMap.set(row.id, row.username))

    const predMap = new Map<number, number>()
    perUserPredictions.forEach((row: any) => predMap.set(row.user_id, row.total))

    const correctMap = new Map<number, number>()
    perUserCorrect.forEach((row: any) => correctMap.set(row.user_id, row.total))

    const accuracyMap = new Map<number, { total: number; correct: number }>()
    perUserAccuracy.forEach((row: any) => accuracyMap.set(row.user_id, { total: row.total, correct: row.correct }))

    const pygMap = new Map<number, number>()
    perUserPnG.forEach((row: any) => pygMap.set(row.user_id, Number(row.total_pyg || 0)))

    const totalPositivePnG = Array.from(pygMap.values())
      .filter((value) => value > 0)
      .reduce((sum, value) => sum + value, 0)

    const scores: UserScore[] = userIds.map((userId) => {
      const userPred = predMap.get(userId) || 0
      const userCorrect = correctMap.get(userId) || 0
      const accuracy = accuracyMap.get(userId)
      const userPnG = pygMap.get(userId) || 0

      const contributionScore = totalPositivePnG > 0 && userPnG > 0 ? userPnG / totalPositivePnG : 0
      const recurrenceScore = totalCorr > 0 ? userCorrect / totalCorr : 0
      const consistencyScore = accuracy && accuracy.total > 0 ? accuracy.correct / accuracy.total : 0

      const totalScore =
        contributionScore * weights.contribution +
        recurrenceScore * weights.recurrence +
        consistencyScore * weights.consistency

      return {
        userId,
        username: usernameMap.get(userId) || `User ${userId}`,
        contributionScore,
        recurrenceScore,
        consistencyScore,
        totalScore,
      }
    })

    const totalScoreSum = scores.reduce((sum, u) => sum + u.totalScore, 0)
    if (totalScoreSum > 0) {
      scores.forEach((u) => {
        u.totalScore = u.totalScore / totalScoreSum
      })
    }

    return scores.sort((a, b) => b.totalScore - a.totalScore)
  } catch (error) {
    console.error("[v0] Error calculating ranking scores:", error)
    return []
  }
}

export interface CompensationScenario {
  totalCapital: number       // Capital total recaudado
  multiplier: number         // 400× para 3 cifras, etc.
  winningNumber: string
  lotteryType: string
  drawDate: string
  userContributions: Array<{
    userId: number
    amount: number           // Aporte en centavos
  }>
}

/**
 * Calcular scores de usuarios para un escenario específico
 */
export async function calculateUserScores(
  scenario: CompensationScenario
): Promise<UserScore[]> {
  
  const userScores: UserScore[] = []
  
  for (const contribution of scenario.userContributions) {
    const { userId, amount } = contribution
    
    // 1. Score de aporte (50%) - Proporcional al capital aportado
    const contributionScore = amount / scenario.totalCapital
    
    // 2. Score de recurrencia (30%) - Cuántas veces ha predicho este número
    const recurrenceScore = await calculateRecurrenceScore(
      userId,
      scenario.winningNumber,
      scenario.lotteryType
    )
    
    // 3. Score de consistencia (20%) - Precisión histórica
    const consistencyScore = await calculateConsistencyScore(userId)
    
    // Score total ponderado
    const totalScore = 
      (contributionScore * 0.50) + 
      (recurrenceScore * 0.30) + 
      (consistencyScore * 0.20)
    
    // Obtener username
    const userResult = await sql`SELECT username FROM users WHERE id = ${userId}`
    const username = userResult[0]?.username || `User ${userId}`
    
    userScores.push({
      userId,
      username,
      contributionScore,
      recurrenceScore,
      consistencyScore,
      totalScore,
    })
  }
  
  // Normalizar scores para que sumen 1.0
  const totalScoreSum = userScores.reduce((sum, u) => sum + u.totalScore, 0)
  
  if (totalScoreSum > 0) {
    userScores.forEach(u => {
      u.totalScore = u.totalScore / totalScoreSum
    })
  }
  
  return userScores.sort((a, b) => b.totalScore - a.totalScore)
}

/**
 * Calcular score de recurrencia (cuántas veces ha predicho este número)
 */
async function calculateRecurrenceScore(
  userId: number,
  winningNumber: string,
  lotteryType: string
): Promise<number> {
  try {
    // Contar predicciones del usuario para este número
    const userPredictions = await sql`
      SELECT COUNT(*)::int as count
      FROM predictions
      WHERE user_id = ${userId}
        AND predicted_number = ${winningNumber}
        AND lottery_name = ${lotteryType}
    `
    
    // Total de predicciones de este número por todos
    const totalPredictions = await sql`
      SELECT COUNT(*)::int as count
      FROM predictions
      WHERE predicted_number = ${winningNumber}
        AND lottery_name = ${lotteryType}
    `
    
    const userCount = userPredictions[0]?.count || 0
    const totalCount = totalPredictions[0]?.count || 1
    
    // Score: proporción de predicciones del usuario vs total
    return Math.min(userCount / totalCount, 1.0)
    
  } catch (error) {
    console.error('[v0] Error calculating recurrence score:', error)
    return 0
  }
}

/**
 * Calcular score de consistencia (precisión histórica del usuario)
 */
async function calculateConsistencyScore(userId: number): Promise<number> {
  try {
    const stats = await sql`
      SELECT 
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE is_correct = true)::int as correct
      FROM predictions
      WHERE user_id = ${userId}
        AND is_verified = true
    `
    
    const total = stats[0]?.total || 0
    const correct = stats[0]?.correct || 0
    
    if (total === 0) return 0
    
    // Accuracy como score
    return correct / total
    
  } catch (error) {
    console.error('[v0] Error calculating consistency score:', error)
    return 0
  }
}

/**
 * Obtener pronosticadores elegibles para compensación por P&G histórico acumulado.
 */
export async function getEligiblePredictorsByPositivePnG(
  userIds: number[]
): Promise<EligibleCompensationUser[]> {
  try {
    const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)))

    if (uniqueUserIds.length === 0) return []

    const results = await sql`
      SELECT
        d.user_id,
        u.username,
        COALESCE(SUM(d.valor_ganado - d.valor_inversion), 0)::bigint as total_pyg
      FROM user_daily_pyg d
      JOIN users u ON u.id = d.user_id
      WHERE d.user_id = ANY(${uniqueUserIds})
      GROUP BY d.user_id, u.username
    `

    return (results as any[])
      .map((row) => ({
        userId: row.user_id,
        username: row.username,
        profitAndLoss: Number(row.total_pyg || 0),
      }))
      .filter((user) => user.profitAndLoss > 0)
      .sort((a, b) => b.profitAndLoss - a.profitAndLoss || a.username.localeCompare(b.username))
  } catch (error) {
    console.error("[v0] Error getting eligible predictors by positive P&G:", error)
    return []
  }
}

/**
 * Distribuir compensación entre usuarios según scores
 */
export function distributeCompensation(
  eligibleUsers: EligibleCompensationUser[],
  totalCompensationFund: number
): Array<{
  userId: number
  username: string
  score: number
  compensation: number  // En centavos
}> {
  if (eligibleUsers.length === 0 || totalCompensationFund <= 0) {
    return []
  }

  const score = 1 / eligibleUsers.length
  const baseCompensation = Math.floor(totalCompensationFund / eligibleUsers.length)
  const remainder = totalCompensationFund - (baseCompensation * eligibleUsers.length)

  return eligibleUsers.map((user, index) => ({
    userId: user.userId,
    username: user.username,
    score,
    compensation: baseCompensation + (index < remainder ? 1 : 0),
  }))
}

/**
 * Simular un escenario de compensación completo
 */
export async function simulateCompensation(scenario: CompensationScenario) {
  
  // 1. Calcular premio bruto
  const grossPrize = scenario.totalCapital * scenario.multiplier
  
  // 2. Dividir: porcentaje configurable de usuarios / plataforma
  const userFund = Math.round(grossPrize * (ENVIRONMENT_CONFIG.USERS_PRIZE_PERCENTAGE / 100))
  const platformShare = grossPrize - userFund
  
  // 3. Filtrar elegibles por P&G positivo, sin depender del ranking
  const eligibleUsers = await getEligiblePredictorsByPositivePnG(
    scenario.userContributions.map((contribution) => contribution.userId)
  )

  // 4. Distribuir compensación únicamente entre elegibles
  const distribution = distributeCompensation(eligibleUsers, userFund)
  
  // 5. Registrar en compensation_log
  for (const payout of distribution) {
    await sql`
      INSERT INTO compensation_log (
        user_id,
        amount_cents,
        reason,
        created_at
      ) VALUES (
        ${payout.userId},
        ${payout.compensation},
        ${`Compensación por acierto con P&G positivo: ${scenario.winningNumber} (${scenario.lotteryType})`},
        CURRENT_TIMESTAMP
      )
    `
  }
  
  return {
    scenario: {
      totalCapital: scenario.totalCapital,
      multiplier: scenario.multiplier,
      grossPrize,
      userFund,
      platformShare,
      eligibleUsersCount: eligibleUsers.length,
      excludedUsersCount: Math.max(scenario.userContributions.length - eligibleUsers.length, 0),
    },
    distribution,
  }
}

/**
 * Guardar scores en user_ranking_scores para auditoría
 */
export async function saveRankingScores(
  userScores: UserScore[],
  date: string = new Date().toISOString().split('T')[0]
) {
  for (const user of userScores) {
    try {
      await sql`
        INSERT INTO user_ranking_scores (
          user_id,
          score_date,
          contribution_score,
          recurrence_score,
          consistency_score,
          total_score
        ) VALUES (
          ${user.userId},
          ${date},
          ${user.contributionScore},
          ${user.recurrenceScore},
          ${user.consistencyScore},
          ${user.totalScore}
        )
        ON CONFLICT (user_id, score_date)
        DO UPDATE SET
          contribution_score = ${user.contributionScore},
          recurrence_score = ${user.recurrenceScore},
          consistency_score = ${user.consistencyScore},
          total_score = ${user.totalScore}
      `
    } catch (error) {
      console.error('[v0] Error saving ranking scores:', error)
    }
  }
}
