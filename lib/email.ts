"use server-only"

/**
 * Sistema de envío de emails para ForanLot
 * Utiliza Resend para enviar emails transaccionales
 */

interface EmailAttachment {
  filename: string
  content: string // base64 encoded
}

interface EmailOptions {
  to: string
  subject: string
  html: string
  replyTo?: string
  attachments?: EmailAttachment[]
}

/**
 * Envía un email usando Resend
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    // Validar que Resend esté configurado
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.log("[v0] RESEND_API_KEY no configurado, email se ha skipeado")
      return { success: true } // No fallar si no está configurado
    }

    // Usar fetch para enviar con Resend
    const emailData: any = {
      from: process.env.RESEND_FROM_EMAIL || "noreply@forlot.com",
      to: options.to,
      subject: options.subject,
      html: options.html,
      reply_to: options.replyTo || process.env.REPLY_TO_EMAIL,
    }

    // Agregar adjuntos si existen
    if (options.attachments && options.attachments.length > 0) {
      emailData.attachments = options.attachments
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("[v0] Error enviando email con Resend:", error)
      return { success: false, error: error.message }
    }

    console.log(`[v0] Email enviado exitosamente a ${options.to}`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Error en sendEmail:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Notifica al administrador sobre nueva solicitud de pago
 */
export async function notifyAdminNewPayment(data: {
  username: string
  email: string
  planType: string
  amount: string
  receiptUrl?: string
  paymentDate: string
  receiptFile?: {
    filename: string
    content: string // base64
  }
}): Promise<{ success: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_EMAIL || "dffigueroam@gmail.com"

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Nueva Solicitud de Pago Recibida</h2>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Usuario:</strong> ${data.username}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Plan:</strong> ${data.planType === "monthly" ? "Mensual" : "Anual"}</p>
        <p><strong>Monto:</strong> ${data.amount}</p>
        <p><strong>Fecha de Pago:</strong> ${data.paymentDate}</p>
        ${data.receiptFile ? `<p><strong>Comprobante:</strong> Ver archivo adjunto (${data.receiptFile.filename})</p>` : ""}
      </div>

      <p style="margin-top: 30px; color: #666;">
        <strong>Acción requerida:</strong> 
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/payments" style="color: #2563eb; text-decoration: none;">
          Revisar en el panel de admin
        </a>
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">Este es un email automático de ForanLot. No responder a este email.</p>
    </div>
  `

  const attachments: EmailAttachment[] = []
  if (data.receiptFile) {
    attachments.push({
      filename: data.receiptFile.filename,
      content: data.receiptFile.content,
    })
  }

  return sendEmail({
    to: adminEmail,
    subject: `[ForanLot] Nuevo pago de ${data.username}`,
    html,
    attachments: attachments.length > 0 ? attachments : undefined,
  })
}

/**
 * Notifica al usuario que su pago fue aprobado
 */
export async function notifyUserPaymentApproved(data: {
  username: string
  email: string
  planType: string
  creditsAdded: number
}): Promise<{ success: boolean; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">✓ Tu Pago ha sido Aprobado</h2>
      
      <p>Hola <strong>${data.username}</strong>,</p>

      <p>Nos complace informarte que tu solicitud de pago ha sido aprobada y procesada exitosamente.</p>

      <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
        <p><strong>Créditos agregados:</strong> +${data.creditsAdded}</p>
        <p><strong>Plan:</strong> ${data.planType === "monthly" ? "Mensual (30 créditos)" : "Anual (365 créditos)"}</p>
      </div>

      <p>Ya puedes usar tus créditos para seguir números y usuarios en nuestras predicciones.</p>

      <p style="margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
           style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Ir a tu Dashboard
        </a>
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">ForanLot - Comunidad de Predicciones de Loterias</p>
    </div>
  `

  return sendEmail({
    to: data.email,
    subject: "✓ Tu pago ha sido aprobado - ForanLot",
    html,
  })
}

/**
 * Notifica al usuario que su pago fue rechazado
 */
export async function notifyUserPaymentRejected(data: {
  username: string
  email: string
  reason: string
}): Promise<{ success: boolean; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">⚠ Tu Pago fue Rechazado</h2>
      
      <p>Hola <strong>${data.username}</strong>,</p>

      <p>Lamentablemente, tu solicitud de pago no pudo ser procesada por el siguiente motivo:</p>

      <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <p><strong>Razón:</strong> ${data.reason}</p>
      </div>

      <p>Por favor, verifica los detalles de tu transferencia y envía un nuevo comprobante.</p>

      <p style="margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" 
           style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Enviar nuevo comprobante
        </a>
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">Si tienes preguntas, contacta al soporte.</p>
    </div>
  `

  return sendEmail({
    to: data.email,
    subject: "⚠ Tu pago fue rechazado - ForanLot",
    html,
  })
}
