"use server"

import { getCurrentUser } from "@/lib/auth"
import { getUserLastCombinations } from "@/lib/lottery-combinations"

export async function getLastCombinationsAction() {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const combinations = await getUserLastCombinations(user.id)
  return { combinations }
}
