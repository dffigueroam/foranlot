"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import {
  createManualPaymentRequest,
  getPendingPaymentRequests,
  getUserPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest,
} from "@/lib/manual-payments"

export async function submitManualPayment(formData: FormData) {
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  try {
    const planType = formData.get("planType") as "monthly" | "annual"
    const referenceNumber = formData.get("referenceNumber") as string
    const bankName = formData.get("bankName") as string
    const paymentDate = formData.get("paymentDate") as string
    const notes = formData.get("notes") as string
    const receiptUrl = formData.get("receiptUrl") as string

    // Determinar créditos y precio según el plan
    const amountCents = planType === "monthly" ? 1900 : 19900
    const creditsToAdd = planType === "monthly" ? 30 : 365

    const result = await createManualPaymentRequest({
      userId: user.id,
      planType,
      amountCents,
      creditsToAdd,
      paymentMethod: "transfer",
      receiptUrl,
      referenceNumber,
      bankName,
      paymentDate,
      notes,
    })

    revalidatePath("/pricing")
    revalidatePath("/dashboard")

    return { success: true, data: result }
  } catch (error) {
    console.error("[v0] Error submitting manual payment:", error)
    return { success: false, error: "Error al enviar solicitud de pago" }
  }
}

export async function getPendingPayments() {
  const user = await getCurrentUser()

  if (!user || user.role !== "admin") {
    return { success: false, error: "No autorizado" }
  }

  try {
    const payments = await getPendingPaymentRequests()
    return { success: true, data: payments }
  } catch (error) {
    console.error("[v0] Error getting pending payments:", error)
    return { success: false, error: "Error al obtener pagos pendientes" }
  }
}

export async function getMyPaymentRequests() {
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  try {
    const payments = await getUserPaymentRequests(user.id)
    return { success: true, data: payments }
  } catch (error) {
    console.error("[v0] Error getting payment requests:", error)
    return { success: false, error: "Error al obtener solicitudes" }
  }
}

export async function approvePayment(requestId: number) {
  const user = await getCurrentUser()

  if (!user || user.role !== "admin") {
    return { success: false, error: "No autorizado" }
  }

  try {
    const result = await approvePaymentRequest(requestId, user.id)
    revalidatePath("/admin")
    return { success: true, data: result }
  } catch (error: any) {
    console.error("[v0] Error approving payment:", error)
    return { success: false, error: error.message || "Error al aprobar pago" }
  }
}

export async function rejectPayment(requestId: number, reason: string) {
  const user = await getCurrentUser()

  if (!user || user.role !== "admin") {
    return { success: false, error: "No autorizado" }
  }

  try {
    const result = await rejectPaymentRequest(requestId, user.id, reason)
    revalidatePath("/admin")
    return { success: true, data: result }
  } catch (error) {
    console.error("[v0] Error rejecting payment:", error)
    return { success: false, error: "Error al rechazar pago" }
  }
}
