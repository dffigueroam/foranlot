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
export function getAvailableLotteriesForPosting(date: Date | string, country: string, now?: Date) {
  // 1. Normalizar fecha de sorteo y hora actual
  const drawDate = typeof date === "string" ? new Date(date + "T00:00:00") : date

  // 1. Determinar hora de comparación:
  // Si la fecha es hoy, usar la hora actual; si es futura, usar 0 (medianoche)
  const today = new Date()
  const isFuture = drawDate > today.setHours(0,0,0,0)
  const currentHour = isFuture ? 0 : (now ? now.getHours() : today.getHours())

  // 2. Determinar tipo de día real (laboral, sabado, domingo, festivo)
  // Importar aquí para evitar ciclos
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getDayType } = require("./holidays-calendar")
  const realDayType = getDayType(drawDate, country)

  // 3. Día de la semana (para el campo 'dias')
  const dayNames = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]
  const dayName = dayNames[drawDate.getDay()]

  // 5. Filtro principal: ahora consulta desde la base de datos
  // Esta función debe ser async
  throw new Error("getAvailableLotteriesForPosting debe ser reemplazada por una versión async que use getLotteriesFromDB")
}
/**
 * Devuelve las loterías disponibles para un día específico (ej: "lunes") y país.
 * Incluye las que tienen dias="todos_dias" y las que coinciden con el día exacto.
 * @param dayName - Nombre del día en minúsculas (ej: "lunes")
 * @param country - País (ej: "Colombia")
 * @returns Loterías disponibles ese día
 */
export function getLotteriesForDay(dayName: string, country: string) {
  throw new Error("getLotteriesForDay debe ser reemplazada por una versión async que use getLotteriesFromDB")
}
/**
 * Estructura de horarios por tipo de día
 * Permite especificar diferentes horas según el tipo de día
 * (laboral, sábado, domingo, festivo)
 */
export interface DayTypeHours {
  laboral?: number       // Día laboral (lunes a viernes, excepto festivos)
  sabado?: number        // Sábado
  domingo?: number       // Domingo
  festivo?: number       // Día festivo nacional
}

// Ahora las loterías se consultan desde la base de datos

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

/**
 * Consulta todas las loterías activas desde la base de datos
 */
export async function getLotteriesFromDB(): Promise<Lottery[]> {
  try {
    const rows = await sql`SELECT * FROM lotteries WHERE is_active = true ORDER BY country, name`
    return rows as Lottery[]
  } catch (e) {
    console.log("[v0] Error al consultar loterías:", e)
    return []
  }
}

// type Lottery based on interface above only
/**
 * Obtiene la hora de sorteo para una lotería basada en el tipo de día
 * @param lottery - Lotería
 * @param dayType - Tipo de día: "laboral", "sabado", "domingo", "festivo"
 * @returns Hora del sorteo (0-23) o el time por defecto si no está especificado
 */
export function getLotteryHour(lottery: Lottery, dayType: "laboral" | "sabado" | "domingo" | "festivo"): number {
  if (!lottery.dayTypeHours) {
    throw new Error(`Lottery "${lottery.name}" no tiene dayTypeHours configurado`)
  }

  // Retornar la hora específica del tipo de día, o la hora laboral por defecto
  const hour = lottery.dayTypeHours[dayType]
  if (hour !== undefined) {
    return hour
  }

  // Si no existe el tipo de día, intentar con laboral
  if (dayType !== "laboral" && lottery.dayTypeHours.laboral !== undefined) {
    return lottery.dayTypeHours.laboral
  }

  // Último recurso: si nada está configurado, lanzar error
  throw new Error(`Lottery "${lottery.name}" no tiene configuración de horario para tipo de día "${dayType}"`)
}

/**
 * Obtiene la hora de sorteo para una lotería en una fecha específica
 * @param lottery - Lotería
 * @param date - Fecha del sorteo
 * @param country - País (por defecto Colombia)
 * @returns Hora del sorteo (0-23)
 */
export async function getLotteryHourForDate(
  lottery: Lottery,
  date: Date,
  country: string = "Colombia"
): Promise<number> {
  // Importar dinámicamente para evitar circular dependencies
  const { getDayType } = await import("./holidays-calendar")
  
  const dayType = getDayType(date, country)
  return getLotteryHour(lottery, dayType as any)
}