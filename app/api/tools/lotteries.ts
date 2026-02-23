import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const rows = await sql`SELECT name, country, digits FROM lotteries ORDER BY country, name`
    // digits puede venir como array o string
    const lotteries = rows.map((row: any) => ({
      name: row.name,
      country: row.country,
      digits: Array.isArray(row.digits) ? row.digits : typeof row.digits === "string" ? row.digits.split(",").map((d: string) => Number(d.trim())) : [],
    }))
    return NextResponse.json({ success: true, lotteries })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error al consultar loterías" }, { status: 500 })
  }
}
