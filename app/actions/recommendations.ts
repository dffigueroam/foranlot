"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { getUserCredits } from "@/lib/credits"
import { createNotification } from "@/lib/notifications"
import { sendEmail } from "@/lib/email"
import { generateLotteryRecommendations } from "@/lib/premium-recommendations"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function generatePremiumRecommendationsAction() {
  const user = await getCurrentUser()
  if (!user) return { error: "No autenticado" }
  if (!user.is_premium) return { error: "Solo disponible para usuarios premium" }

  let runId: number | null = null

  try {
    const credits = await getUserCredits(user.id)
    if (!credits || credits.available_credits < 1) {
      return { error: "No tienes creditos disponibles para generar recomendaciones" }
    }

    const preferencesRows = await sql`
      SELECT
        notify_recommendations_in_app,
        notify_recommendations_email
      FROM users
      WHERE id = ${user.id}
      LIMIT 1
    `

    const preferences = (preferencesRows[0] || {
      notify_recommendations_in_app: true,
      notify_recommendations_email: true,
    }) as {
      notify_recommendations_in_app: boolean
      notify_recommendations_email: boolean
    }

    const recommendations = await generateLotteryRecommendations(10)

    await sql`
      UPDATE user_credits
      SET used_credits = used_credits + 1,
          last_updated = CURRENT_TIMESTAMP
      WHERE user_id = ${user.id}
    `

    const updated = await getUserCredits(user.id)

    await sql`
      INSERT INTO credit_transactions (
        user_id,
        amount,
        transaction_type,
        description,
        balance_after
      )
      VALUES (
        ${user.id},
        -1,
        'recommended_numbers',
        'Generacion de numeros recomendados por loteria',
        ${updated.available_credits}
      )
    `

    const sourceChannel = user.role === "user_email" ? "lite" : "premium"
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
        ${user.id},
        ${sourceChannel},
        'v1',
        ${JSON.stringify({ limitPerLottery: 10 })},
        1,
        'completed'
      )
      RETURNING id
    `

    runId = Number((runRows[0] as { id: number }).id)

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
        `

        const recommendationItemId = Number((itemRows[0] as { id: number }).id)

        for (let j = 0; j < item.topContributors.length; j++) {
          const contributor = item.topContributors[j]
          await sql`
            INSERT INTO premium_recommendation_contributors (
              recommendation_item_id,
              predictor_user_id,
              contribution_weight,
              rank_in_item
            )
            VALUES (
              ${recommendationItemId},
              ${contributor.userId},
              ${contributor.weight},
              ${j + 1}
            )
          `
        }
      }
    }

    const lotteryCount = recommendations.length
    let inAppStatus = "skipped"
    let inAppError: string | null = null

    if (preferences.notify_recommendations_in_app !== false) {
      const notification = await createNotification(
        user.id,
        "success",
        "Numeros recomendados listos",
        `Generamos recomendaciones para ${lotteryCount} loterias. Se desconto 1 credito de tu saldo.`,
        {
          runId,
          lotteries: lotteryCount,
          remainingCredits: updated.available_credits,
          type: "recommended_numbers",
        },
      )

      if (notification) {
        inAppStatus = "delivered"
      } else {
        inAppStatus = "failed"
        inAppError = "NO_SE_PUDO_CREAR_NOTIFICACION_IN_APP"
      }
    }

    await sql`
      INSERT INTO premium_recommendation_deliveries (
        run_id,
        channel,
        delivery_status,
        delivered_at,
        error_message
      )
      VALUES (
        ${runId},
        'in_app',
        ${inAppStatus},
        ${inAppStatus === "delivered" ? new Date().toISOString() : null},
        ${inAppError}
      )
    `

    let emailStatus = "skipped"
    let emailError: string | null = null

    if (preferences.notify_recommendations_email !== false) {
      const emailResult = await sendEmail({
        to: user.email,
        subject: "Tus numeros recomendados de hoy - ForanLot",
        html: `
          <h2>Numeros recomendados listos</h2>
          <p>Hola ${user.username}, ya generamos tus recomendaciones premium.</p>
          <p>Loterias analizadas: <strong>${lotteryCount}</strong></p>
          <p>Creditos disponibles: <strong>${updated.available_credits}</strong></p>
          <p>Ingresa a tu zona premium para ver el top de numeros por loteria.</p>
        `,
      })

      if (emailResult.success) {
        emailStatus = "delivered"
      } else {
        emailStatus = "failed"
        emailError = emailResult.error || "EMAIL_SEND_FAILED"
      }
    }

    await sql`
      INSERT INTO premium_recommendation_deliveries (
        run_id,
        channel,
        delivery_status,
        recipient_email,
        delivered_at,
        error_message
      )
      VALUES (
        ${runId},
        'email',
        ${emailStatus},
        ${user.email},
        ${emailStatus === "delivered" ? new Date().toISOString() : null},
        ${emailError}
      )
    `

    revalidatePath("/premium")
    revalidatePath("/notifications")

    return {
      success: true,
      runId,
      recommendations,
      remainingCredits: updated.available_credits,
    }
  } catch (error) {
    console.log("[v0] Error generating premium recommendations:", error)

    await sql`
      INSERT INTO premium_recommendation_runs (
        user_id,
        source_channel,
        algorithm_version,
        filters,
        credits_spent,
        status,
        error_message
      )
      VALUES (
        ${user.id},
        ${user.role === "user_email" ? "lite" : "premium"},
        'v1',
        ${JSON.stringify({ limitPerLottery: 10 })},
        0,
        'failed',
        ${String(error)}
      )
    `

    if (runId) {
      await sql`
        UPDATE premium_recommendation_runs
        SET status = 'failed', error_message = ${String(error)}
        WHERE id = ${runId}
      `
    }

    return { error: "No fue posible generar recomendaciones en este momento" }
  }
}
