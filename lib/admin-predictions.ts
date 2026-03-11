import "server-only"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface AdminPostedPredictionRow {
  id: number
  lottery_name: string
  country: string | null
  lottery_type: string
  predicted_number: string
  draw_date: string
  draw_time: string | null
  confidence_level: number
  notes: string | null
  created_at: string
  username: string
}

export interface AdminPostedPredictionsGroup {
  lotteryName: string
  country: string | null
  lotteryType: string
  totalPredictions: number
  predictions: AdminPostedPredictionRow[]
}

export async function getPostedPredictionsByLottery(
  drawDate: string,
  filters?: {
    country?: string
    lotteryType?: string
    username?: string
  },
): Promise<AdminPostedPredictionsGroup[]> {
  try {
    const countryFilter = filters?.country?.trim() || null
    const lotteryTypeFilter = filters?.lotteryType?.trim() || null
    const usernameFilter = filters?.username?.trim() || null

    const rows = await sql`
      SELECT
        p.id,
        p.lottery_name,
        l.country,
        p.lottery_type,
        p.predicted_number,
        p.draw_date,
        p.draw_time,
        p.confidence_level,
        p.notes,
        p.created_at,
        u.username
      FROM predictions p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN lotteries l ON l.name = p.lottery_name
      WHERE DATE(p.draw_date) = DATE(${drawDate})
        AND (${countryFilter} IS NULL OR l.country = ${countryFilter})
        AND (${lotteryTypeFilter} IS NULL OR p.lottery_type = ${lotteryTypeFilter})
        AND (${usernameFilter} IS NULL OR LOWER(u.username) LIKE LOWER(${`%${usernameFilter}%`}))
      ORDER BY p.lottery_name ASC, p.lottery_type ASC, p.confidence_level DESC, p.created_at DESC
    ` as AdminPostedPredictionRow[]

    const grouped = new Map<string, AdminPostedPredictionsGroup>()

    for (const row of rows) {
      const key = `${row.country || "Sin país"}|${row.lottery_name}|${row.lottery_type}`
      if (!grouped.has(key)) {
        grouped.set(key, {
          lotteryName: row.lottery_name,
          country: row.country,
          lotteryType: row.lottery_type,
          totalPredictions: 0,
          predictions: [],
        })
      }

      const group = grouped.get(key)!
      group.predictions.push(row)
      group.totalPredictions += 1
    }

    return Array.from(grouped.values())
  } catch (error) {
    console.error("[v0] Error getting posted predictions by lottery:", error)
    return []
  }
}