"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { createManualPaymentRequest } from "@/lib/manual-payments"

/**
 * Enviar reporte de pago manual
 */
export async function submitPaymentReportAction(formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Debes iniciar sesión" }
    }

    const planType = formData.get("planType") as "monthly" | "annual"
    const amountCents = parseInt(formData.get("amountCents") as string, 10)
    const creditsToAdd = parseInt(formData.get("creditsToAdd") as string, 10)
    const paymentMethod = formData.get("paymentMethod") as string
    const referenceNumber = formData.get("referenceNumber") as string
    const bankName = formData.get("bankName") as string
    const paymentDate = formData.get("paymentDate") as string
    const notes = formData.get("notes") as string

    if (!referenceNumber || !paymentDate) {
      return { error: "Referencia y fecha son requeridas" }
    }

    const result = await createManualPaymentRequest({
      userId: user.id,
      planType,
      amountCents,
      creditsToAdd,
      paymentMethod,
      referenceNumber,
      bankName: bankName || undefined,
      paymentDate,
      notes: notes || undefined,
    })

    revalidatePath("/my-payments")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Reporte enviado exitosamente",
      requestId: result.id,
    }

  } catch (error) {
    console.error("[v0] Error submitting payment report:", error)
    return { error: "Error al reportar el pago" }
  }
}
