import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams.entries())
    const digitCount = Number(params.digitCount)
    const country = params.country || 'Colombia'
    // Filtrar por país y cifra seleccionada
    const query = `SELECT name, country, digits FROM lotteries WHERE is_active = true AND country = $2 AND $1 = ANY(digits) ORDER BY name`;
    const rows = await sql.query(query, [digitCount, country])
    const lotteries = rows.map((row: any) => ({
      name: row.name,
      country: row.country,
      digits: Array.isArray(row.digits)
        ? row.digits
        : typeof row.digits === "string"
          ? row.digits.startsWith("{") && row.digits.endsWith("}")
            ? row.digits.slice(1, -1).split(",").map((d: string) => Number(d.trim()))
            : row.digits.split(",").map((d: string) => Number(d.trim()))
          : [],
    }))
    return NextResponse.json({ success: true, lotteries })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error al consultar loterías" }, { status: 500 })
  }
}
