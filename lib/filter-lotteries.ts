/**
 * Sistema de filtrado de loterias por fecha, tipo de día y país
 * Asegura que solo se muestren loterias disponibles para el día específico
 * ✨ IMPORTANTE: Filtra por hora actual - no muestra loterias que ya jugaron
 */

import "server-only"
import { LOTTERIES } from "./lotteries"
import { getDayType, type DayType } from "./holidays-calendar"
import { getCurrentTimeInTimezone, getTimezoneByCountry } from "./timezones"

export type AvailableLottery = {
  name: string
  country: string
  digits: number[]
  availableHour: number
  dayType: DayType
  isPastDraw?: boolean  // true si la hora ya pasó HOY
}

/**
 * Obtiene las loterías disponibles para una fecha específica
 * ⏰ VALIDACIONES:
 * 1. Filtra por tipo de día (laboral/sábado/domingo/festivo)
 * 2. Filtra por país
 * 3. Solo retorna loterias que tengan hora configurada para ese tipo de día
 * 4. SI LA FECHA ES HOY: Excluye loterias cuya hora ya pasó
 * 5. SI LA FECHA ES FUTURA: Incluye todas las loterias
 * 6. SI LA FECHA ES PASADA: Retorna lista vacía
 * 
 * @param date - Fecha del sorteo (YYYY-MM-DD)
 * @param country - País (ej: "Colombia", "España", "USA")
 * @returns Array de loterías disponibles con su hora de juego
 */
export function getAvailableLotteriesForDate(
  date: string,
  country: string
): AvailableLottery[] {
  // Parsear la fecha
  const dateObj = new Date(date + "T00:00:00")
  if (isNaN(dateObj.getTime())) {
    return []
  }

  // Obtener fecha y hora actual en la zona horaria del país
  const timezone = getTimezoneByCountry(country)
  const currentTime = getCurrentTimeInTimezone(timezone)
  const currentDate = currentTime.toISOString().split("T")[0]  // YYYY-MM-DD
  const currentHour = currentTime.getHours()

  // VALIDAR FECHA
  // Si la fecha es anterior a hoy, retornar vacío
  if (date < currentDate) {
    return []
  }

  // Determinar el tipo de día (laboral, sábado, domingo, festivo)
  let dayType = getDayType(dateObj, country) as DayType
  
  // Normalizar "todos_dias" a "laboral" para búsqueda en dayTypeHours
  if (dayType === "todos_dias") {
    dayType = "laboral"
  }

  // Filtrar loterias del país
  const result: AvailableLottery[] = []
  const isToday = date === currentDate
  
  for (const lottery of LOTTERIES) {
    if (lottery.country !== country) continue
    if (!lottery.dayTypeHours) continue

    // Obtener la hora para este tipo de día
    const hour = lottery.dayTypeHours[dayType as "laboral" | "sabado" | "domingo" | "festivo"]
    if (hour === undefined) continue

    // SI ES HOY: Validar que falten al menos 1 hora antes del sorteo
    // Deadline para publicar = 1 hora antes
    // Ej: Si juega a las 12:00, deadline es 11:00
    if (isToday) {
      const deadlineHour = hour - 1  // Restar 1 hora para el deadline
      // Si ya pasó el deadline (currentHour >= deadlineHour), NO incluir
      if (currentHour >= deadlineHour) {
        continue  // Skip this lottery, deadline has passed or is now
      }
    }
    // Si es FUTURO: Incluir todas las loterias

    result.push({
      name: lottery.name,
      country: lottery.country,
      digits: lottery.digits,
      availableHour: hour,
      dayType: dayType as DayType,
      isPastDraw: false
    })
  }

  return result.sort((a, b) => a.name.localeCompare(b.name, "es"))
}

/**
 * Obtiene todas las loterías disponibles (sin filtrar por fecha)
 * 
 * @param country - País (ej: "Colombia")
 * @param digitCount - Número de dígitos (3, 4, 5) - opcional
 * @returns Array de loterías del país con esos dígitos
 */
export function getAvailableLotteriesByCountry(
  country: string,
  digitCount?: number
) {
  return LOTTERIES.filter(lottery => {
    if (lottery.country !== country) return false
    if (digitCount && !lottery.digits.includes(digitCount)) return false
    return true
  }).sort((a, b) => a.name.localeCompare(b.name, "es"))
}
