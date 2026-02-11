"use server"

import { verifyEmailToken, resendVerificationEmail, getVerificationStatus } from "@/lib/email-verification"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

// Helper para obtener IP
async function getClientIp(): Promise<string> {
  const headersList = await headers()
  const forwarded = headersList.get("x-forwarded-for")
  const realIp = headersList.get("x-real-ip")
  
  if (forwarded) return forwarded.split(",")[0].trim()
  if (realIp) return realIp
  return "unknown"
}

/**
 * Verifica un token de email
 */
export async function verifyEmail(token: string) {
  if (!token || token.trim() === "") {
    return { error: "Token inválido" }
  }

  const ip = await getClientIp()
  const result = await verifyEmailToken(token, ip)

  if (!result.success) {
    return { error: result.error || "Error al verificar email" }
  }

  revalidatePath("/")
  return { success: true }
}

/**
 * Reenvía el email de verificación al usuario actual
 */
export async function resendVerification() {
  const user = await getCurrentUser()

  if (!user) {
    return { error: "Debes iniciar sesión" }
  }

  // Verificar estado actual
  const status = await getVerificationStatus(user.id)

  if (!status) {
    return { error: "Usuario no encontrado" }
  }

  if (status.isVerified) {
    return { error: "Tu email ya está verificado" }
  }

  const ip = await getClientIp()
  const result = await resendVerificationEmail(user.id, ip)

  if (!result.success) {
    return { error: result.error || "Error al reenviar email" }
  }

  return { success: true }
}

/**
 * Obtiene el estado de verificación del usuario actual
 */
export async function checkVerificationStatus() {
  const user = await getCurrentUser()

  if (!user) {
    return { error: "Debes iniciar sesión" }
  }

  const status = await getVerificationStatus(user.id)

  if (!status) {
    return { error: "Usuario no encontrado" }
  }

  return { 
    success: true,
    isVerified: status.isVerified,
    email: status.email,
    hasActiveToken: status.hasActiveToken
  }
}
