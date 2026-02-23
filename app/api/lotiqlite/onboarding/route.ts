import { NextResponse } from "next/server"
import { completeLiteOnboarding } from "@/app/lotiqlite/actions"

export async function POST(req: Request) {
  try {
    const { userId, selectedUserId } = await req.json()
    if (!userId || !selectedUserId) {
      return NextResponse.json({ error: "Faltan datos obligatorios." }, { status: 400 })
    }
    const result = await completeLiteOnboarding({ id: userId }, selectedUserId)
    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error en onboarding" }, { status: 500 })
  }
}
