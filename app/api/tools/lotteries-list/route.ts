import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get("country")
  const digitCount = req.nextUrl.searchParams.get("digitCount")
  try {
    let query;
    if (country && digitCount) {
      query = sql`SELECT id, name, country, digits FROM lotteries WHERE is_active = true AND country = ${country} AND ${Number(digitCount)} = ANY(digits) ORDER BY LOWER(name)`;
    } else if (country) {
      query = sql`SELECT id, name, country, digits FROM lotteries WHERE is_active = true AND country = ${country} ORDER BY LOWER(name)`;
    } else {
      query = sql`SELECT id, name, country, digits FROM lotteries WHERE is_active = true ORDER BY LOWER(name)`;
    }
    const result = await query;
    // Normalizar nombres a minúsculas para evitar problemas de selección
    const normalized = result.map((l: any) => ({ ...l, name: l.name.trim() }));
    return NextResponse.json({ success: true, lotteries: normalized })
  } catch (e) {
    console.log("[lotteries-list] error:", e)
    const errorMsg = typeof e === "object" && e && "message" in e ? (e as any).message : String(e);
    return NextResponse.json({ error: "Error al obtener loterías", details: errorMsg }, { status: 500 })
  }
}
