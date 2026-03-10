import "server-only"
import { neon } from "@neondatabase/serverless"
import crypto from "crypto"

const sql = neon(process.env.DATABASE_URL!)

/* ======================================================
   TYPES
====================================================== */

interface EmailVerification {
  id: number
  user_id: number
  email: string
  token: string
  expires_at: string
  verified_at: string | null
  created_at: string
}

/* ======================================================
   TOKEN GENERATION
====================================================== */

/**
 * Genera un token seguro de verificación de email
 */
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

/**
 * Genera una fecha de expiración (24 horas desde ahora)
 */
function getExpirationDate(): Date {
  const now = new Date()
  now.setHours(now.getHours() + 24)
  return now
}

/* ======================================================
   CREATE VERIFICATION TOKEN
====================================================== */

/**
 * Crea un token de verificación para un usuario
 */
export async function createEmailVerificationToken(
  userId: number,
  email: string,
  ipAddress?: string
): Promise<{ token: string; error?: string }> {
  try {
    const token = generateVerificationToken()
    const expiresAt = getExpirationDate()

    // Insertar en la tabla de verificaciones
    await sql`
      INSERT INTO email_verifications (
        user_id,
        email,
        token,
        expires_at,
        ip_address
      ) VALUES (
        ${userId},
        ${email},
        ${token},
        ${expiresAt.toISOString()},
        ${ipAddress || null}
      )
    `

    // Actualizar la tabla users con el token
    await sql`
      UPDATE users
      SET 
        email_verification_token = ${token},
        email_verification_expires = ${expiresAt.toISOString()}
      WHERE id = ${userId}
    `

    return { token }
  } catch (error) {
    console.error("[v0] Error creating verification token:", error)
    return { token: "", error: "Error al crear token de verificación" }
  }
}

/* ======================================================
   VERIFY EMAIL
====================================================== */

/**
 * Verifica un token de email y marca el usuario como verificado
 */
export async function verifyEmailToken(
  token: string,
  ipAddress?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Buscar el token en la tabla de verificaciones
    const verifications = await sql`
      SELECT * FROM email_verifications
      WHERE token = ${token}
        AND verified_at IS NULL
        AND expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `

    if (verifications.length === 0) {
      return { success: false, error: "Token inválido o expirado" }
    }

    const verification = verifications[0] as EmailVerification

    // Marcar como verificado en la tabla de verificaciones
    await sql`
      UPDATE email_verifications
      SET 
        verified_at = CURRENT_TIMESTAMP,
        ip_address = ${ipAddress || verification.ip_address || null}
      WHERE id = ${verification.id}
    `

    // Marcar el usuario como verificado
    await sql`
      UPDATE users
      SET 
        email_verified = TRUE,
        email_verified_at = CURRENT_TIMESTAMP,
        email_verification_token = NULL,
        email_verification_expires = NULL
      WHERE id = ${verification.user_id}
    `

    // Limpiar tokens expirados de una vez (no bloqueante)
    sql`
      DELETE FROM email_verifications
      WHERE expires_at < NOW() AND verified_at IS NULL
    `.catch(() => {})

    console.log(`[v0] Email verified for user ${verification.user_id}`)
    return { success: true }

  } catch (error) {
    console.error("[v0] Error verifying email:", error)
    return { success: false, error: "Error al verificar email" }
  }
}

/* ======================================================
   CHECK VERIFICATION STATUS
====================================================== */

/**
 * Verifica si un usuario tiene el email verificado
 */
export async function isEmailVerified(userId: number): Promise<boolean> {
  try {
    const result = await sql`
      SELECT email_verified FROM users
      WHERE id = ${userId}
    `

    if (result.length === 0) return false

    return result[0].email_verified === true
  } catch (error) {
    console.error("[v0] Error checking email verification:", error)
    return false
  }
}

/**
 * Obtiene el estado de verificación de un usuario
 */
export async function getVerificationStatus(userId: number): Promise<{
  isVerified: boolean
  email: string
  verifiedAt: string | null
  hasActiveToken: boolean
} | null> {
  try {
    const result = await sql`
      SELECT 
        email_verified,
        email,
        email_verified_at,
        email_verification_token,
        email_verification_expires
      FROM users
      WHERE id = ${userId}
    `

    if (result.length === 0) return null

    const user = result[0]
    const hasActiveToken = !!(
      user.email_verification_token &&
      user.email_verification_expires &&
      new Date(user.email_verification_expires) > new Date()
    )

    return {
      isVerified: user.email_verified === true,
      email: user.email,
      verifiedAt: user.email_verified_at,
      hasActiveToken,
    }
  } catch (error) {
    console.error("[v0] Error getting verification status:", error)
    return null
  }
}

/* ======================================================
   RESEND VERIFICATION
====================================================== */

/**
 * Reenvía el email de verificación (invalida tokens anteriores)
 */
export async function resendVerificationEmail(
  userId: number,
  ipAddress?: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    // Verificar que el usuario existe y no está verificado
    const users = await sql`
      SELECT id, email, email_verified FROM users
      WHERE id = ${userId}
    `

    if (users.length === 0) {
      return { success: false, error: "Usuario no encontrado" }
    }

    const user = users[0]

    if (user.email_verified) {
      return { success: false, error: "El email ya está verificado" }
    }

    // Invalidar tokens anteriores
    await sql`
      UPDATE email_verifications
      SET expires_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
        AND verified_at IS NULL
    `

    // Crear nuevo token
    const result = await createEmailVerificationToken(userId, user.email, ipAddress)

    if (result.error) {
      return { success: false, error: result.error }
    }

    return { success: true, token: result.token }

  } catch (error) {
    console.error("[v0] Error resending verification email:", error)
    return { success: false, error: "Error al reenviar email de verificación" }
  }
}

/* ======================================================
   EMAIL SENDING (MOCK)
====================================================== */

/**
 * Envía email de verificación (actualmente es un mock/placeholder)
 * TODO: Integrar con servicio de email (SendGrid, Resend, etc.)
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  username: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`

    // TODO: Integrar con servicio real de email
    console.log("[v0] Email Mock - Verification email would be sent to:", email)
    console.log("[v0] Verification URL:", verificationUrl)
    console.log("[v0] Username:", username)

    // Simular envío exitoso
    // En producción, aquí iría la llamada a SendGrid, Resend, etc.
    /*
    await sendEmail({
      to: email,
      subject: "Verifica tu cuenta en ForanLot",
      html: getVerificationEmailTemplate(username, verificationUrl)
    })
    */

    return { success: true }

  } catch (error) {
    console.error("[v0] Error sending verification email:", error)
    return { success: false, error: "Error al enviar email" }
  }
}

/**
 * Template HTML para email de verificación (placeholder)
 */
function getVerificationEmailTemplate(username: string, verificationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Verifica tu email</title>
      </head>
      <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">¡Bienvenido a ForanLot, ${username}!</h1>
        <p>Gracias por registrarte. Para activar tu cuenta, por favor verifica tu dirección de email haciendo clic en el botón de abajo:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verificar Email
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
          <a href="${verificationUrl}">${verificationUrl}</a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Este enlace expirará en 24 horas. Si no solicitaste esta verificación, puedes ignorar este email.
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          ForanLot - Comunidad de Pronósticos de Lotería<br>
          Este es un email automático, por favor no respondas.
        </p>
      </body>
    </html>
  `
}

/* ======================================================
   CLEANUP
====================================================== */

/**
 * Limpia tokens de verificación expirados
 * Debe ejecutarse diariamente via cron
 */
export async function cleanupExpiredTokens(): Promise<{ success: boolean; deletedCount?: number }> {
  try {
    const result = await sql`
      SELECT cleanup_expired_email_tokens() as deleted_count
    `

    const deletedCount = result[0]?.deleted_count || 0

    console.log(`[v0] Cleaned up ${deletedCount} expired verification tokens`)
    return { success: true, deletedCount }

  } catch (error) {
    console.error("[v0] Error cleaning up expired tokens:", error)
    return { success: false }
  }
}
