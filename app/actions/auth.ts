"use server"

import { registerUser, loginUser, logoutUser, checkUsernameAvailability } from "@/lib/auth"
import { sanitizeInput, logSuspiciousActivity, checkRateLimit } from "@/lib/security"
import { validateRegistration, validateEmail, validateUsername } from "@/lib/validators"
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

export async function register(formData: FormData) {
  // Rate limiting - máximo 3 intentos de registro cada hora
  const ip = await getClientIp()
  const rateLimitCheck = await checkRateLimit(`register_${ip}`, "register")
  
  if (!rateLimitCheck.allowed) {
    await logSuspiciousActivity(
      `ip_${ip}`,
      "register_rate_limit",
      "Demasiados intentos de registro",
      "medium"
    )
    return { 
      error: "Demasiados intentos de registro. Intenta más tarde" 
    }
  }

  const emailRaw = formData.get("email") as string
  const password = formData.get("password") as string
  const usernameRaw = formData.get("username") as string
  const fullNameRaw = formData.get("fullName") as string
  const phoneRaw = formData.get("phone") as string
  const countryRaw = formData.get("country") as string
  const cityRaw = formData.get("city") as string
  const idDocumentRaw = formData.get("idDocument") as string
  const acceptedTerms = formData.get("acceptedTerms") === "true"
  const selectedAvatarId = formData.get("selectedAvatarId") as string | null

  // Validar aceptación de términos
  if (!acceptedTerms) {
    return { error: "Debes aceptar los términos y condiciones" }
  }

  // Sanitizar inputs
  const email = sanitizeInput(emailRaw, "email")
  const username = sanitizeInput(usernameRaw, "username")
  const fullName = sanitizeInput(fullNameRaw, "text")
  const phone = phoneRaw ? sanitizeInput(phoneRaw, "text") : null
  const country = sanitizeInput(countryRaw, "text")
  const city = sanitizeInput(cityRaw, "text")
  const idDocument = idDocumentRaw ? sanitizeInput(idDocumentRaw, "text") : null

  // Validar todos los campos
  const validation = validateRegistration({
    email,
    username,
    password,
    fullName,
    phone,
    country,
    city,
    idDocument,
  })

  if (!validation.isValid) {
    await logSuspiciousActivity(
      `ip_${ip}`,
      "invalid_register_input",
      validation.error || "Datos de registro inválidos",
      "low"
    )
    return { error: validation.error }
  }

  const result = await registerUser(email, password, username, {
    fullName,
    phone,
    country,
    city,
    idDocument,
  }, selectedAvatarId || undefined)

  if (result.error) {
    return { error: result.error }
  }

  revalidatePath("/")
  return { success: true }
}

/**
 * Server action para verificar disponibilidad de username
 */
export async function checkUsername(username: string) {
  // Validar formato primero
  const validation = validateUsername(username)
  if (!validation.isValid) {
    return { available: false, error: validation.error }
  }

  const available = await checkUsernameAvailability(username)
  return { available, error: available ? undefined : "Este nombre de usuario ya está en uso" }
}

export async function login(formData: FormData) {
  const emailRaw = formData.get("email") as string
  const password = formData.get("password") as string

  // Sanitizar email
  const email = sanitizeInput(emailRaw, "email")

  if (!email || !password) {
    const ip = await getClientIp()
    await logSuspiciousActivity(
      `ip_${ip}`,
      "invalid_login_input",
      "Campos inválidos en login",
      "low"
    )
    return { error: "Email y contraseña son requeridos" }
  }

  const result = await loginUser(email, password)

  if (result.error) {
    return { error: result.error }
  }

  revalidatePath("/")
  return { success: true }
}

export async function logout() {
  await logoutUser()
  revalidatePath("/")
  return { success: true }
}

export async function logoutAction() {
  await logoutUser()
  revalidatePath("/")
  return { success: true }
}
