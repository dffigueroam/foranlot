import "server-only"
import { neon } from "@neondatabase/serverless"
import { PYG_CONFIG } from "@/lib/payout-config"

const sql = neon(process.env.DATABASE_URL!)

export const DAILY_PYG_INVESTMENT_VALUE = PYG_CONFIG.baseInvestment

export interface UserPnGAuditRow {
  userId: number
  username: string
  totalPredictions: number
  totalInvestment: number
  totalWon: number
  totalPnG: number
  isEligible: boolean
}

export function getDailyPnGWonValue(lotteryType: string, isExactHit: boolean): number {
  if (!isExactHit) return 0

  if (lotteryType === "3_digits") return PYG_CONFIG.exactHitWonValues["3_digits"]
  if (lotteryType === "4_digits") return PYG_CONFIG.exactHitWonValues["4_digits"]

  return 0
}

function countPredictedNumbers(predictedNumber: string): number {
  const count = predictedNumber
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean).length

  return count > 0 ? count : 1
}

export async function addDailyPnGInvestment(params: {
  userId: number
  predictionDate: string
  predictedNumber: string
}) {
  try {
    const numbersCount = countPredictedNumbers(params.predictedNumber)
    const investmentToAdd = numbersCount * DAILY_PYG_INVESTMENT_VALUE

    await sql`
      INSERT INTO user_daily_pyg (
        user_id,
        cantidad_pronosticos,
        valor_inversion,
        valor_ganado,
        fecha_pronostico
      ) VALUES (
        ${params.userId},
        ${numbersCount},
        ${investmentToAdd},
        0,
        ${params.predictionDate}
      )
      ON CONFLICT (user_id, fecha_pronostico)
      DO UPDATE SET
        cantidad_pronosticos = user_daily_pyg.cantidad_pronosticos + ${numbersCount},
        valor_inversion = user_daily_pyg.valor_inversion + ${investmentToAdd},
        updated_at = CURRENT_TIMESTAMP
    `
  } catch (error) {
    console.error("[v0] Error adding daily P&G investment:", error)
  }
}

export async function updateDailyPnGWonValue(params: {
  userId: number
  predictionDate: string
  lotteryType: string
  isExactHit: boolean
}) {
  try {
    const wonValue = getDailyPnGWonValue(params.lotteryType, params.isExactHit)

    if (wonValue <= 0) {
      return
    }

    await sql`
      INSERT INTO user_daily_pyg (
        user_id,
        cantidad_pronosticos,
        valor_inversion,
        valor_ganado,
        fecha_pronostico
      ) VALUES (
        ${params.userId},
        0,
        0,
        ${wonValue},
        ${params.predictionDate}
      )
      ON CONFLICT (user_id, fecha_pronostico)
      DO UPDATE SET
        valor_ganado = user_daily_pyg.valor_ganado + ${wonValue},
        updated_at = CURRENT_TIMESTAMP
    `
  } catch (error) {
    console.error("[v0] Error updating daily P&G won value:", error)
  }
}

export async function getUserPnGAudit(options?: {
  limit?: number
  onlyPositive?: boolean
}): Promise<UserPnGAuditRow[]> {
  try {
    const limit = options?.limit && options.limit > 0 ? options.limit : 100
    const onlyPositive = options?.onlyPositive === true

    const rows = await sql`
      SELECT
        d.user_id,
        u.username,
        COALESCE(SUM(d.cantidad_pronosticos), 0)::int as total_predictions,
        COALESCE(SUM(d.valor_inversion), 0)::bigint as total_investment,
        COALESCE(SUM(d.valor_ganado), 0)::bigint as total_won,
        COALESCE(SUM(d.valor_ganado - d.valor_inversion), 0)::bigint as total_pyg
      FROM user_daily_pyg d
      JOIN users u ON u.id = d.user_id
      GROUP BY d.user_id, u.username
      ORDER BY total_pyg DESC, total_won DESC, total_investment DESC
      LIMIT ${limit}
    `

    const mapped = (rows as any[]).map((row) => {
      const totalPnG = Number(row.total_pyg || 0)
      return {
        userId: row.user_id,
        username: row.username,
        totalPredictions: Number(row.total_predictions || 0),
        totalInvestment: Number(row.total_investment || 0),
        totalWon: Number(row.total_won || 0),
        totalPnG,
        isEligible: totalPnG > 0,
      }
    })

    return onlyPositive ? mapped.filter((row) => row.isEligible) : mapped
  } catch (error) {
    console.error("[v0] Error getting P&G audit:", error)
    return []
  }
}