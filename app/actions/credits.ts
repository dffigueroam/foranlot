"use server"
import { getCurrentUser } from "@/lib/auth"
import {
  getUserCredits,
  createSelection,
  getUserSelections,
  cancelSelection,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getSelectedPredictions,
  generateAndDownloadPrediction,
} from "@/lib/credits"

export async function getCreditsAction() {
  const user = await getCurrentUser()

  if (!user) {
    return { error: "No autenticado" }
  }

  const credits = await getUserCredits(user.id)
  return { credits }
}

export async function createSelectionAction(
  selectionType: "number" | "user",
  lotteryType: string,
  selectedNumber?: string,
  selectedUserId?: number,
) {
  const user = await getCurrentUser()

  if (!user) {
    return { error: "No autenticado" }
  }

  if (!user.is_premium) {
    return { error: "Solo usuarios premium pueden crear selecciones" }
  }

  try {
    const selection = await createSelection(user.id, selectionType, lotteryType, selectedNumber, selectedUserId)
    return { success: true, selection }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getSelectionsAction() {
  const user = await getCurrentUser()

  if (!user) {
    return { error: "No autenticado" }
  }

  const selections = await getUserSelections(user.id)
  return { selections }
}

export async function cancelSelectionAction(selectionId: number) {
  const user = await getCurrentUser()

  if (!user) {
    return { error: "No autenticado" }
  }

  await cancelSelection(selectionId, user.id)
  return { success: true }
}

export async function getNotificationsAction(unreadOnly = false) {
  const user = await getCurrentUser()

  if (!user) {
    return { error: "No autenticado" }
  }

  const notifications = await getUserNotifications(user.id, unreadOnly)
  return { notifications }
}

export async function markNotificationReadAction(notificationId: number) {
  const user = await getCurrentUser()

  if (!user) {
    return { error: "No autenticado" }
  }

  await markNotificationAsRead(notificationId, user.id)
  return { success: true }
}

export async function markAllNotificationsReadAction() {
  const user = await getCurrentUser()

  if (!user) {
    return { error: "No autenticado" }
  }

  await markAllNotificationsAsRead(user.id)
  return { success: true }
}

export async function getSelectedPredictionsAction() {
  const user = await getCurrentUser()

  if (!user) {
    return { error: "No autenticado" }
  }

  const predictions = await getSelectedPredictions(user.id)
  return { predictions }
}

export async function generatePredictionAction(selectionId: number) {
  const user = await getCurrentUser()

  if (!user) {
    return { error: "No autenticado" }
  }

  if (!user.is_premium) {
    return { error: "Solo usuarios premium pueden descargar pronósticos" }
  }

  try {
    const result = await generateAndDownloadPrediction(user.id, selectionId)
    return result
  } catch (error: any) {
    return {
      success: false,
      prediction: null,
      filename: "",
      content: "",
      error: error.message,
    }
  }
}
