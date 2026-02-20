"use server"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "../../lib/auth"
import {
  getLinkedAccounts,
  linkFreeAccountToPremium,
  unlinkFreeAccount,
  getActiveLinkedAccount,
  getOptimizationHistory,
  addOptimizationSuggestion
} from "../../lib/linked-accounts"

// Obtener cuentas vinculadas del usuario premium actual
export async function fetchLinkedAccounts() {
  const user = await getCurrentUser()
  if (!user || !user.is_premium) return { error: "Solo usuarios premium pueden acceder." }
  const accounts = await getLinkedAccounts(user.userId)
  return { accounts }
}

// Vincular una cuenta gratis
import { getUserByEmail } from "../../lib/users"

export async function linkAccountAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !user.is_premium) return { error: "Solo usuarios premium pueden vincular cuentas." }
  const freeUserEmail = String(formData.get("freeUserEmail") || "").trim().toLowerCase()
  if (!freeUserEmail) return { error: "Correo de cuenta gratis inválido." }
  const freeUser = await getUserByEmail(freeUserEmail)
  if (!freeUser) return { error: "No existe una cuenta gratis con ese correo." }
  const result = await linkFreeAccountToPremium(user.userId, freeUser.id)
  revalidatePath("/premium/optimizacion")
  return result
}

// Desvincular cuenta gratis
export async function unlinkAccountAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !user.is_premium) return { error: "Solo usuarios premium pueden desvincular cuentas." }
  const freeUserId = Number(formData.get("freeUserId"))
  if (!freeUserId) return { error: "ID de cuenta gratis inválido." }
  const result = await unlinkFreeAccount(user.userId, freeUserId)
  revalidatePath("/premium/optimizacion")
  return result
}

// Consultar cuenta activa
export async function fetchActiveLinkedAccount() {
  const user = await getCurrentUser()
  if (!user || !user.isPremium) return { error: "Solo usuarios premium pueden acceder." }
  const account = await getActiveLinkedAccount(user.userId)
  return { account }
}

// Consultar historial de optimización
export async function fetchOptimizationHistory() {
  const user = await getCurrentUser()
  if (!user || !user.isPremium) return { error: "Solo usuarios premium pueden acceder." }
  const history = await getOptimizationHistory(user.userId)
  return { history }
}

// Registrar sugerencia de optimización generativa
export async function addOptimizationSuggestionAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !user.isPremium) return { error: "Solo usuarios premium pueden optimizar." }
  const freeUserId = Number(formData.get("freeUserId"))
  const originalPredictionId = formData.get("originalPredictionId") ? Number(formData.get("originalPredictionId")) : null
  const optimizedPrediction = String(formData.get("optimizedPrediction") || "")
  if (!freeUserId || !optimizedPrediction) return { error: "Datos incompletos." }
  const result = await addOptimizationSuggestion({
    premium_user_id: user.userId,
    free_user_id: freeUserId,
    original_prediction_id: originalPredictionId,
    optimized_prediction: optimizedPrediction
  })
  revalidatePath("/premium/optimizacion")
  return result
}
