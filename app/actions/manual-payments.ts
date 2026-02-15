"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import {
  createManualPaymentRequest,
  getPendingPaymentRequests,
  getUserPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest,
  getPaymentRequestById,
} from "@/lib/manual-payments"
import { notifyAdminNewPayment, notifyUserPaymentApproved, notifyUserPaymentRejected } from "@/lib/email"

export async function submitManualPayment(formData: FormData) {
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  try {
    const planType = formData.get("planType") as string
    const referenceNumber = formData.get("referenceNumber") as string
    
    console.log("[v0] submitManualPayment - planType:", planType)
    console.log("[v0] submitManualPayment - referenceNumber:", referenceNumber)
    console.log("[v0] submitManualPayment - user.id:", user.id)
    
    // Validaciones simples
    if (!planType || (planType !== "monthly" && planType !== "yearly" && planType !== "annual")) {
      return { success: false, error: "Plan inválido" }
    }
    
    if (!referenceNumber || referenceNumber.trim() === "") {
      return { success: false, error: "El número de referencia es obligatorio" }
    }

    // Procesar archivo si existe
    const receiptFile = formData.get("receiptFile") as File | null
    const paymentMethodId = formData.get("paymentMethodId") as string
    let receiptFileData: { filename: string; content: string } | undefined

    if (receiptFile && receiptFile.size > 0) {
      try {
        const arrayBuffer = await receiptFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64Content = buffer.toString("base64")
        
        receiptFileData = {
          filename: receiptFile.name,
          content: base64Content,
        }
        
        console.log(`[v0] Archivo procesado: ${receiptFile.name} (${receiptFile.size} bytes)`)
      } catch (fileError) {
        console.error("[v0] Error procesando archivo:", fileError)
        return { success: false, error: "Error al procesar el comprobante" }
      }
    }

    // Normalizar planType a "monthly" o "annual"
    const normalizedPlanType = planType === "yearly" ? "annual" : "monthly"
    
    // Fecha del reporte = hoy
    const reportDate = new Date().toISOString().split('T')[0]
    
    console.log("[v0] Guardando en BD - userId:", user.id, "planType:", normalizedPlanType, "reportDate:", reportDate, "referenceNumber:", referenceNumber)

    const result = await createManualPaymentRequest({
      userId: user.id,
      planType: normalizedPlanType,
      reportDate,
      referenceNumber,
    })

    console.log(`[v0] Solicitud de pago creada: ID=${result.id}, Usuario=${user.username}, Plan=${normalizedPlanType}`)

    // Enviar notificación al admin con comprobante adjunto
    await notifyAdminNewPayment({
      username: user.username,
      email: user.email,
      userId: user.id,
      planType: normalizedPlanType,
      referenceNumber,
      reportDate,
      paymentMethod: paymentMethodId,
      receiptFile: receiptFileData,
    })

    console.log(`[v0] Email de notificación enviado a admin`)

    revalidatePath("/pricing")
    revalidatePath("/dashboard")
    revalidatePath("/my-payments")

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
    const paymentData = await getPaymentRequestById(requestId)

    if (paymentData && paymentData.email) {
      // Enviar email de aprobación
      await notifyUserPaymentApproved({
        username: paymentData.username || "Usuario",
        email: paymentData.email,
        planType: paymentData.plan_type === "monthly" ? "Mensual" : "Anual",
        creditsAdded: paymentData.credits_to_add,
      })
    }

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
    const paymentData = await getPaymentRequestById(requestId)
    const result = await rejectPaymentRequest(requestId, user.id, reason)

    if (paymentData && paymentData.email) {
      // Enviar email de rechazo
      await notifyUserPaymentRejected({
        username: paymentData.username || "Usuario",
        email: paymentData.email,
        reason,
      })
    }

    revalidatePath("/admin")
    return { success: true, data: result }
  } catch (error) {
    console.error("[v0] Error rejecting payment:", error)
    return { success: false, error: "Error al rechazar pago" }
  }
}
