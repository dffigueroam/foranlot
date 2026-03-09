// Devuelve todas las loterías activas desde la base de datos
export async function getLotteriesFromDB() {
  try {
    const rows = await sql`SELECT * FROM lotteries WHERE is_active = true ORDER BY name` as Lottery[]
    return rows
  } catch (e) {
    console.log("[v0] Error al consultar loterías:", e)
    return []
  }
}
// Server-only lottery functions
import "server-only"
import { neon } from "@neondatabase/serverless"
const sql = neon(process.env.DATABASE_URL!)
import { canPublishPrediction } from "./timezones-server"

export interface Lottery {
  id: number
  name: string
  country: string
  dias: string
  digits: number[]
  time: number
  is_active: boolean
}

// Consulta loterías disponibles para postear en una fecha y país, filtrando por día y hora
export async function getAvailableLotteriesForPosting(date: Date | string, country: string, now?: Date) {
  const drawDate = typeof date === "string" ? new Date(date + "T00:00:00") : date
  const drawDateStr = drawDate.toISOString().split("T")[0]
  const dayNames = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]
  const dayName = dayNames[drawDate.getDay()]
  const nowDate = now || new Date()
  const currentHour = nowDate.getHours()
  console.log(`[v0] getAvailableLotteriesForPosting: country=${country}, date=${drawDateStr}, day=${dayName}, currentHour=${currentHour}`)

  let rows: Lottery[] = []
  try {
    rows = await sql`SELECT * FROM lotteries WHERE is_active = true AND country = ${country} ORDER BY name` as Lottery[]
  } catch (e) {
    console.log("[v0] Error al consultar loterías:", e)
    return []
  }

  // Filtrar por día de la semana
  const filteredByDay = rows.filter(lottery => {
    if (!lottery.dias) return false
    const dias = lottery.dias.split(",").map((d: string) => d.trim().toLowerCase())
    const match = dias.includes(dayName) || dias.includes("todos_dias")
    if (!match) {
      console.log(`[v0] Filtrado por día: ${lottery.name} (${lottery.dias}) no coincide con ${dayName}`)
    }
    return match
  })

  // Filtrar por deadline de hora local (hora_actual < hora_sorteo-1)
  const available = filteredByDay.filter(lottery => {
    const drawTimeStr = `${lottery.time.toString().padStart(2, "0")}:00`
    const result = canPublishPrediction(drawDateStr, drawTimeStr, country)
    if (!result.allowed) {
      console.log(`[v0] Filtrado por hora: ${lottery.name} (hora_sorteo=${lottery.time}, currentHour=${currentHour}) no disponible: ${result.message || ''}`)
    }
    return result.allowed
  })

  return available
}
