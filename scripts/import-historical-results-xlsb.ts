import { neon } from "@neondatabase/serverless"
import path from "path"
import fs from "fs"
import * as XLSX from "xlsx"

const sql = neon(process.env.DATABASE_URL!)

type Row = Record<string, unknown>

function normalizeHeader(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function pick(row: Row, keys: string[]) {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim()
    }
  }
  return ""
}

function toISODate(input: string) {
  const trimmed = input.trim()
  if (!trimmed) return ""

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

  const parts = trimmed.split(/[\/-]/)
  if (parts.length === 3) {
    const [a, b, c] = parts
    if (a.length === 4) return `${a}-${b.padStart(2, "0")}-${c.padStart(2, "0")}`
    return `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`
  }

  const date = new Date(trimmed)
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().split("T")[0]
  }

  return ""
}

async function run() {
  const args = process.argv.slice(2)
  const filePath = args[0] || path.resolve(process.cwd(), "DataLearn", "HistoricosResultados.xlsb")
  const sourceTag = args[1] || "historical_xlsb"

  if (!fs.existsSync(filePath)) {
    throw new Error(`No se encontró archivo: ${filePath}`)
  }

  console.log(`[v0] Importando desde: ${filePath}`)
  console.log(`[v0] Source tag: ${sourceTag}`)

  const workbook = XLSX.readFile(filePath, { cellDates: true })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error("El archivo XLSB no contiene hojas")

  const sheet = workbook.Sheets[sheetName]
  const rawRows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" })

  let inserted = 0
  let skipped = 0

  for (const originalRow of rawRows) {
    const row: Row = {}
    Object.keys(originalRow).forEach((key) => {
      row[normalizeHeader(key)] = originalRow[key]
    })

    const lotteryName = pick(row, ["loteria", "lottery_name", "nombre_loteria", "nombre"])
    const drawDateRaw = pick(row, ["fecha", "draw_date", "fecha_sorteo"])
    const drawDate = toISODate(drawDateRaw)
    const winningNumber = pick(row, ["winning_number", "numero_ganador", "numero", "resultado"])
    const digits4 = pick(row, ["digits_4", "4_cifras", "cifras_4", "ultimas_4"]) || winningNumber.slice(-4)
    const digits3 = pick(row, ["digits_3", "3_cifras", "cifras_3", "ultimas_3"]) || winningNumber.slice(-3)
    const digits2 = pick(row, ["digits_2", "2_cifras", "cifras_2", "ultimas_2"]) || winningNumber.slice(-2)

    if (!lotteryName || !drawDate || !winningNumber) {
      skipped++
      continue
    }

    try {
      await sql`
        INSERT INTO lottery_results (
          lottery_name,
          winning_number,
          digits_4,
          digits_3,
          digits_2,
          draw_date,
          source,
          verified_at
        )
        VALUES (
          ${lotteryName},
          ${winningNumber},
          ${digits4 || null},
          ${digits3 || null},
          ${digits2 || null},
          ${drawDate},
          ${sourceTag},
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (lottery_name, draw_date)
        DO UPDATE SET
          winning_number = EXCLUDED.winning_number,
          digits_4 = EXCLUDED.digits_4,
          digits_3 = EXCLUDED.digits_3,
          digits_2 = EXCLUDED.digits_2,
          source = EXCLUDED.source,
          verified_at = CURRENT_TIMESTAMP
      `
      inserted++
    } catch (error) {
      console.error(`[v0] Error insertando [${lotteryName}, ${drawDate}]:`, error)
      skipped++
    }
  }

  console.log(`[v0] ✅ Importación finalizada`)
  console.log(`[v0] Insertados/actualizados: ${inserted}`)
  console.log(`[v0] Omitidos: ${skipped}`)
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[v0] Error:", error)
    process.exit(1)
  })
