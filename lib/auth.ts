// Registro especial para LotIQLite: usuario solo con email, sin contraseña, rol user_email
export async function registerUserEmailLite({
  email,
  username,
  password
}: {
  email: string
  username: string
  password: string
}) {
  try {
    // Generar username automático si no se provee
    let assignedUsername = username
    if (!assignedUsername || assignedUsername.trim() === "") {
      assignedUsername = `user${Math.floor(100000 + Math.random() * 900000)}`
    }
    let tries = 0
    while (!(await checkUsernameAvailability(assignedUsername)) && tries < 5) {
      assignedUsername = `user${Math.floor(100000 + Math.random() * 900000)}`
      tries++
    }
    // Hashear la contraseña
    const password_hash = await bcrypt.hash(password, 10)
    const result = await sql`
      INSERT INTO users (
        email,
        password_hash,
        username,
        role,
        registration_method,
        is_synthetic_pending
      )
      VALUES (
        ${email},
        ${password_hash},
        ${assignedUsername},
        'user_email',
        'email',
        false
      )
      RETURNING id, email, username, is_premium, role, stripe_customer_id, subscription_status
    `
    if (result.length === 0) {
      return { error: "Error al crear usuario" }
    }
    const user = result[0] as User
    await sql`
      INSERT INTO user_stats (user_id, total_predictions, correct_predictions, accuracy_percentage)
      VALUES (${user.id}, 0, 0, 0)
      ON CONFLICT (user_id) DO NOTHING
    `
    // Crear sesión JWT
    const sessionData: SessionData = {
      userId: user.id,
      email: user.email,
      username: user.username,
      isPremium: user.is_premium,
      role: user.role,
    }
    const token = await createToken(sessionData)
    const cookieStore = await cookies()
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    })
    return { user }
  } catch (error: any) {
    if (error.code === "23505") {
      return { error: "El email o nombre de usuario ya está registrado" }
    }
    return { error: error?.message ? `Error: ${error.message}` : "Error al registrar usuario" }
  }
}
import "server-only"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { neon } from "@neondatabase/serverless"
import { createEmailVerificationToken, sendVerificationEmail } from "./email-verification"
import { setSuggestedAvatar, SUGGESTED_AVATARS } from "./avatars"

const sql = neon(process.env.DATABASE_URL!)
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production",
)

/* ======================================================
   TYPES
====================================================== */

export interface User {
  id: number
  email: string
  username: string
  is_premium: boolean
  stripe_customer_id: string | null
  subscription_status: string | null
  role: "user" | "admin"
}

export interface SessionData extends Record<string, any> {
  userId: number
  email: string
  username: string
  isPremium: boolean
  role: "user" | "admin"
}

/* ======================================================
   JWT HELPERS
====================================================== */

async function createToken(data: SessionData): Promise<string> {
  return await new SignJWT(data)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET_KEY)
}

export async function verifyToken(
  token: string,
): Promise<(SessionData & { id: number }) | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    const sessionData = payload as unknown as SessionData

    const result = await sql`
      SELECT id, role
      FROM users
      WHERE id = ${sessionData.userId}
    `

    if (result.length === 0) return null

    return {
      ...sessionData,
      id: result[0].id,
      role: result[0].role,
    }
  } catch {
    return null
  }
}

/* ======================================================
   REGISTER
====================================================== */

export async function registerUser(
  email: string,
  password: string,
  username: string,
  profile?: {
    fullName?: string
    phone?: string | null
    country?: string
    city?: string
    idDocument?: string | null
  },
  selectedAvatarId?: string
) {
  try {
    const passwordHash = await bcrypt.hash(password, 10)

    // Generar username automático si no se provee
    let assignedUsername = username
    if (!assignedUsername || assignedUsername.trim() === "") {
      // Formato: user + 6 dígitos aleatorios
      assignedUsername = `user${Math.floor(100000 + Math.random() * 900000)}`
    }
    // Verificar que no exista
    let tries = 0
    while (!(await checkUsernameAvailability(assignedUsername)) && tries < 5) {
      assignedUsername = `user${Math.floor(100000 + Math.random() * 900000)}`
      tries++
    }
    const result = await sql`
      INSERT INTO users (
        email, 
        password_hash, 
        username,
        full_name,
        phone_number,
        city,
        country,
        id_document,
        id_document_country,
        registration_method
      )
      VALUES (
        ${email}, 
        ${passwordHash}, 
        ${assignedUsername},
        ${profile?.fullName || null},
        ${profile?.phone || null},
        ${profile?.city || null},
        ${profile?.country || null},
        ${profile?.idDocument || null},
        ${profile?.idDocument ? profile.country : null},
        'email'
      )
      RETURNING id, email, username, is_premium, role, stripe_customer_id, subscription_status
    `

    if (result.length === 0) {
      return { error: "Error al crear usuario" }
    }

    const user = result[0] as User

    await sql`
      INSERT INTO user_stats (user_id, total_predictions, correct_predictions, accuracy_percentage)
      VALUES (${user.id}, 0, 0, 0)
      ON CONFLICT (user_id) DO NOTHING
    `

    // Asignar avatar: usar el seleccionado o uno al azar
    const avatarId = selectedAvatarId || SUGGESTED_AVATARS[Math.floor(Math.random() * SUGGESTED_AVATARS.length)].id
    await setSuggestedAvatar(user.id, avatarId)

    // Crear token de verificación de email
    const verificationResult = await createEmailVerificationToken(user.id, user.email)
    
    if (verificationResult.token) {
      // Enviar email de verificación (actualmente mock)
      await sendVerificationEmail(user.email, verificationResult.token, user.username)
      console.log(`[v0] Verification email created for user ${user.id}`)
    }

    const sessionData: SessionData = {
      userId: user.id,
      email: user.email,
      username: user.username,
      isPremium: user.is_premium,
      role: user.role,
    }

    const token = await createToken(sessionData)

    const cookieStore = await cookies()
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    })

    return { user }
  } catch (error: any) {
    if (error.code === "23505") {
      return { error: "El email o nombre de usuario ya está registrado" }
    }
    return { error: "Error al registrar usuario" }
  }
}

/* ======================================================
   LOGIN
====================================================== */

export async function loginUser(email: string, password: string) {
  try {
    const result = await sql`
      SELECT id, email, username, password_hash, is_premium, role, stripe_customer_id, subscription_status
      FROM users
      WHERE email = ${email}
    `

    if (result.length === 0) {
      return { error: "Credenciales inválidas" }
    }


    const user = result[0] as User & { password_hash: string }
    // Bloqueo para usuarios con rol user_email
    if (user.role === "user_email") {
      return { error: "Este tipo de cuenta no puede iniciar sesión por este método." }
    }

    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return { error: "Credenciales inválidas" }
    }

    const sessionData: SessionData = {
      userId: user.id,
      email: user.email,
      username: user.username,
      isPremium: user.is_premium,
      role: user.role,
    }

    const token = await createToken(sessionData)

    const cookieStore = await cookies()
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    })

    return { user }
  } catch {
    return { error: "Error al iniciar sesión" }
  }
}

/* ======================================================
   CURRENT USER
====================================================== */

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) return null

    const sessionData = await verifyToken(sessionCookie.value)
    if (!sessionData) return null

    const result = await sql`
      SELECT id, email, username, is_premium, role, stripe_customer_id, subscription_status
      FROM users
      WHERE id = ${sessionData.userId}
    `

    if (result.length === 0) return null

    return result[0] as User
  } catch {
    return null
  }
}

/* ======================================================
   LOGOUT
====================================================== */

export async function logoutUser() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}

/* ======================================================
   PREMIUM UPDATE
====================================================== */

export async function updateUserPremiumStatus(
  userId: number,
  isPremium: boolean,
  stripeCustomerId?: string,
  subscriptionId?: string,
  subscriptionStatus?: string,
) {
  try {
    await sql`
      UPDATE users
      SET 
        is_premium = ${isPremium},
        stripe_customer_id = ${stripeCustomerId || null},
        subscription_id = ${subscriptionId || null},
        subscription_status = ${subscriptionStatus || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `
    return { success: true }
  } catch {
    return { error: "Error al actualizar usuario" }
  }
}

/* ======================================================
   USERNAME AVAILABILITY
====================================================== */

/**
 * Verificar si un username está disponible
 */
export async function checkUsernameAvailability(username: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT id FROM users
      WHERE LOWER(username) = LOWER(${username})
    `
    return result.length === 0
  } catch (error) {
    console.log("[v0] Error checking username availability:", error)
    return false
  }
}

/**
 * Verificar si un email ya está registrado
 */
export async function checkEmailAvailability(email: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT id FROM users
      WHERE LOWER(email) = LOWER(${email})
    `
    return result.length === 0
  } catch (error) {
    console.log("[v0] Error checking email availability:", error)
    return false
  }
}
