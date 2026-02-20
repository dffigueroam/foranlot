"use server"
import { getUserPredictions, getLatestPostedPredictions } from "@/lib/predictions"
import { analyzePatterns } from "@/lib/optimization-patterns"
import { getCurrentUser } from "@/lib/auth"
import { getActiveLinkedAccount } from "@/lib/linked-accounts"

export async function analyzeOptimizationPatterns() {
  const user = await getCurrentUser()
  if (!user || !user.is_premium) {
    // Si no es premium, mostrar el último pronóstico de la cuenta vinculada si existe
    const linked = user ? await getActiveLinkedAccount(user.userId) : null
    if (linked) {
      const latest = await getLatestPostedPredictions(linked.free_user_id)
      if (latest.length > 0) {
        return { latestPrediction: latest[0] }
      }
    }
    return { error: "Solo usuarios premium pueden analizar patrones." }
  }
  const linked = await getActiveLinkedAccount(user.userId)
  if (!linked) return { error: "No tienes cuenta gratis vinculada activa." }
  const predictions = await getUserPredictions(linked.free_user_id)
  if (!predictions.length) return { error: "La cuenta vinculada no tiene pronósticos suficientes." }
  const patterns = analyzePatterns(predictions)
  return { patterns }
// (Fin del archivo)
}
