"use server"

import { registerUser, loginUser, logoutUser } from "@/lib/auth"
import { sanitizeInput, logSuspiciousActivity } from "@/lib/security"
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
  const emailRaw = formData.get("email") as string
  const password = formData.get("password") as string
  const usernameRaw = formData.get("username") as string
  const fullNameRaw = formData.get("fullName") as string
  const phoneRaw = formData.get("phone") as string
  const countryRaw = formData.get("country") as string
  const cityRaw = formData.get("city") as string

  // Sanitizar inputs
  const email = sanitizeInput(emailRaw, "email")
  const username = sanitizeInput(usernameRaw, "username")
  const fullName = sanitizeInput(fullNameRaw, "text")
  const phone = phoneRaw ? sanitizeInput(phoneRaw, "text") : null
  const country = sanitizeInput(countryRaw, "text")
  const city = sanitizeInput(cityRaw, "text")

  if (!email || !password || !username || !fullName || !country || !city) {
    const ip = await getClientIp()
    await logSuspiciousActivity(
      `ip_${ip}`,
      "invalid_register_input",
      "Campos requeridos faltantes en registro",
      "low"
    )
    return { error: "Campos requeridos faltantes" }
  }

  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" }
  }

  const result = await registerUser(email, password, username, {
    fullName,
    phone,
    country,
    city,
  })

  if (result.error) {
    return { error: result.error }
  }

  revalidatePath("/")
  return { success: true }
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
