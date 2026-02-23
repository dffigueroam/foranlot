
"use server"
import { initializeUserCredits, createSelection } from "@/lib/credits"
import { getRanking } from "@/lib/ranking"
import { sendEmail } from "@/lib/email"
// Acción completa tras registro: premium, selección y notificación
// Ahora acepta el userId del pronosticador seleccionado
export async function completeLiteOnboarding(user: any, selectedUserId: number) {
  try {
    // 1. Asignar créditos premium por 30 días
    await initializeUserCredits(user.id, 30)

    // 2. Obtener datos del pronosticador seleccionado
    const ranking = await getRanking(5)
    const selected = ranking.find((u: any) => u.user_id === selectedUserId)
    if (!selected) {
      return { error: "Pronosticador seleccionado no válido." }
    }

    // 3. Crear selección para seguir al usuario elegido
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(startDate.getDate() + 30)
    await createSelection(
      user.id,
      "user",
      "3_digits", // o el tipo de lotería principal, ajustar si es necesario
      undefined,
      selectedUserId,
      startDate,
      endDate
    )

    // 4. Notificar por email (Resend)
    await sendEmail({
      to: user.email,
      subject: "¡Bienvenido a LotIQLite!",
      html: `<div style='font-family:sans-serif'>
        <h2>¡Bienvenido a LotIQLite!</h2>
        <p>Tu cuenta ha sido activada con acceso premium por 30 días.</p>
        <p>Recibirás pronósticos diarios en este correo, sin necesidad de ingresar a la plataforma.</p>
        <p>Actualmente estás vinculado al pronosticador: <b>${selected.username}</b>.</p>
        <p>Disfruta de la experiencia simplificada.</p>
        <hr />
        <small>Si tienes dudas, responde a este correo.</small>
      </div>`
    })

    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Error en onboarding" }
  }
}

import { registerUserEmailLite } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function registerLiteUserAction(formData: FormData) {
  const username = formData.get("nombre")?.toString().trim()
  const email = formData.get("email")?.toString().trim().toLowerCase()
  const password = formData.get("password")?.toString()

  if (!username || !email || !password) {
    return { error: "Nombre, correo y contraseña son obligatorios." }
  }

  // Registrar usuario con rol especial "user_email" (con contraseña)
  const result = await registerUserEmailLite({
    username,
    email,
    password
  })

  if (result?.error) {
    return { error: result.error }
  }

  revalidatePath("/lotiqlite")
  return { success: true, user: result.user }
}
