/**
 * Sistema de Calendario de Festivos por País
 * Define festivos nacionales, identificación de tipos de días
 * para ajustar horarios de sorteo de loterias
 */

export type DayType = "laboral" | "sabado" | "domingo" | "festivo" | "todos_dias"

export interface Holiday {
  date: string // YYYY-MM-DD
  name: string
  country: string
  type: "festivo" | "festivo_puente"
}

/**
 * Festivos de Colombia - Año 2025 y 2026
 * Fuente: Calendario Oficial de Colombia
 * 
 * Incluye:
 * - Festivos nacionales (1 de enero, navidad, etc.)
 * - Días de puente (si es aplicable)
 */
export const COLOMBIAN_HOLIDAYS: Holiday[] = [
  { date: "2026-01-01", name: "Año Nuevo", country: "Colombia", type: "festivo" },
  { date: "2026-01-12", name: "Día de los Reyes Magos", country: "Colombia", type: "festivo" },
  { date: "2026-03-22", name: "Día de San José", country: "Colombia", type: "festivo" },
  { date: "2026-04-02", name: "Jueves Santo", country: "Colombia", type: "festivo" },
  { date: "2026-04-03", name: "Viernes Santo", country: "Colombia", type: "festivo" },
  { date: "2026-04-30", name: "Día del Trabajo", country: "Colombia", type: "festivo" },
  { date: "2026-05-17", name: "Día de la Ascensión", country: "Colombia", type: "festivo" },
  { date: "2026-06-07", name: "Corpus Christi", country: "Colombia", type: "festivo" },
  { date: "2026-06-14", name: "Sagrado Corazón", country: "Colombia", type: "festivo" },
  { date: "2026-06-28", name: "San Pedro y San Pablo", country: "Colombia", type: "festivo" },
  { date: "2026-07-19", name: "Día de la Independencia", country: "Colombia", type: "festivo" },
  { date: "2026-08-07", name: "Batalla de Boyacá", country: "Colombia", type: "festivo" },
  { date: "2026-08-17", name: "La Asunción de la Virgen", country: "Colombia", type: "festivo" },
  { date: "2026-10-11", name: "Día de la Raza", country: "Colombia", type: "festivo" },
  { date: "2026-11-01", name: "Día de Todos los Santos", country: "Colombia", type: "festivo" },
  { date: "2026-11-15", name: "Independencia de Cartagena", country: "Colombia", type: "festivo" },
  { date: "2026-12-08", name: "Día de la Inmaculada Concepción", country: "Colombia", type: "festivo" },
  { date: "2026-12-25", name: "Navidad", country: "Colombia", type: "festivo" },
]



/**
 * Obtiene el tipo de día basado en la fecha
 * Retorna: "laboral", "sabado", "domingo", o "festivo"
 */
export function getDayType(date: Date, country: string = "Colombia"): DayType {
  const dayOfWeek = date.getDay() // 0=domingo, 1=lunes, ... 6=sabado
  const dateString = date.toISOString().split("T")[0] // YYYY-MM-DD
  
  // Verificar si es festivo
  const holidays = country === "Colombia" ? COLOMBIAN_HOLIDAYS : []
  const isHoliday = holidays.some(h => h.date === dateString)
  
  if (isHoliday) {
    return "festivo"
  }
  
  // Verificar día de la semana
  if (dayOfWeek === 6) {
    return "sabado"
  }
  if (dayOfWeek === 0) {
    return "domingo"
  }
  
  return "laboral"
}

/**
 * Obtiene el nombre del festivo si existe para la fecha
 */
export function getHolidayName(date: Date, country: string = "Colombia"): string | null {
  const dateString = date.toISOString().split("T")[0]
  const holidays = country === "Colombia" ? COLOMBIAN_HOLIDAYS : []
  const holiday = holidays.find(h => h.date === dateString)
  return holiday?.name || null
}

/**
 * Verifica si una fecha es festivo
 */
export function isHoliday(date: Date, country: string = "Colombia"): boolean {
  const dateString = date.toISOString().split("T")[0]
  const holidays = country === "Colombia" ? COLOMBIAN_HOLIDAYS : []
  return holidays.some(h => h.date === dateString)
}

/**
 * Verifica si una fecha es fin de semana
 */
export function isWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay()
  return dayOfWeek === 0 || dayOfWeek === 6 // domingo o sabado
}

/**
 * Obtiene todos los festivos próximos (próximos 30 días)
 */
export function getUpcomingHolidays(country: string = "Colombia", days: number = 30): Holiday[] {
  const today = new Date()
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
  
  const holidays = country === "Colombia" ? COLOMBIAN_HOLIDAYS : []
  
  return holidays.filter(h => {
    const hDate = new Date(h.date)
    return hDate >= today && hDate <= futureDate
  })
}

/**
 * Obtiene todos los festivos de un año específico
 */
export function getHolidaysByYear(year: number, country: string = "Colombia"): Holiday[] {
  const holidays = country === "Colombia" ? COLOMBIAN_HOLIDAYS : []
  return holidays.filter(h => h.date.startsWith(year.toString()))
}

/**
 * Resumen de tipos de días para un período
 */
export interface DaySummary {
  date: string
  dayType: DayType
  dayName: string // lunes, martes, etc.
  holidayName?: string
}

/**
 * Genera un resumen de tipos de días para un rango de fechas
 */
export function getDaySummary(startDate: Date, endDate: Date, country: string = "Colombia"): DaySummary[] {
  const days: DaySummary[] = []
  const current = new Date(startDate)
  
  const dayNames = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
  
  while (current <= endDate) {
    const dateString = current.toISOString().split("T")[0]
    const dayType = getDayType(current, country)
    const dayName = dayNames[current.getDay()]
    const holidayName = getHolidayName(current, country)
    
    days.push({
      date: dateString,
      dayType,
      dayName,
      ...(holidayName && { holidayName })
    })
    
    current.setDate(current.getDate() + 1)
  }
  
  return days
}
