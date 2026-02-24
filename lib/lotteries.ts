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
/**
 * Devuelve las loterías disponibles para postear predicciones en una fecha y país dados,
 * considerando el día de la semana, dias="todos_dias", y el deadline de hora local (hora_actual < hora_sorteo-1).
 * @param date - Fecha (Date o string YYYY-MM-DD)
 * @param country - País (ej: "Colombia")
 * @param now - (opcional) Fecha/hora actual (Date). Si no se pasa, usa la hora local del país.
 * @returns Loterías disponibles para postear
 */
/**
 * Devuelve las loterías disponibles para postear predicciones en una fecha y país dados,
 * considerando coincidencia exacta de día ("lunes", "martes", etc) o "todos_dias",
 * y el deadline de hora local (hora_actual < hora_sorteo-1).
 * @param date - Fecha (Date o string YYYY-MM-DD)
 * @param country - País (ej: "Colombia")
 * @param now - (opcional) Fecha/hora actual (Date). Si no se pasa, usa la hora local del país.
 * @returns Loterías disponibles para postear
 */
/**
 * Devuelve las loterías disponibles para postear predicciones en una fecha y país dados.
 * Filtro estricto:
 *   - Solo loterías del país indicado
 *   - Solo si el campo 'dias' coincide exactamente con el día de la semana de la fecha (ej: "lunes") o es "todos_dias"
 *   - Solo si la hora actual es menor a (hora_sorteo - 1) según dayTypeHours para ese día
 *   - Si no hay hora para ese día, intenta con 'laboral'. Si tampoco, la lotería no se muestra
 *
 * @param date - Fecha (Date o string YYYY-MM-DD)
 * @param country - País (ej: "Colombia")
 * @param now - (opcional) Fecha/hora actual (Date). Si no se pasa, usa la hora local del país.
 * @returns Loterías disponibles para postear
 */
import { neon } from "@neondatabase/serverless"
const sql = neon(process.env.DATABASE_URL!)

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
  const { canPublishPrediction } = await import("./timezones")
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
