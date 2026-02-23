import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get("country")
  const digitCount = req.nextUrl.searchParams.get("digitCount")
  try {
    let query;
    if (country && digitCount) {
      query = sql`SELECT id, name, country, digits FROM lotteries WHERE is_active = true AND country = ${country} AND ${Number(digitCount)} = ANY(digits) ORDER BY name`;
    } else if (country) {
      query = sql`SELECT id, name, country, digits FROM lotteries WHERE is_active = true AND country = ${country} ORDER BY name`;
    } else {
      query = sql`SELECT id, name, country, digits FROM lotteries WHERE is_active = true ORDER BY name`;
    }
    const result = await query;
    return NextResponse.json({ success: true, lotteries: result })
  } catch (e) {
    console.log("[lotteries-list] error:", e)
    return NextResponse.json({ error: "Error al obtener loterías", details: e?.message || e?.toString() }, { status: 500 })
  }
}
