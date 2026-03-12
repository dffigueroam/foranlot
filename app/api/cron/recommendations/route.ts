import { NextResponse } from "next/server"
import { generateLotteryRecommendations } from "@/lib/premium-recommendations"
import { sendEmail } from "@/lib/email"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

function buildLiteRecommendationsEmail(username: string, recommendations: Awaited<ReturnType<typeof generateLotteryRecommendations>>) {
  const topLotteries = recommendations.slice(0, 6)

  const rows = topLotteries
    .map((lottery) => {
      const topNumbers = lottery.numbers.slice(0, 3).map((item) => item.number).join(" - ")
      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${lottery.lotteryName}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${lottery.lotteryType.replace("_digits", " cifras")}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>${topNumbers || "Sin datos"}</strong></td>
        </tr>
      `
    })
    .join("")

  return `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; color: #111827;">
      <h2 style="margin-bottom: 12px;">Tus recomendados de hoy están listos</h2>
      <p>Hola <strong>${username}</strong>, aquí tienes un resumen de los números recomendados para hoy.</p>
      <table style="width:100%; border-collapse: collapse; margin-top: 16px;">
        <thead>
          <tr>
            <th style="text-align:left; padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb;">Lotería</th>
            <th style="text-align:left; padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb;">Tipo</th>
            <th style="text-align:left; padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb;">Top 3 números</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <p style="margin-top: 16px;">Puedes ver el detalle completo ingresando a tu cuenta.</p>
      <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">ForanLot - Recomendaciones automáticas Lite</p>
    </div>
  `
}

// Cron: genera recomendaciones de lotería para todos los usuarios premium automáticamente
// Configurar en Vercel Dashboard > Settings > Cron Jobs:
//   0 8 * * *   (todos los días a las 8 AM UTC = 3 AM Colombia)

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
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

    const liteUsers = await sql`
      SELECT id, email, username
      FROM users
      WHERE role = 'user_email'
        AND is_premium = true
        AND COALESCE(notify_recommendations_email, true) = true
        AND email IS NOT NULL
    ` as Array<{ id: number; email: string; username: string }>

    let emailDelivered = 0
    let emailFailed = 0
    let emailSkipped = 0

    for (const liteUser of liteUsers) {
      const alreadySentToday = await sql`
        SELECT d.id
        FROM premium_recommendation_deliveries d
        JOIN premium_recommendation_runs r ON r.id = d.run_id
        WHERE d.channel = 'email'
          AND d.recipient_email = ${liteUser.email}
          AND d.delivery_status = 'delivered'
          AND r.source_channel = 'cron'
          AND COALESCE(r.filters->>'type', '') = 'platform_daily'
          AND (d.created_at AT TIME ZONE 'America/Bogota')::date = (NOW() AT TIME ZONE 'America/Bogota')::date
        LIMIT 1
      ` as Array<{ id: number }>

      if (alreadySentToday.length > 0) {
        await sql`
          INSERT INTO premium_recommendation_deliveries (
            run_id,
            channel,
            delivery_status,
            recipient_email,
            error_message
          )
          VALUES (
            ${runId},
            'email',
            'skipped',
            ${liteUser.email},
            'ALREADY_SENT_TODAY'
          )
        `
        emailSkipped++
        continue
      }

      if (!process.env.RESEND_API_KEY) {
        await sql`
          INSERT INTO premium_recommendation_deliveries (
            run_id,
            channel,
            delivery_status,
            recipient_email,
            error_message
          )
          VALUES (
            ${runId},
            'email',
            'skipped',
            ${liteUser.email},
            'RESEND_API_KEY_NOT_CONFIGURED'
          )
        `
        emailSkipped++
        continue
      }

      const emailResult = await sendEmail({
        to: liteUser.email,
        subject: "Tus recomendados de hoy - ForanLot Lite",
        html: buildLiteRecommendationsEmail(liteUser.username, recommendations),
      })

      if (emailResult.success) {
        await sql`
          INSERT INTO premium_recommendation_deliveries (
            run_id,
            channel,
            delivery_status,
            recipient_email,
            delivered_at
          )
          VALUES (
            ${runId},
            'email',
            'delivered',
            ${liteUser.email},
            ${new Date().toISOString()}
          )
        `
        emailDelivered++
      } else {
        await sql`
          INSERT INTO premium_recommendation_deliveries (
            run_id,
            channel,
            delivery_status,
            recipient_email,
            error_message
          )
          VALUES (
            ${runId},
            'email',
            'failed',
            ${liteUser.email},
            ${emailResult.error || 'EMAIL_SEND_FAILED'}
          )
        `
        emailFailed++
      }
    }

    console.log(`[v0] Recommendations cron completado: runId=${runId}, loterias=${recommendations.length}, items=${totalItems}, emailDelivered=${emailDelivered}, emailFailed=${emailFailed}, emailSkipped=${emailSkipped}`)

    return NextResponse.json({
      success: true,
      runId,
      totalLotteries: recommendations.length,
      totalItems,
      liteUsersProcessed: liteUsers.length,
      emailDelivered,
      emailFailed,
      emailSkipped,
    })
  } catch (error: any) {
    console.error("[v0] Cron recommendations error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
