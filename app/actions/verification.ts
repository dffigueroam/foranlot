"use server"

import {
  verifyPredictionsForDate,
  verifyPendingPredictions,
  getLotteryResults,
  verifyPredictionsFromStoredResults,
} from "@/lib/verification"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function manualVerifyPredictions(date: string) {
  const user = await getCurrentUser()

  // Solo permitir a usuarios premium o administradores
  // En producción, deberías tener un campo is_admin en la tabla users
  if (!user) {
    return { error: "Debes iniciar sesión" }
  }

  const result = await verifyPredictionsForDate(date)

  if (result.success) {
    revalidatePath("/dashboard")
    revalidatePath("/predictions")
    revalidatePath("/ranking")
    revalidatePath("/stats")
  }

  return result
}

export async function manualVerifyPredictionsFromDb(date: string) {
  const user = await getCurrentUser()

  if (!user) {
    return { error: "Debes iniciar sesión" }
  }

  const result = await verifyPredictionsFromStoredResults(date)

  if (result.success) {
    revalidatePath("/dashboard")
    revalidatePath("/predictions")
    revalidatePath("/ranking")
    revalidatePath("/stats")
  }

  return result
}

export async function runAutoVerification() {
  const result = await verifyPendingPredictions()

  if (result.success) {
    revalidatePath("/dashboard")
    revalidatePath("/predictions")
    revalidatePath("/ranking")
    revalidatePath("/stats")
  }

  return result
}

export async function fetchLotteryResults(date?: string) {
  return await getLotteryResults(date)
}
