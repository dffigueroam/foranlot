// app/actions/premium-neighbors.ts
"use server"
import { analyzeNeighborsPremium } from "@/lib/premium-neighbors"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

/**
 * Server action para análisis premium de vecinos.
 * @param formData FormData con: numbers (string[]), lotteryName, digitCount, days
 */
export async function analyzeNeighborsPremiumAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !user.isPremium) return { error: "Solo usuarios premium pueden usar esta función" }

  const numbers = formData.getAll("numbers").map(n => n.toString().trim()).filter(Boolean)
  const lotteryName = formData.get("lotteryName")?.toString() || ""
  const digitCount = parseInt(formData.get("digitCount")?.toString() || "0")
  const days = parseInt(formData.get("days")?.toString() || "30")

  if (!numbers.length || !lotteryName || !digitCount) return { error: "Datos incompletos" }

  const result = await analyzeNeighborsPremium(numbers, lotteryName, digitCount, days)
  revalidatePath("/tools")
  return { success: true, result }
}
