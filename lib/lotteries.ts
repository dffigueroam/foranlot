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

  // 5. Filtro principal
  return LOTTERIES.map(lottery => {
    // a) Solo loterías del país indicado
    if (lottery.country !== country) return null

    // b) Solo si el campo 'dias' coincide exactamente con el día o es 'todos_dias'
    if (!(lottery.dias === "todos_dias" || lottery.dias === dayName)) return null

    // c) Determinar la hora de sorteo para el tipo de día real
    let hour = undefined
    let dayType: string | undefined = undefined;

    if (lottery.dayTypeHours) {
      hour = lottery.dayTypeHours[realDayType as keyof DayTypeHours];
      dayType = realDayType;
      // Log de depuración
      console.log(`[v0] Lotería: ${lottery.name}, Día: ${realDayType}, Hora encontrada: ${hour}`);
      // Si no hay hora para el tipo de día real, la lotería NO se muestra (no usar fallback laboral)
      if (typeof hour !== "number") return null;
    } else {
      console.log(`[v0] Lotería: ${lottery.name}, Día: ${realDayType}, Sin dayTypeHours`);
      return null;
    }

    // d) Deadline: solo si la hora actual es menor a (hora_sorteo - 1)
    if (currentHour >= hour - 1) {
      console.log(`[v0] Lotería: ${lottery.name}, Hora actual: ${currentHour}, Hora sorteo: ${hour}, NO disponible`);
      return null;
    }

    // e) Si pasa todos los filtros, la lotería está disponible para postear
    console.log(`[v0] Lotería: ${lottery.name}, Disponible para postear, Hora: ${hour}, Día: ${dayType}`);
    return {
      ...lottery,
      availableHour: hour,
      dayType
    };
  }).filter(Boolean);
}
/**
 * Devuelve las loterías disponibles para un día específico (ej: "lunes") y país.
 * Incluye las que tienen dias="todos_dias" y las que coinciden con el día exacto.
 * @param dayName - Nombre del día en minúsculas (ej: "lunes")
 * @param country - País (ej: "Colombia")
 * @returns Loterías disponibles ese día
 */
export function getLotteriesForDay(dayName: string, country: string) {
  return LOTTERIES.filter(lottery =>
    lottery.country === country &&
    (lottery.dias === "todos_dias" || lottery.dias === dayName)
  )
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

export const LOTTERIES = [
  // Colombia - 4 y 5ta cifras
  { name: "Cundinamarca", country: "Colombia", dias: "lunes", digits: [3, 4, 5], dayTypeHours: { laboral: 23 } },
  { name: "Huila", country: "Colombia", dias: "martes", digits: [3, 4, 5], dayTypeHours: { laboral: 23 } },
  { name: "Valle", country: "Colombia", dias: "miercoles", digits: [4, 5], dayTypeHours: { laboral: 23 } },
  { name: "Meta", country: "Colombia", dias: "jueves", digits: [3, 4, 5], dayTypeHours: { laboral: 23 } },
  { name: "Manizales", country: "Colombia", dias: "miercoles", digits: [3, 4, 5], dayTypeHours: { laboral: 23 } },
  { name: "Bogota", country: "Colombia", dias: "jueves", digits: [3, 4, 5], dayTypeHours: { laboral: 22 } },
  { name: "Risaralda", country: "Colombia", dias: "viernes", digits: [3, 4, 5], dayTypeHours: { laboral: 23 } },
  { name: "Medellin", country: "Colombia", dias: "viernes", digits: [3, 4, 5], dayTypeHours: { laboral: 23 } },
  { name: "Cauca", country: "Colombia", dias: "sabado", digits: [3, 4, 5], dayTypeHours: { sabado: 22 } },
  { name: "Tolima", country: "Colombia", dias: "lunes", digits: [3, 4, 5], dayTypeHours: { laboral: 23 } },
  { name: "Dorado Tarde", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5], dayTypeHours: { laboral: 15, sabado: 15 } },
  { name: "Dorado Mañana", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5], dayTypeHours: { laboral: 11, sabado: 11 } },
  { name: "Cafeterito Tarde", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5], dayTypeHours: { laboral: 12, sabado: 12 } },
  { name: "Chontico Dia", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5], dayTypeHours: { laboral: 13, sabado: 13, domingo: 13, festivo: 13 } },
  { name: "Cafeterito Noche", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5], dayTypeHours: { laboral: 22, sabado: 23, domingo: 21, festivo: 21 } },
  { name: "Paisita Noche", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5], dayTypeHours: { laboral: 18, sabado: 18, domingo: 20, festivo: 20 } },
  { name: "Paisita Dia", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5], dayTypeHours: { laboral: 13, sabado: 13, domingo: 14, festivo: 14 } },
  { name: "Cruz Roja", country: "Colombia", dias: "martes", digits: [3, 4, 5], dayTypeHours: { laboral: 23 } },
  { name: "Quindio", country: "Colombia", dias: "jueves", digits: [3, 4, 5], dayTypeHours: { laboral: 23 } },
  { name: "Santander", country: "Colombia", dias: "jueves", digits: [3, 4, 5], dayTypeHours: { laboral: 23 } },
  { name: "Boyaca", country: "Colombia", dias: "sabado", digits: [3, 4, 5], dayTypeHours: { sabado: 23 } },
  { name: "Sinuano Dia", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5], dayTypeHours: { laboral: 15, sabado: 15, domingo: 13, festivo: 13 } },
  { name: "Saman Dia", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5], dayTypeHours: { laboral: 13, sabado: 13, domingo: 19, festivo: 19 } },
  { name: "Caribeña Dia", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5], dayTypeHours: { laboral: 14, sabado: 14, domingo: 14, festivo: 14 } },
  { name: "Dorado Noche", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5], dayTypeHours: { laboral: 23, sabado: 23, domingo: 23, festivo: 23 } },
  { name: "Sinuano Noche", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5], dayTypeHours: { laboral: 23, sabado: 23, domingo: 23, festivo: 23 } },
  { name: "Culona", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5], dayTypeHours: { laboral: 15, sabado: 15, domingo: 15, festivo: 15 } },
  { name: "Pijao de Oro", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5], dayTypeHours: { laboral: 15, sabado: 21, domingo: 22, festivo: 20 } },
  { name: "Motilon Tarde", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5], dayTypeHours: { laboral: 15, sabado: 15, domingo: 15, festivo: 15 } },
  { name: "Motilon Noche", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5], dayTypeHours: { laboral: 21, sabado: 21, domingo: 21, festivo: 21 } },
  { name: "Fantastica Noche", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5], dayTypeHours: { laboral: 20, sabado: 20, domingo: 20, festivo: 20 } },
  { name: "Fantastica Dia", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5], dayTypeHours: { laboral: 13, sabado: 13 } },
  { name: "Chontico Noche", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5], dayTypeHours: { laboral: 19, sabado: 19, domingo: 20, festivo: 20 } },
  { name: "Caribeña Noche", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5], dayTypeHours: { laboral: 23, sabado: 23, domingo: 20, festivo: 20 } },
  { name: "Antioqueñita Tarde", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5], dayTypeHours: { laboral: 16, sabado: 16, domingo: 16, festivo: 16 } },
  { name: "Antioqueñita Dia", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5], dayTypeHours: { laboral: 10, sabado: 10, domingo: 12, festivo: 12 } },
  { name: "Paisita 3", country: "Colombia", dias: "sabado", digits: [3, 4, 5], dayTypeHours: { sabado: 22 } },
  { name: "Culona Noche", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5], dayTypeHours: { laboral: 21, sabado: 21, domingo: 20, festivo: 20 } },
  { name: "Play Four Noche", country: "Colombia", dias: "todos_dias", digits: [3, 4], dayTypeHours: { laboral: 20, sabado: 20, domingo: 20, festivo: 20 } },
  { name: "Play Four Dia", country: "Colombia", dias: "todos_dias", digits: [3, 4], dayTypeHours: { laboral: 11, sabado: 11, domingo: 11, festivo: 11 } },
  { name: "Cash Three Dia", country: "Colombia", dias: "todos_dias", digits: [3], dayTypeHours: { laboral: 11, sabado: 11, domingo: 11, festivo: 11 } },
  { name: "Cash Three Noche", country: "Colombia", dias: "todos_dias", digits: [3], dayTypeHours: { laboral: 20, sabado: 20, domingo: 20, festivo: 20 } },

  // Colombia - 4 y Signo
  { name: "Astro Luna", country: "Colombia", dias: "todos_dias", digits: [3, 4], dayTypeHours: { laboral: 23, sabado: 23, domingo: 20, festivo: 20 } },
  { name: "Astro Sol", country: "Colombia", dias: "todos_dias", digits: [3, 4], dayTypeHours: { laboral: 15, sabado: 15 } },

  // España - 3 cifras
  { name: "TriplexOnce1", country: "España", dias: "todos_dias", digits: [3], dayTypeHours: { laboral: 9, sabado: 9, domingo: 9, festivo: 9 } },
  { name: "TriplexOnce2", country: "España", dias: "todos_dias", digits: [3], dayTypeHours: { laboral: 12, sabado: 12, domingo: 12, festivo: 12 } },
  { name: "TriplexOnce3", country: "España", dias: "todos_dias", digits: [3], dayTypeHours: { laboral: 15, sabado: 15, domingo: 15, festivo: 15 } },
  { name: "TriplexOnce4", country: "España", dias: "todos_dias", digits: [3], dayTypeHours: { laboral: 18, sabado: 18, domingo: 18, festivo: 18 } },
  { name: "TriplexOnce5", country: "España", dias: "todos_dias", digits: [3], dayTypeHours: { laboral: 21, sabado: 21, domingo: 21, festivo: 21 } },

  // USA y Colombia
  { name: "Play Four Noche USA", country: "USA", dias: "todos_dias", digits: [3, 4], dayTypeHours: { laboral: 20, sabado: 20, domingo: 20, festivo: 20 } },
  { name: "Play Four Dia USA", country: "USA", dias: "todos_dias", digits: [3, 4], dayTypeHours: { laboral: 11, sabado: 11, domingo: 11, festivo: 11 } },
  { name: "Cash Three Dia USA", country: "USA", dias: "todos_dias", digits: [3], dayTypeHours: { laboral: 11, sabado: 11, domingo: 11, festivo: 11 } },
  { name: "Cash Three Noche USA", country: "USA", dias: "todos_dias", digits: [3], dayTypeHours: { laboral: 20, sabado: 20, domingo: 20, festivo: 20 } },

  // USA
  { name: "Number 3", country: "USA", dias: "todos_dias", digits: [3], dayTypeHours: { laboral: 15, sabado: 15, domingo: 15, festivo: 15 } },
  { name: "Number 4", country: "USA", dias: "todos_dias", digits: [3, 4], dayTypeHours: { laboral: 20, sabado: 20, domingo: 20, festivo: 20 } },
]

export type Lottery = typeof LOTTERIES[number]
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