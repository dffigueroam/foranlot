import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getPendingLinkRequests, respondToLinkRequest } from "@/lib/linked-accounts"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// GET: /api/link-requests?freeUserId=123
export async function GET(request: Request) {
  const url = new URL(request.url)
  const freeUserId = Number(url.searchParams.get("freeUserId"))
  if (!freeUserId) return NextResponse.json({ error: "Usuario inválido" }, { status: 400 })
  // Verificar sesión
  const user = await getCurrentUser()
  if (!user || user.id !== freeUserId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  // Consultar solicitudes
  const requests = await getPendingLinkRequests(freeUserId)
  // Agregar email del premium
  for (const req of requests) {
    const rows = await sql`SELECT email FROM users WHERE id = ${req.premium_user_id}`
    req.premium_email = rows.length > 0 ? rows[0].email : undefined
  }
  return NextResponse.json({ requests })
}

// POST: /api/link-requests/respond
export async function POST(request: Request) {
  const body = await request.json()
  const { requestId, approve } = body
  if (!requestId || typeof approve !== "boolean") return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  // Verificar sesión
  const user = await getCurrentUser()
  // Buscar solicitud
  const rows = await sql`SELECT * FROM link_requests WHERE id = ${requestId}`
  if (rows.length === 0) return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
  const req = rows[0]
  if (!user || user.id !== req.free_user_id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  // Procesar respuesta
  const result = await respondToLinkRequest(requestId, approve)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ success: true })
}
