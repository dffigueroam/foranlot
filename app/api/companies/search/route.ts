import { NextResponse } from "next/server"
import { searchCompanies } from "@/lib/company-search"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q") || ""

    const companies = await searchCompanies(q, 10)
    return NextResponse.json({ success: true, companies })
  } catch (error: any) {
    console.error("[v0] Company search error:", error)
    return NextResponse.json(
      { success: false, error: "No se pudo buscar empresas" },
      { status: 500 },
    )
  }
}
