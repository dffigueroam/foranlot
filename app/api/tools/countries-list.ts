import { NextResponse } from "next/server"
import { getAvailableCountries } from "@/lib/lotteries"

export async function GET() {
  try {
    const countries = await getAvailableCountries()
    return NextResponse.json({ success: true, countries })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error al consultar países" }, { status: 500 })
  }
}
