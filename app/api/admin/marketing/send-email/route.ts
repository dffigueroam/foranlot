import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(req: Request) {
  try {
    // Verificar autenticación y rol de administrador
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { to, subject, html, isTest, recipientType } = body

    // Validaciones
    if (!subject || !html) {
      return NextResponse.json(
        { error: "Asunto y contenido HTML son requeridos" },
        { status: 400 }
      )
    }

    let recipients: string[] = []

    // Determinar destinatarios
    if (isTest) {
      // Envío de prueba al admin
      recipients = [user.email]
    } else if (recipientType === "manual" && to) {
      // Emails manuales separados por coma
      recipients = to.split(",").map((e: string) => e.trim()).filter((e: string) => e)
    } else if (recipientType === "all_users") {
      // Todos los usuarios registrados
      const users = await sql`SELECT email FROM users WHERE email IS NOT NULL`
      recipients = users.map((u: any) => u.email)
    } else if (recipientType === "premium_users") {
      // Solo usuarios premium
      const users = await sql`SELECT email FROM users WHERE is_premium = true AND email IS NOT NULL`
      recipients = users.map((u: any) => u.email)
    } else if (recipientType === "regular_users") {
      // Solo usuarios no premium
      const users = await sql`SELECT email FROM users WHERE is_premium = false AND email IS NOT NULL`
      recipients = users.map((u: any) => u.email)
    } else {
      return NextResponse.json(
        { error: "Tipo de destinatario inválido" },
        { status: 400 }
      )
    }

    // Validar que hay destinatarios
    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No hay destinatarios válidos" },
        { status: 400 }
      )
    }

    // Límite de seguridad para evitar spam accidental
    const MAX_RECIPIENTS = 1000
    if (recipients.length > MAX_RECIPIENTS && !isTest) {
      return NextResponse.json(
        { error: `Máximo ${MAX_RECIPIENTS} destinatarios por envío` },
        { status: 400 }
      )
    }

    // Enviar correos
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Enviar en lotes para evitar rate limits
    const BATCH_SIZE = 10
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE)
      
      const promises = batch.map(async (email) => {
        try {
          // Procesar variables dinámicas
          let personalizedHtml = html
          
          // Obtener datos del usuario si existen
          const userData = await sql`
            SELECT username, email, is_premium 
            FROM users 
            WHERE email = ${email}
            LIMIT 1
          `
          
          if (userData.length > 0) {
            const user = userData[0]
            personalizedHtml = personalizedHtml
              .replace(/{{nombre}}/g, user.username || "Usuario")
              .replace(/{{email}}/g, user.email)
              .replace(/{{plan}}/g, user.is_premium ? "Premium" : "Gratuito")
          } else {
            // Si no es usuario registrado, usar email como nombre
            personalizedHtml = personalizedHtml
              .replace(/{{nombre}}/g, email.split("@")[0])
              .replace(/{{email}}/g, email)
              .replace(/{{plan}}/g, "Visitante")
          }

          // Variables globales
          personalizedHtml = personalizedHtml
            .replace(/{{app_url}}/g, process.env.NEXT_PUBLIC_APP_URL || "https://foranlot.com")
            .replace(/{{año}}/g, new Date().getFullYear().toString())

          const result = await sendEmail({
            to: email,
            subject: subject,
            html: personalizedHtml
          })

          if (result.success) {
            results.sent++
          } else {
            results.failed++
            results.errors.push(`${email}: ${result.error}`)
          }
        } catch (error) {
          results.failed++
          results.errors.push(`${email}: ${error}`)
        }
      })

      await Promise.all(promises)

      // Pequeña pausa entre lotes para respetar rate limits
      if (i + BATCH_SIZE < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log(`[v0] Campaña de marketing enviada: ${results.sent} éxitos, ${results.failed} fallos`)

    return NextResponse.json({
      success: true,
      sent: results.sent,
      failed: results.failed,
      totalRecipients: recipients.length,
      errors: results.errors.slice(0, 10), // Solo primeros 10 errores
      isTest: isTest || false
    })

  } catch (error) {
    console.error("[v0] Error en marketing email API:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
