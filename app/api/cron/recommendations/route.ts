import { NextResponse } from "next/server"
import { generateLotteryRecommendations } from "@/lib/premium-recommendations"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Cron: genera recomendaciones de lotería para todos los usuarios premium automáticamente
// Configurar en Vercel Dashboard > Settings > Cron Jobs:
//   0 8 * * *   (todos los días a las 8 AM UTC = 3 AM Colombia)

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[v0] Running daily recommendations cron job")

  try {
    // Obtener usuario admin para atribuir el run de plataforma
    const admins = await sql`
      SELECT id FROM users WHERE role = 'admin' LIMIT 1
    ` as unknown as Array<{ id: number }>

    if (!admins.length) {
      return NextResponse.json({ error: "No se encontró usuario admin para el run de plataforma" }, { status: 500 })
    }

    const adminId = admins[0].id

    const recommendations = await generateLotteryRecommendations(10)

    if (!recommendations.length) {
      console.log("[v0] No hay pronósticos futuros para generar recomendaciones")
      return NextResponse.json({ success: true, message: "Sin pronósticos futuros disponibles", totalLotteries: 0 })
    }

    // Insertar run de plataforma (source_channel = 'cron', credits_spent = 0)
    const runRows = await sql`
      INSERT INTO premium_recommendation_runs (
        user_id,
        source_channel,
        algorithm_version,
        filters,
        credits_spent,
        status
      )
      VALUES (
        ${adminId},
        'cron',
        'v1',
        ${JSON.stringify({ limitPerLottery: 10, type: "platform_daily" })},
        0,
        'completed'
      )
      RETURNING id
    ` as unknown as Array<{ id: number }>

    const runId = Number(runRows[0].id)

    let totalItems = 0

    for (const lottery of recommendations) {
      for (let i = 0; i < lottery.numbers.length; i++) {
        const item = lottery.numbers[i]

        const itemRows = await sql`
          INSERT INTO premium_recommendation_items (
            run_id,
            lottery_name,
            lottery_type,
            ranking_position,
            recommended_number,
            score,
            signals,
            contributor_count
          )
          VALUES (
            ${runId},
            ${lottery.lotteryName},
            ${lottery.lotteryType},
            ${i + 1},
            ${item.number},
            ${item.score},
            ${JSON.stringify(item.signals)},
            ${item.contributorCount}
          )
          RETURNING id
        ` as unknown as Array<{ id: number }>

        const itemId = Number(itemRows[0].id)

        for (let j = 0; j < item.topContributors.length; j++) {
          const c = item.topContributors[j]
          await sql`
            INSERT INTO premium_recommendation_contributors (
              recommendation_item_id,
              predictor_user_id,
              contribution_weight,
              rank_in_item
            )
            VALUES (${itemId}, ${c.userId}, ${c.weight}, ${j + 1})
          `
        }

        totalItems++
      }
    }

    console.log(`[v0] Recommendations cron completado: runId=${runId}, loterias=${recommendations.length}, items=${totalItems}`)

    return NextResponse.json({
      success: true,
      runId,
      totalLotteries: recommendations.length,
      totalItems,
    })
  } catch (error: any) {
    console.error("[v0] Cron recommendations error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
