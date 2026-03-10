import { type NextRequest, NextResponse } from "next/server"

// Pagos vía Stripe eliminados
export const dynamic = "force-dynamic"

export async function POST(_req: NextRequest) {
  return NextResponse.json({ received: false, message: "Pagos en línea no disponibles" }, { status: 410 })
}
