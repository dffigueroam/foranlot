import "server-only"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

interface UserMetric {
  user_id: number
  accuracy: number
  weekday_accuracy: number
  verified_count: number
}

interface FuturePrediction {
  predicted_number: string
  user_id: number
  confidence_level: number
}

interface ResultMetric {
  winning_number: string
  freq: number
  last_seen: string | null
}

interface Contributor {
  userId: number
  weight: number
}

export interface RecommendedNumber {
  number: string
  score: number
  signals: string[]
  contributorCount: number
  topContributors: Array<{ userId: number; weight: number }>
}

export interface LotteryRecommendation {
  lotteryName: string
  lotteryType: string
  generatedAt: string
  totalCandidates: number
  numbers: RecommendedNumber[]
}

function round(num: number) {
  return Math.round(num * 1000) / 1000
}

function daysSince(isoDate: string | null) {
  if (!isoDate) return 9999
  const from = new Date(isoDate)
  const now = new Date()
  return Math.floor((now.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

export async function generateLotteryRecommendations(limitPerLottery = 10): Promise<LotteryRecommendation[]> {
  const futureLotteries = await sql`
    SELECT DISTINCT lottery_name, lottery_type
    FROM predictions
    WHERE draw_date >= CURRENT_DATE
      AND draw_date <= (CURRENT_DATE + INTERVAL '2 days')
    ORDER BY lottery_name ASC
    LIMIT 40
  ` as Array<{ lottery_name: string; lottery_type: string }>

  const output: LotteryRecommendation[] = []

  for (const lot of futureLotteries) {
    const digitCount = Number.parseInt(lot.lottery_type, 10)
    const safeDigitCount = Number.isFinite(digitCount) ? digitCount : 4

    const [userMetricsRaw, futurePredictionsRaw, resultMetricsRaw] = await Promise.all([
      sql`
        SELECT
          user_id,
          COALESCE(AVG(CASE WHEN is_verified = true AND is_correct = true THEN 1.0 ELSE 0.0 END), 0)::float AS accuracy,
          COALESCE(AVG(CASE
            WHEN is_verified = true
              AND EXTRACT(DOW FROM draw_date) = EXTRACT(DOW FROM CURRENT_DATE)
              AND is_correct = true
            THEN 1.0
            WHEN is_verified = true
              AND EXTRACT(DOW FROM draw_date) = EXTRACT(DOW FROM CURRENT_DATE)
            THEN 0.0
            ELSE NULL
          END), 0)::float AS weekday_accuracy,
          COUNT(*) FILTER (WHERE is_verified = true)::int AS verified_count
        FROM predictions
        WHERE lottery_name = ${lot.lottery_name}
          AND lottery_type = ${lot.lottery_type}
          AND draw_date < CURRENT_DATE
        GROUP BY user_id
      `,
      sql`
        SELECT predicted_number, user_id, COALESCE(confidence_level, 3)::int AS confidence_level
        FROM predictions
        WHERE lottery_name = ${lot.lottery_name}
          AND lottery_type = ${lot.lottery_type}
          AND draw_date >= CURRENT_DATE
          AND draw_date <= (CURRENT_DATE + INTERVAL '2 days')
      `,
      sql`
        SELECT
          CASE
            WHEN ${safeDigitCount} = 3 THEN COALESCE(NULLIF(digits_3, ''), winning_number)
            WHEN ${safeDigitCount} = 4 THEN COALESCE(NULLIF(digits_4, ''), winning_number)
            ELSE winning_number
          END AS winning_number,
          COUNT(*)::int AS freq,
          MAX(draw_date)::text AS last_seen
        FROM lottery_results
        WHERE lottery_name = ${lot.lottery_name}
          AND (
            (${safeDigitCount} = 3 AND NULLIF(digits_3, '') IS NOT NULL)
            OR (${safeDigitCount} = 4 AND NULLIF(digits_4, '') IS NOT NULL)
            OR (${safeDigitCount} NOT IN (3, 4) AND CHAR_LENGTH(TRIM(winning_number)) = ${safeDigitCount})
          )
          AND draw_date >= (CURRENT_DATE - INTERVAL '120 days')
        GROUP BY 1
      `,
    ])

    const userMetrics = userMetricsRaw as unknown as UserMetric[]
    const futurePredictions = futurePredictionsRaw as unknown as FuturePrediction[]
    const resultMetrics = resultMetricsRaw as unknown as ResultMetric[]

    if (futurePredictions.length === 0) continue

    const userMetricMap = new Map<number, UserMetric>()
    for (const m of userMetrics) userMetricMap.set(m.user_id, m)

    const resultMetricMap = new Map<string, ResultMetric>()
    for (const r of resultMetrics) resultMetricMap.set(r.winning_number, r)

    const accumulator = new Map<string, { score: number; contributors: Contributor[]; signalSet: Set<string> }>()

    for (const p of futurePredictions) {
      const metric = userMetricMap.get(p.user_id)
      const accuracy = metric?.accuracy || 0
      const weekdayAccuracy = metric?.weekday_accuracy || 0
      const verifiedCount = metric?.verified_count || 0
      const confidence = Math.max(1, Math.min(5, Number(p.confidence_level || 3))) / 5
      const experience = Math.min(1, verifiedCount / 50)

      const contributorWeight = (accuracy * 0.5) + (weekdayAccuracy * 0.2) + (confidence * 0.2) + (experience * 0.1)
      const prev = accumulator.get(p.predicted_number) || {
        score: 0,
        contributors: [],
        signalSet: new Set<string>(),
      }

      prev.score += contributorWeight
      prev.contributors.push({ userId: p.user_id, weight: contributorWeight })

      const stat = resultMetricMap.get(p.predicted_number)
      const freq = stat?.freq || 0
      const gapDays = daysSince(stat?.last_seen || null)

      if (freq >= 3) {
        prev.score += 0.2
        prev.signalSet.add("Caliente")
      }

      if (freq === 0) {
        prev.score += 0.1
        prev.signalSet.add("Frio")
      }

      if (gapDays >= 20) {
        prev.score += 0.15
        prev.signalSet.add("Quedado")
      }

      const lastDigit = Number(p.predicted_number.slice(-1))
      if (!Number.isNaN(lastDigit) && lastDigit % 2 === 0) {
        prev.signalSet.add("Patron par")
      } else {
        prev.signalSet.add("Patron impar")
      }

      accumulator.set(p.predicted_number, prev)
    }

    const ranked = Array.from(accumulator.entries())
      .map(([number, data]) => {
        const topContributors = data.contributors
          .sort((a, b) => b.weight - a.weight)
          .slice(0, 3)
          .map((c) => ({ userId: c.userId, weight: round(c.weight) }))

        return {
          number,
          score: round(data.score),
          signals: Array.from(data.signalSet).slice(0, 4),
          contributorCount: data.contributors.length,
          topContributors,
        }
      })
      .sort((a, b) => b.score - a.score)

    output.push({
      lotteryName: lot.lottery_name,
      lotteryType: lot.lottery_type,
      generatedAt: new Date().toISOString(),
      totalCandidates: ranked.length,
      numbers: ranked.slice(0, limitPerLottery),
    })
  }

  return output
}

interface RecommendationItemRow {
  lottery_name: string
  lottery_type: string
  ranking_position: number
  recommended_number: string
  score: string
  signals: string[] | string | null
  contributor_count: number
}

export async function getLatestPlatformRecommendations(): Promise<{
  runId: number | null
  generatedAt: string | null
  recommendations: LotteryRecommendation[]
}> {
  const runs = await sql`
    SELECT id, created_at
    FROM premium_recommendation_runs
    WHERE source_channel = 'cron'
      AND status = 'completed'
      AND created_at >= NOW() - INTERVAL '48 hours'
    ORDER BY created_at DESC
    LIMIT 1
  ` as unknown as Array<{ id: number; created_at: string }>

  if (!runs.length) return { runId: null, generatedAt: null, recommendations: [] }

  const run = runs[0]

  const items = await sql`
    SELECT
      lottery_name,
      lottery_type,
      ranking_position,
      recommended_number,
      score,
      signals,
      contributor_count
    FROM premium_recommendation_items
    WHERE run_id = ${run.id}
    ORDER BY lottery_name, lottery_type, ranking_position
  ` as unknown as RecommendationItemRow[]

  const grouped = new Map<string, LotteryRecommendation>()
  const countPerLottery = new Map<string, number>()

  for (const row of items) {
    const key = `${row.lottery_name}::${row.lottery_type}`
    countPerLottery.set(key, (countPerLottery.get(key) || 0) + 1)
  }

  for (const row of items) {
    const key = `${row.lottery_name}::${row.lottery_type}`
    if (!grouped.has(key)) {
      grouped.set(key, {
        lotteryName: row.lottery_name,
        lotteryType: row.lottery_type,
        generatedAt: run.created_at,
        totalCandidates: countPerLottery.get(key) || 0,
        numbers: [],
      })
    }

    let signals: string[]
    if (Array.isArray(row.signals)) {
      signals = row.signals
    } else if (typeof row.signals === "string") {
      try { signals = JSON.parse(row.signals) } catch { signals = [] }
    } else {
      signals = []
    }

    grouped.get(key)!.numbers.push({
      number: row.recommended_number,
      score: Number(row.score),
      signals,
      contributorCount: row.contributor_count,
      topContributors: [],
    })
  }

  return {
    runId: Number(run.id),
    generatedAt: String(run.created_at),
    recommendations: Array.from(grouped.values()),
  }
}
