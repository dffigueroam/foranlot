import "server-only"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

interface LastDrawBaseRow {
  draw_date: string
  lottery_name: string
  digits_2?: string | null
  digits_3?: string | null
  digits_4?: string | null
  winning_number?: string | null
}

/**
 * Obtiene los últimos 5 sorteos de una lotería por nombre, país y cifras.
 */
export async function getLastDraws(country: string, lotteryName: string, digitCount: number) {
  const countryNameMap: Record<string, string> = {
    COL: "Colombia",
    ESP: "España",
    USA: "Estados Unidos"
  }
  const normalizedCountry = countryNameMap[country] || country

  let draws: LastDrawBaseRow[] = []
  try {
    if (digitCount === 2) {
      draws = (await sql`
        SELECT lr.draw_date, lr.lottery_name, lr.digits_2
        FROM lottery_results lr
        INNER JOIN lotteries l ON lr.lottery_name = l.name
        WHERE lr.lottery_name = ${lotteryName}
          AND l.country = ${normalizedCountry}
          AND ${digitCount} = ANY(l.digits)
          AND lr.digits_2 IS NOT NULL
        ORDER BY lr.draw_date DESC
        LIMIT 5
      `) as LastDrawBaseRow[]
    } else if (digitCount === 3) {
      draws = (await sql`
        SELECT lr.draw_date, lr.lottery_name, lr.digits_3
        FROM lottery_results lr
        INNER JOIN lotteries l ON lr.lottery_name = l.name
        WHERE lr.lottery_name = ${lotteryName}
          AND l.country = ${normalizedCountry}
          AND ${digitCount} = ANY(l.digits)
          AND lr.digits_3 IS NOT NULL
        ORDER BY lr.draw_date DESC
        LIMIT 5
      `) as LastDrawBaseRow[]
    } else if (digitCount === 4) {
      draws = (await sql`
        SELECT lr.draw_date, lr.lottery_name, lr.digits_4
        FROM lottery_results lr
        INNER JOIN lotteries l ON lr.lottery_name = l.name
        WHERE lr.lottery_name = ${lotteryName}
          AND l.country = ${normalizedCountry}
          AND ${digitCount} = ANY(l.digits)
          AND lr.digits_4 IS NOT NULL
        ORDER BY lr.draw_date DESC
        LIMIT 5
      `) as LastDrawBaseRow[]
    } else if (digitCount === 5) {
      draws = (await sql`
        SELECT lr.draw_date, lr.lottery_name, lr.winning_number
        FROM lottery_results lr
        INNER JOIN lotteries l ON lr.lottery_name = l.name
        WHERE lr.lottery_name = ${lotteryName}
          AND l.country = ${normalizedCountry}
          AND ${digitCount} = ANY(l.digits)
          AND lr.winning_number IS NOT NULL
        ORDER BY lr.draw_date DESC
        LIMIT 5
      `) as LastDrawBaseRow[]
    } else {
      throw new Error("Cifra no soportada")
    }
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e)
    throw new Error("Error de base de datos: " + errMsg)
  }

  return draws.map((draw) => ({
    draw_date: draw.draw_date,
    lottery_name: draw.lottery_name,
    result:
      digitCount === 2
        ? (draw.digits_2 ?? "")
        : digitCount === 3
          ? (draw.digits_3 ?? "")
          : digitCount === 4
            ? (draw.digits_4 ?? "")
            : (draw.winning_number ?? "")
  }))
}
