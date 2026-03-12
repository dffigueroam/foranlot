"use server"

import { getCurrentUser } from "@/lib/auth"
import { getVerifiedCorrectPredictionsWithUser } from "@/lib/predictions"

export async function fetchVerifiedCorrectPredictions() {
  const user = await getCurrentUser()
  if (!user) return []

  const predictions = await getVerifiedCorrectPredictionsWithUser(user.id)
  return predictions
}
