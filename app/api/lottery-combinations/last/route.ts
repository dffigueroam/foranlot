import { NextResponse } from "next/server"
import { getLastLotteryCombinations } from "../../../actions/lottery-combinations"

export async function POST(req: Request) {
  try {
    const { limit, userId } = await req.json()
    const result = await getLastLotteryCombinations(limit, userId)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Error al consultar combinaciones" }, { status: 500 })
  }
}
