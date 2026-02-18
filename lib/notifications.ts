
// ===== SERVER-ONLY FUNCTIONS MOVED TO lib/notifications.server.ts =====
// (see lib/notifications.server.ts for server-only functions)

/**
 * Tipos de notificaciones del sistema:
 * - official_results: Resultados oficiales subidos (global)
 * - contract_recommendations: Nuevas recomendaciones para contratos premium
 * - service_used: Tu servicio como pronosticador está siendo usado
 * - ranking_change: Cambio en tu posición del ranking
 * - prediction_hit: Tuviste un acierto en una predicción
 * - subscription_expiring: Suscripción a punto de vencer
 * - subscription_expired: Suscripción expirada
 * - payment_received: Pago recibido
 * - new_follower: Nuevo usuario te sigue
 */
export type NotificationType = 
  | "official_results"
  | "contract_recommendations"
  | "service_used"
  | "ranking_change"
  | "prediction_hit"
  | "subscription_expiring"
  | "subscription_expired"
  | "payment_received"
  | "new_follower"
  | "info"
  | "warning"
  | "success"
  | "error"
  | "avatar-change"

export interface Notification {
  id: number
  user_id: number
  type: NotificationType
  title: string
  message: string
  related_data?: Record<string, any>
  is_read: boolean
  created_at: string
  updated_at: string
}

// Obtener notificaciones del usuario (no leídas o todas)
export async function getUserNotifications(
  userId: number,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  try {
    let query: any
    if (unreadOnly) {
      query = await sql`
        SELECT id, user_id, type, title, message, related_data, is_read, created_at, updated_at
        FROM notifications
        WHERE user_id = ${userId} AND is_read = false
        ORDER BY created_at DESC LIMIT 50
      `
    } else {
      query = await sql`
        SELECT id, user_id, type, title, message, related_data, is_read, created_at, updated_at
        FROM notifications
        WHERE user_id = ${userId}
        ORDER BY created_at DESC LIMIT 50
      `
    }
    return query as Notification[]
  } catch (error) {
    console.log("[v0] Error getting user notifications:", error)
    return []
  }
}

// Contar notificaciones no leídas del usuario
export async function getUnreadNotificationCount(userId: number): Promise<number> {
  try {
    const result = await sql`SELECT COUNT(*) as count FROM notifications WHERE user_id = ${userId} AND is_read = false`
    return (result[0] as any)?.count || 0
  } catch (error) {
    console.log("[v0] Error counting unread notifications:", error)
    return 0
  }
}

// Crear una notificación (función base)
export async function createNotification(
  userId: number,
  type: NotificationType,
  title: string,
  message: string,
  relatedData?: Record<string, any>
): Promise<Notification | null> {
  try {
    const dataJson = relatedData ? JSON.stringify(relatedData) : null
    const result = await sql`
      INSERT INTO notifications (user_id, type, title, message, related_data)
      VALUES (${userId}, ${type}, ${title}, ${message}, ${dataJson})
      RETURNING id, user_id, type, title, message, related_data, is_read, created_at, updated_at
    `
    return result[0] as Notification
  } catch (error) {
    console.log("[v0] Error creating notification:", error)
    return null
  }
}

// Marcar notificación como leída
export async function markNotificationAsRead(notificationId: number): Promise<boolean> {
  try {
    await sql`UPDATE notifications SET is_read = true WHERE id = ${notificationId}`
    return true
  } catch (error) {
    console.log("[v0] Error marking notification as read:", error)
    return false
  }
}

// Marcar todas las notificaciones del usuario como leídas
export async function markAllNotificationsAsRead(userId: number): Promise<boolean> {
  try {
    await sql`UPDATE notifications SET is_read = true WHERE user_id = ${userId} AND is_read = false`
    return true
  } catch (error) {
    console.log("[v0] Error marking all notifications as read:", error)
    return false
  }
}

// Eliminar una notificación
export async function deleteNotification(notificationId: number): Promise<boolean> {
  try {
    await sql`DELETE FROM notifications WHERE id = ${notificationId}`
    return true
  } catch (error) {
    console.log("[v0] Error deleting notification:", error)
    return false
  }
}

// Eliminar todas las notificaciones leídas del usuario
export async function deleteReadNotifications(userId: number): Promise<boolean> {
  try {
    await sql`DELETE FROM notifications WHERE user_id = ${userId} AND is_read = true`
    return true
  } catch (error) {
    console.log("[v0] Error deleting read notifications:", error)
    return false
  }
}
/* ======================================================
   NOTIFICACIONES ESPECÍFICAS POR TIPO
====================================================== */

/**
 * NOTIFICACIÓN 1: Resultados oficiales subidos (GLOBAL)
 * Se notifica a TODOS los usuarios cuando nuevos resultados se cargan
 */
export async function notifyOfficialResults(
  lotteryName: string,
  drawDate: string,
  winningNumber: string
): Promise<void> {
  try {
    // Obtener todos los usuarios
    const allUsers = await sql`SELECT id FROM users WHERE is_active = true`
    
    for (const user of allUsers) {
      await createNotification(
        user.id,
        "official_results",
        `Resultados de ${lotteryName}`,
        `Se han publicado los resultados del ${drawDate}. Número ganador: ${winningNumber}. Revisa si acertaste.`,
        {
          lotteryName,
          drawDate,
          winningNumber,
          type: "official_results"
        }
      )
    }
    console.log(`[v0] Notified all users about results for ${lotteryName}`)
  } catch (error) {
    console.log("[v0] Error notifying official results:", error)
  }
}

/**
 * NOTIFICACIÓN 2: Nuevas recomendaciones para contratos premium
 * Notifica usuarios con contratos activos cuando hay nuevas recomendaciones
 */
export async function notifyContractRecommendations(
  subscriberId: number,
  targetUsername: string,
  predictorId: number,
  lotteryType: string,
  recommendedNumbers: string[]
): Promise<void> {
  try {
    await createNotification(
      subscriberId,
      "contract_recommendations",
      `Nuevas recomendaciones de ${targetUsername}`,
      `${targetUsername} tiene nuevas recomendaciones para ${lotteryType}. Números sugeridos: ${recommendedNumbers.join(", ")}`,
      {
        predictorId,
        targetUsername,
        lotteryType,
        recommendedNumbers,
        type: "contract_recommendations"
      }
    )
  } catch (error) {
    console.log("[v0] Error notifying contract recommendations:", error)
  }
}

/**
 * NOTIFICACIÓN 3: Tu servicio está siendo usado
 * Notifica al pronosticador cuando alguien contrata sus servicios
 */
export async function notifyServiceUsed(
  predictorId: number,
  subscriberUsername: string,
  contractDuration: string,
  lotteryType: string
): Promise<void> {
  try {
    await createNotification(
      predictorId,
      "service_used",
      `${subscriberUsername} se suscribió a tus pronósticos`,
      `${subscriberUsername} inició un contrato para recibir tus pronósticos de ${lotteryType} por ${contractDuration}.`,
      {
        subscriberUsername,
        contractDuration,
        lotteryType,
        type: "service_used"
      }
    )
  } catch (error) {
    console.log("[v0] Error notifying service used:", error)
  }
}

/**
 * NOTIFICACIÓN 4: Cambio en ranking
 * Notifica cuando el usuario sube o baja de posición
 */
export async function notifyRankingChange(
  userId: number,
  newRank: number,
  previousRank: number | null,
  accuracyPercentage: number
): Promise<void> {
  try {
    const isImprovement = previousRank === null || newRank < previousRank
    const movement = isImprovement ? "subiste" : "bajaste"
    const message = previousRank === null 
      ? `¡Felicitaciones! Ingresaste al ranking en posición #${newRank} con ${accuracyPercentage.toFixed(2)}% de aciertos.`
      : `${isImprovement ? "¡Excelente!" : "Nota que"} ${movement} en el ranking. Ahora estás en posición #${newRank}.`

    await createNotification(
      userId,
      "ranking_change",
      isImprovement ? "¡Subiste en el ranking!" : "Bajaste en el ranking",
      message,
      {
        newRank,
        previousRank,
        accuracyPercentage,
        isImprovement,
        type: "ranking_change"
      }
    )
  } catch (error) {
    console.log("[v0] Error notifying ranking change:", error)
  }
}

/**
 * NOTIFICACIÓN 5: Acierto en predicción
 * Notifica cuando la predicción del usuario resultó correcta
 */
export async function notifyPredictionHit(
  userId: number,
  lotteryName: string,
  predictedNumber: string,
  winningNumber: string,
  matchType: "exact" | "combination",
  earnings: number
): Promise<void> {
  try {
    const matchLabel = matchType === "exact" ? "ACIERTO EXACTO ✓" : "COMBINACIÓN ✓"
    const message = matchType === "exact"
      ? `¡ACIERTO EXACTO! Predijiste ${predictedNumber} y salió ${winningNumber} en ${lotteryName}.`
      : `¡COMBINACIÓN! Tu predicción ${predictedNumber} combinó con ${winningNumber} en ${lotteryName}.`

    await createNotification(
      userId,
      "prediction_hit",
      matchLabel,
      `${message} Ganaste $${(earnings / 100).toFixed(2)} en ganancias.`,
      {
        lotteryName,
        predictedNumber,
        winningNumber,
        matchType,
        earnings,
        type: "prediction_hit"
      }
    )
  } catch (error) {
    console.log("[v0] Error notifying prediction hit:", error)
  }
}

/**
 * NOTIFICACIÓN 6: Suscripción próxima a vencer
 * Notifica 3 días antes del vencimiento
 */
export async function notifySubscriptionExpiring(
  userId: number,
  expiryDate: string,
  daysLeft: number
): Promise<void> {
  try {
    await createNotification(
      userId,
      "subscription_expiring",
      `Tu suscripción vence en ${daysLeft} día(s)`,
      `Tu caducidad de créditos premium está programada para ${expiryDate}. Renuévala para no perder acceso.`,
      {
        expiryDate,
        daysLeft,
        type: "subscription_expiring"
      }
    )
  } catch (error) {
    console.log("[v0] Error notifying subscription expiring:", error)
  }
}

/**
 * NOTIFICACIÓN 7: Suscripción expirada
 * Notifica cuando la suscripción se vence
 */
export async function notifySubscriptionExpired(
  userId: number
): Promise<void> {
  try {
    await createNotification(
      userId,
      "subscription_expired",
      "Tu suscripción ha expirado",
      "Tu plan premium ha terminado. Suscríbete nuevamente para continuar usando funciones premium.",
      {
        type: "subscription_expired"
      }
    )
  } catch (error) {
    console.log("[v0] Error notifying subscription expired:", error)
  }
}

/**
 * NOTIFICACIÓN 8: Pago recibido
 * Notifica cuando recibe ganancias por sus predicciones
 */
export async function notifyPaymentReceived(
  userId: number,
  amount: number,
  source: string
): Promise<void> {
  try {
    await createNotification(
      userId,
      "payment_received",
      "Ganancia recibida",
      `Recibiste $${(amount / 100).toFixed(2)} por ${source}. Revisa tu cuenta de pagos.`,
      {
        amount,
        source,
        type: "payment_received"
      }
    )
  } catch (error) {
    console.log("[v0] Error notifying payment received:", error)
  }
}

/**
 * NOTIFICACIÓN 9: Nuevo seguidor
 * Notifica cuando un nuevo usuario contrata sus servicios
 */
export async function notifyNewFollower(
  predictorId: number,
  followerUsername: string,
  followerAvatar?: string
): Promise<void> {
  try {
    await createNotification(
      predictorId,
      "new_follower",
      `${followerUsername} te sigue`,
      `${followerUsername} comenzó a seguir tus pronósticos. ¡Bienvenido a tu audiencia!`,
      {
        followerUsername,
        followerAvatar,
        type: "new_follower"
      }
    )
  } catch (error) {
    console.log("[v0] Error notifying new follower:", error)
  }
}