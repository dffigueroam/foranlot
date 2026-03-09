import "server-only"
import { neon } from "@neondatabase/serverless"
const sql = neon(process.env.DATABASE_URL!)

/**
 * Obtiene la lista de países disponibles según la tabla lotteries.
 * @returns Array de nombres de países
 */
export interface Country {
  code: string;
  name: string;
}

export async function getAvailableCountries(): Promise<Country[]> {
  try {
    const rows = await sql`
      SELECT code, name FROM countries
      ORDER BY name ASC
    `;
    return rows as Country[];
  } catch (e) {
    console.error("[lotteries] Error al obtener países disponibles:", e);
    return [];
  }
}

/**
 * Obtiene la lista de loterías disponibles según país y cifras (digitos).
 * @param country País (ej: "Colombia")
 * @param digitCount Número de cifras (2, 3, 4, 5)
 * @returns Array de nombres de loterías
 */
export async function getAvailableLotteries(country: string, digitCount: number): Promise<string[]> {
  try {
    const rows = await sql`
      SELECT DISTINCT name FROM lotteries
      WHERE country = ${country}
        AND ${digitCount} = ANY(digits)
      ORDER BY name ASC
    `;
    return rows.map((row: any) => row.name);
  } catch (e) {
    console.error("[lotteries] Error al obtener loterías disponibles:", e, { country, digitCount });
    return [];
  }
}


// Obtiene todas las loterías activas
export async function getAllLotteries(): Promise<Lottery[]> {
  const rows = await sql`SELECT id, name, country, dias, digits, time, is_active FROM lotteries WHERE is_active = true ORDER BY country, name`;
  return rows as Lottery[];
}

// Obtiene una lotería por nombre exacto
export async function getLotteryByName(name: string): Promise<Lottery | null> {
  const rows = await sql`SELECT id, name, country, dias, digits, time, is_active FROM lotteries WHERE name = ${name} LIMIT 1`;
  return rows.length ? (rows[0] as Lottery) : null;
}

export interface Lottery {
  id: number;
  name: string;
  country: string;
  dias: string;
  digits: number[];
  time: number;
  is_active: boolean;
}
