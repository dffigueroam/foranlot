import "server-only"

/**
 * Zonas horarias para regiones de loterías
 * Utilizado para validar el límite de tiempo para publicar predicciones
 */

export const TIMEZONES = {
  COLOMBIA: "America/Bogota",           // UTC-5 (COT)
  ESPAÑA: "Europe/Madrid",              // UTC+1 (CET) / UTC+2 (CEST en verano)
  USA_NY: "America/New_York",           // UTC-5 (EST) / UTC-4 (EDT en verano)
  USA_FLORIDA: "America/New_York",      // UTC-5 (EST) / UTC-4 (EDT en verano)
} as const

export const TIMEZONE_OFFSETS = {
  COLOMBIA: -5,
  ESPAÑA: 1,          // +1 en invierno, +2 en verano
  USA_NY: -5,         // -5 en invierno, -4 en verano
  USA_FLORIDA: -5,    // -5 en invierno, -4 en verano
} as const

export type TimezoneKey = keyof typeof TIMEZONES

/**
 * Obtiene la zona horaria según el país
 */
export function getTimezoneByCountry(country: string): string {
  const countryUpper = country.toUpperCase()
  
  if (countryUpper.includes("COLOMBIA")) {
    return TIMEZONES.COLOMBIA
  }
  if (countryUpper.includes("ESPAÑA") || countryUpper.includes("SPAIN")) {
    return TIMEZONES.ESPAÑA
  }
  if (countryUpper.includes("USA") || countryUpper.includes("ESTADOS UNIDOS")) {
    if (countryUpper.includes("FLORIDA")) {
      return TIMEZONES.USA_FLORIDA
    }
    if (countryUpper.includes("NY") || countryUpper.includes("NEW YORK") || countryUpper.includes("NUEVA YORK")) {
      return TIMEZONES.USA_NY
    }
    // Por defecto USA = NY timezone
    return TIMEZONES.USA_NY
  }
  
  // Por defecto Colombia
  return TIMEZONES.COLOMBIA
}

/**
 * Obtiene la hora actual en una zona horaria específica
 */
export function getCurrentTimeInTimezone(timezone: string): Date {
  const now = new Date()
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000)
  
  // Usar Intl para obtener la hora en la zona horaria específica
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
  
  const parts = formatter.formatToParts(now)
  const dateParts: Record<string, string> = {}
  parts.forEach(({ type, value }) => {
    dateParts[type] = value
  })
  
  return new Date(
    parseInt(dateParts.year),
    parseInt(dateParts.month) - 1,
    parseInt(dateParts.day),
    parseInt(dateParts.hour),
    parseInt(dateParts.minute),
    parseInt(dateParts.second)
  )
}

/**
 * Verifica si aún se puede publicar una predicción
 * Regla: La predicción se puede publicar hasta 1 hora antes del sorteo
 * 
 * @param drawDate Fecha del sorteo (formato: YYYY-MM-DD)
 * @param drawTime Hora del sorteo (formato: HH:MM o texto como "10:00 PM")
 * @param country País de la lotería
 * @returns { allowed: boolean, message?: string, remainingMinutes?: number }
 */
export function canPublishPrediction(
  drawDate: string,
  drawTime: string | null,
  country: string
): { allowed: boolean; message?: string; remainingMinutes?: number } {
  try {
    // Si no hay hora de sorteo, permitir publicación
    if (!drawTime || drawTime === "null" || drawTime === "Sin horario") {
      return { allowed: true }
    }

    // Obtener zona horaria del país
    const timezone = getTimezoneByCountry(country)
    
    // Parsear hora (puede venir como "21:00" o "9:00 PM")
    let hours = 0
    let minutes = 0
    
    if (drawTime.includes("PM") || drawTime.includes("AM")) {
      const [time, period] = drawTime.split(" ")
      const [h, m] = time.split(":").map(Number)
      hours = period === "PM" && h !== 12 ? h + 12 : h
      if (period === "AM" && h === 12) hours = 0
      minutes = m || 0
    } else {
      const [h, m] = drawTime.split(":").map(Number)
      hours = h
      minutes = m || 0
    }
    
    // Crear string de fecha/hora en formato ISO para la zona horaria específica
    const dateStr = `${drawDate}T${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`
    
    // Obtener hora actual en esa zona horaria
    const currentTime = getCurrentTimeInTimezone(timezone)
    
    // Parsear la fecha del sorteo usando el mismo método que currentTime
    // Esto asegura que ambas fechas estén en la misma zona horaria
    const [year, month, day] = drawDate.split("-").map(Number)
    const drawDateTime = new Date(year, month - 1, day, hours, minutes, 0)
    
    // Calcular diferencia en minutos
    const diffMs = drawDateTime.getTime() - currentTime.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    
    // Debe haber al menos 60 minutos de diferencia
    if (diffMinutes < 60) {
      return {
        allowed: false,
        message: `El sorteo es muy pronto. Debes publicar con al menos 1 hora de anticipación. Tiempo restante: ${diffMinutes} minutos`,
        remainingMinutes: diffMinutes,
      }
    }
    
    // Si el sorteo ya pasó
    if (diffMinutes < 0) {
      return {
        allowed: false,
        message: "El sorteo ya pasó. No puedes publicar predicciones para sorteos pasados",
        remainingMinutes: diffMinutes,
      }
    }
    
    return {
      allowed: true,
      remainingMinutes: diffMinutes,
    }
  } catch (error) {
    console.error("[timezones] Error validating time:", error)
    // En caso de error, permitir publicación
    return { allowed: true }
  }
}

/**
 * Formatea una fecha en una zona horaria específica
 */
export function formatDateInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date)
}

/**
 * Obtiene información detallada de tiempo para debugging
 */
export function getTimezoneInfo(country: string) {
  const timezone = getTimezoneByCountry(country)
  const currentTime = getCurrentTimeInTimezone(timezone)
  
  return {
    country,
    timezone,
    currentTime: formatDateInTimezone(currentTime, timezone),
    utcTime: new Date().toISOString(),
  }
}
