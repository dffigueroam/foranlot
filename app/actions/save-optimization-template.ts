"use server"
import { getCurrentUser } from "@/lib/auth"
import { getActiveLinkedAccount } from "@/lib/linked-accounts"
import { saveOptimizationTemplate } from "@/lib/optimization-templates"

export async function saveOptimizationTemplateAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !user.isPremium) return { error: "Solo usuarios premium pueden guardar plantillas." }
  const linked = await getActiveLinkedAccount(user.userId)
  if (!linked) return { error: "No tienes cuenta gratis vinculada activa." }
  const templateName = String(formData.get("templateName") || "")
  const algorithm = String(formData.get("algorithm") || "")
  const params = formData.get("params") ? JSON.parse(String(formData.get("params"))) : {}
  if (!templateName || !algorithm) return { error: "Nombre y algoritmo requeridos." }
  const result = await saveOptimizationTemplate({
    premium_user_id: user.userId,
    free_user_id: linked.free_user_id,
    template_name: templateName,
    algorithm,
    params
  })
  return result
}
