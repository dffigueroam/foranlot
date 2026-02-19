import { NextResponse } from "next/server"
import { createNotification } from "@/lib/notifications"
import { getUsersBySegment } from "@/lib/notifications"

export async function POST(req: Request) {
  const { segment, message } = await req.json()
  if (!segment || !message) {
    return NextResponse.json({ error: "Segmento y mensaje requeridos" }, { status: 400 })
  }

  // Obtener usuarios por segmento (máx 30)
  const users = await getUsersBySegment(segment, 30)
  if (!users.length) {
    return NextResponse.json({ error: "No hay usuarios para este segmento" }, { status: 404 })
  }

  let sent = 0
  for (const user of users) {
    const notif = await createNotification(
      user.id,
      "info",
      "Mensaje del Admin",
      message
    )
    if (notif) sent++
  }

  return NextResponse.json({ success: true, sent, total: users.length })
}
