import { NextResponse } from "next/server"
import { evaluateModelEngine } from "@/services/ml_engine"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

/**
 * Cron Job para evaluar automáticamente el modelo ML
 * 
 * Configurar en Vercel > Project Settings > Cron Jobs:
 * URL: https://tudominio.com/api/cron/ml-evaluate
 * Schedule: 0 1 * * * (1 AM cada día)
 * 
 * Authorization: Este endpoint utiliza el contexto de servidor de forma interna
 */
export async function GET(request: Request) {
  try {
    // Verificar token CRON_SECRET
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.log("[v0] Unauthorized cron request to ML evaluation")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("[v0] Starting ML model evaluation cron job")

    const evaluation = await evaluateModelEngine()

    await sql`
      CREATE TABLE IF NOT EXISTS ml_daily_monitoring (
        id BIGSERIAL PRIMARY KEY,
        monitoring_date DATE NOT NULL UNIQUE,
        total_predictions INTEGER NOT NULL DEFAULT 0,
        correct_predictions INTEGER NOT NULL DEFAULT 0,
        accuracy_percentage NUMERIC(8,2) NOT NULL DEFAULT 0,
        recommendation_total INTEGER NOT NULL DEFAULT 0,
        recommendation_hits INTEGER NOT NULL DEFAULT 0,
        recommendation_hit_rate NUMERIC(8,2) NOT NULL DEFAULT 0,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `

    const recommendationMetrics = await sql`
      WITH latest_run AS (
        SELECT id
        FROM premium_recommendation_runs
        WHERE source_channel = 'cron'
          AND status = 'completed'
        ORDER BY created_at DESC
        LIMIT 1
      ),
      scoped_items AS (
        SELECT i.lottery_name, i.lottery_type, i.recommended_number
        FROM premium_recommendation_items i
        JOIN latest_run r ON r.id = i.run_id
      ),
      evaluated AS (
        SELECT
          COUNT(*)::int AS total,
          SUM(
            CASE
              WHEN si.lottery_type = '3_digits' AND lr.digits_3 = si.recommended_number THEN 1
              WHEN si.lottery_type = '4_digits' AND lr.digits_4 = si.recommended_number THEN 1
              WHEN si.lottery_type = '2_digits' AND lr.digits_2 = si.recommended_number THEN 1
              WHEN si.lottery_type = '5_digits' AND lr.winning_number = si.recommended_number THEN 1
              ELSE 0
            END
          )::int AS hits
        FROM scoped_items si
        JOIN lottery_results lr
          ON lr.lottery_name = si.lottery_name
         AND lr.draw_date = (CURRENT_DATE - INTERVAL '1 day')
      )
      SELECT
        COALESCE(total, 0)::int AS total,
        COALESCE(hits, 0)::int AS hits,
        CASE
          WHEN COALESCE(total, 0) = 0 THEN 0
          ELSE ROUND((COALESCE(hits, 0)::numeric / total::numeric) * 100, 2)
        END AS hit_rate
      FROM evaluated
    ` as Array<{ total: number; hits: number; hit_rate: number }>

    const recTotal = recommendationMetrics[0]?.total || 0
    const recHits = recommendationMetrics[0]?.hits || 0
    const recHitRate = Number(recommendationMetrics[0]?.hit_rate || 0)

    await sql`
      INSERT INTO ml_daily_monitoring (
        monitoring_date,
        total_predictions,
        correct_predictions,
        accuracy_percentage,
        recommendation_total,
        recommendation_hits,
        recommendation_hit_rate,
        metadata,
        updated_at
      )
      VALUES (
        CURRENT_DATE,
        ${evaluation.totalPredictions},
        ${evaluation.correctPredictions},
        ${evaluation.accuracy},
        ${recTotal},
        ${recHits},
        ${recHitRate},
        ${JSON.stringify({ source: "cron_ml_evaluate" })},
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (monitoring_date)
      DO UPDATE SET
        total_predictions = EXCLUDED.total_predictions,
        correct_predictions = EXCLUDED.correct_predictions,
        accuracy_percentage = EXCLUDED.accuracy_percentage,
        recommendation_total = EXCLUDED.recommendation_total,
        recommendation_hits = EXCLUDED.recommendation_hits,
        recommendation_hit_rate = EXCLUDED.recommendation_hit_rate,
        metadata = EXCLUDED.metadata,
        updated_at = CURRENT_TIMESTAMP
    `

    console.log("[v0] ML evaluation completed successfully")
    return NextResponse.json({
      success: true,
      message: "ML model evaluation completed",
      evaluation,
      recommendationMonitoring: {
        total: recTotal,
        hits: recHits,
        hitRate: recHitRate,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Cron job error - ML evaluation:", error)
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    )
  }
}
