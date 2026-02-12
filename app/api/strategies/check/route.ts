import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getUserStrategy } from "@/lib/strategies"

export async function POST(req: Request) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    // Verificar que sea premium
    if (!user.is_premium) {
      return NextResponse.json(
        { error: "Esta función es exclusiva para usuarios premium" },
        { status: 403 }
      )
    }

    const strategy = await getUserStrategy(user.id)

    return NextResponse.json({
      exists: strategy !== null
    })
  } catch (error) {
    console.error("[v0] Error en check strategy:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
