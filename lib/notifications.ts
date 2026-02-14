import "server-only"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface Notification {
  id: number
  user_id: number
  type: "info" | "warning" | "success" | "error" | "avatar-change"
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

// Crear una notificación
export async function createNotification(
  userId: number,
  type: "info" | "warning" | "success" | "error" | "avatar-change",
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
