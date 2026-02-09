import "server-only"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

/**
 * Sistema de notificaciones para contratos premium
 * Notifica a usuarios antes de que se ejecute el sorteo
 */

export interface ContractNotification {
  id: number
  userId: number
  contractId: number
  predictionId: number
  publisherUsername: string
  lotteryName: string
  predictedNumber: string
  drawDate: string
  drawTime: string
  minutesBeforeDraw: number
  notificationType: "pre_draw" | "draw_happening" | "draw_completed"
  sentAt: string
}

/**
 * Crear notificación de contrato para un usuario
 */
export async function createContractNotification(
  userId: number,
  contractId: number,
  predictionId: number,
  minutesBeforeDraw: number
) {
  try {
    // Obtener detalles de la predicción y contrato
    const prediction = await sql`
      SELECT p.*, u.username, lr.draw_time
      FROM predictions p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN lottery_results lr ON p.lottery_name = lr.lottery_name 
        AND DATE(p.draw_date) = DATE(lr.draw_date)
      WHERE p.id = ${predictionId}
    `

    if (prediction.length === 0) {
      return { error: "Predicción no encontrada" }
    }

    const pred = prediction[0]

    const result = await sql`
      INSERT INTO contract_notifications (
        user_id,
        contract_id,
        prediction_id,
        publisher_username,
        lottery_name,
        predicted_number,
        draw_date,
        minutes_before_draw,
        notification_type,
        sent_at
      ) VALUES (
        ${userId},
        ${contractId},
        ${predictionId},
        ${pred.username},
        ${pred.lottery_name},
        ${pred.predicted_number},
        ${pred.draw_date},
        ${minutesBeforeDraw},
        'pre_draw',
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `

    return { success: true, notification: result[0] }
  } catch (error) {
    console.error("[v0] Error creating contract notification:", error)
    return { error: "Error al crear notificación" }
  }
}

/**
 * Obtener notificaciones pendientes de un usuario
 */
export async function getUserPendingNotifications(userId: number) {
  try {
    const notifications = await sql`
      SELECT 
        cn.*,
        c.contract_status,
        p.is_correct
      FROM contract_notifications cn
      JOIN contracts c ON cn.contract_id = c.id
      JOIN predictions p ON cn.prediction_id = p.id
      WHERE cn.user_id = ${userId}
        AND cn.notification_type = 'pre_draw'
        AND NOW() >= (
          cn.draw_date::timestamp + (cn.minutes_before_draw * INTERVAL '1 minute')
        )
      ORDER BY cn.draw_date ASC
    `

    return notifications
  } catch (error) {
    console.error("[v0] Error getting notifications:", error)
    return []
  }
}

/**
 * Obtener contratos activos con tiempo faltante para sorteo
 */
export async function getActiveContractsWithTimeRemaining(userId: number) {
  try {
    const contracts = await sql`
      SELECT 
        c.id,
        c.contract_status,
        p.id as prediction_id,
        u.username as publisher_username,
        p.lottery_name,
        p.predicted_number,
        p.draw_date,
        COALESCE(lr.draw_time, p.draw_time) as draw_time,
        p.is_verified,
        p.is_correct,
        EXTRACT(DAY FROM p.draw_date - NOW())::int as days_remaining,
        EXTRACT(HOUR FROM p.draw_date - NOW())::int % 24 as hours_remaining,
        EXTRACT(MINUTE FROM p.draw_date - NOW())::int % 60 as minutes_remaining
      FROM contracts c
      JOIN predictions p ON c.prediction_id = p.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN lottery_results lr ON p.lottery_name = lr.lottery_name 
        AND DATE(p.draw_date) = DATE(lr.draw_date)
      WHERE c.follower_user_id = ${userId}
        AND c.contract_status = 'active'
        AND p.draw_date > NOW()
      ORDER BY p.draw_date ASC
    `

    return contracts.map((c: any) => {
      const daysRemaining = c.days_remaining || 0
      const hoursRemaining = c.hours_remaining || 0
      const minutesRemaining = c.minutes_remaining || 0

      return {
        ...c,
        timeRemaining: {
          days: daysRemaining,
          hours: hoursRemaining,
          minutes: minutesRemaining,
          formatted: formatTimeRemaining(daysRemaining, hoursRemaining, minutesRemaining),
        },
      }
    })
  } catch (error) {
    console.error("[v0] Error getting active contracts:", error)
    return []
  }
}

/**
 * Formatear tiempo faltante
 */
export function formatTimeRemaining(
  days: number,
  hours: number,
  minutes: number
): string {
  const parts: string[] = []

  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)

  if (parts.length === 0) return "¡Ahora!"

  return parts.join(" ")
}

/**
 * Programar notificaciones para ser enviadas
 * Ejecutado vía cron antes de los sorteos
 */
export async function scheduleUpcomingNotifications() {
  try {
    const notificationMinutesBefore = parseInt(
      process.env.NOTIFICATION_MINUTES_BEFORE_DRAW || "60",
      10
    )

    // Encontrar predicciones que están próximas a su sorteo
    const upcomingDraws = await sql`
      SELECT DISTINCT
        c.follower_user_id,
        p.id as prediction_id,
        c.id as contract_id,
        p.draw_date,
        EXTRACT(MINUTE FROM p.draw_date - NOW())::int as minutes_until_draw
      FROM predictions p
      JOIN contracts c ON c.prediction_id = p.id
      WHERE p.is_verified = false
        AND p.draw_date > NOW()
        AND p.draw_date <= NOW() + (${notificationMinutesBefore}::int || ' minutes')::interval
        AND NOT EXISTS (
          SELECT 1 FROM contract_notifications cn
          WHERE cn.user_id = c.follower_user_id
            AND cn.contract_id = c.id
            AND cn.notification_type = 'pre_draw'
        )
      ORDER BY p.draw_date ASC
    `

    // Crear notificaciones para cada contrato
    let created = 0
    for (const draw of upcomingDraws as any[]) {
      const result = await createContractNotification(
        draw.follower_user_id,
        draw.contract_id,
        draw.prediction_id,
        draw.minutes_until_draw
      )

      if (result.success) created++
    }

    console.log(`[v0] ${created} notificaciones programadas`)
    return { success: true, created }
  } catch (error) {
    console.error("[v0] Error scheduling notifications:", error)
    return { error: "Error al programar notificaciones" }
  }
}
