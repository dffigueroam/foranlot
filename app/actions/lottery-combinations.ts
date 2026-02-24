
"use server"

import { getCurrentUser } from "@/lib/auth"
import { getUserLastCombinations } from "@/lib/lottery-combinations"

export async function getLastLotteryCombinations(limit: number, userId?: number) {
  try {
    // Si hay userId, filtra por usuario; si no, trae global
    const combinations = userId
      ? await getUserLastCombinations(userId)
      : await getUserLastCombinations(1) // fallback demo
    return {
      success: true,
      combinations: combinations.slice(0, limit)
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Error al consultar combinaciones"
    }
  }
}

export async function getLastCombinationsAction() {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const combinations = await getUserLastCombinations(user.id)
  return { combinations }
}
