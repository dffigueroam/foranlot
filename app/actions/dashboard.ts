"use server"

import { getVerifiedCorrectPredictionsWithUser } from "@/lib/predictions"
import { revalidatePath } from "next/cache"

export async function fetchVerifiedCorrectPredictions() {
  const predictions = await getVerifiedCorrectPredictionsWithUser()
  revalidatePath("/dashboard")
  return predictions
}
