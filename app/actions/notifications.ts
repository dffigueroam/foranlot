"use server"

import { getCurrentUser } from "@/lib/auth"
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead as markAllNotificationsAsReadLib,
  deleteNotification as deleteNotificationLib,
  deleteReadNotifications,
} from "@/lib/notifications"

export async function getNotifications(unreadOnly: boolean = false) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "No autenticado" }
  }

  try {
    const notifications = await getUserNotifications(user.id, unreadOnly)
    return { success: true, notifications }
  } catch (error) {
    console.log("[v0] Error getting notifications:", error)
    return { error: "Error al obtener notificaciones" }
  }
}

export async function markAsRead(notificationId: number) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "No autenticado" }
  }

  try {
    const success = await markNotificationAsRead(notificationId)
    return { success }
  } catch (error) {
    console.log("[v0] Error marking notification as read:", error)
    return { error: "Error al marcar como leído" }
  }
}

export async function markAllAsRead() {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "No autenticado" }
  }

  try {
    const success = await markAllNotificationsAsReadLib(user.id)
    return { success }
  } catch (error) {
    console.log("[v0] Error marking all as read:", error)
    return { error: "Error al marcar todas como leída" }
  }
}

export async function deleteNotification(notificationId: number) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "No autenticado" }
  }

  try {
    const success = await deleteNotificationLib(notificationId)
    return { success }
  } catch (error) {
    console.log("[v0] Error deleting notification:", error)
    return { error: "Error al eliminar notificación" }
  }
}

export async function deleteReadNotis() {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "No autenticado" }
  }

  try {
    const success = await deleteReadNotifications(user.id)
    return { success }
  } catch (error) {
    console.log("[v0] Error deleting read notifications:", error)
    return { error: "Error al eliminar notificaciones leídas" }
  }
}
