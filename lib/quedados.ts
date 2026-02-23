/**
 * Obtiene los últimos 5 sorteos de una lotería por nombre, país y cifras.
 */
export async function getLastDraws(country: string, lotteryName: string, digitCount: number) {
  const countryMap: Record<string, string[]> = {
    COL: ["COL", "Colombia"],
    ESP: ["ESP", "España"],
    USA: ["USA", "Estados Unidos", "USA", "United States"],
  };
  const countryValues = countryMap[country] || [country];
  const draws = await sql`
    SELECT draw_date, result
    FROM lottery_results
    WHERE country = ANY(${countryValues})
      AND lottery_name = ${lotteryName}
      AND digit_count = ${digitCount}
    ORDER BY draw_date DESC
    LIMIT 5
  `;
  return draws;
}
import "server-only"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface QuedadosResult {
  country: string
  lotteryName: string
  digitCount: number
  quedados: Array<{ position: number; digit: string; lastDate: string | null }>
  totalDraws: number
}

/**
 * Genera el análisis de quedados por posición.
 * country: país ("COL", "ESP", "USA")
 * lotteryName: nombre de la lotería
 * digitCount: 3, 4, 5
 */
export async function generateQuedadosByPosition(
  country: string,
  lotteryName: string,
  digitCount: number
): Promise<QuedadosResult> {
  // Adaptar país: aceptar código o nombre
  const countryMap: Record<string, string[]> = {
    COL: ["COL", "Colombia"],
    ESP: ["ESP", "España"],
    USA: ["USA", "Estados Unidos", "USA", "United States"],
  };
  const countryValues = countryMap[country] || [country];

  // Validar lotería
  const lotRes = await sql`SELECT name FROM lotteries WHERE country = ANY(${countryValues}) AND name = ${lotteryName} AND ${digitCount} = ANY(digits) AND is_active = true`;
  if (!lotRes.length) return {
    country,
    lotteryName,
    digitCount,
    quedados: [],
    totalDraws: 0,
  };

  // Obtener resultados históricos
  const query = `
    SELECT lr.winning_number, lr.draw_date
    FROM lottery_results lr
    WHERE lr.lottery_name = $1
      AND lr.winning_number IS NOT NULL
    ORDER BY lr.draw_date DESC
  `;
  const results = await sql.query(query, [lotteryName]);

  // Mapear por posición y dígito: fecha más reciente
  const positionMap: Map<number, Map<string, string>> = new Map();
  for (let pos = 0; pos < digitCount; pos++) {
    positionMap.set(pos, new Map());
  }

  results.forEach((row: any) => {
    const number = row.winning_number;
    for (let pos = 0; pos < digitCount; pos++) {
      const digit = number[pos];
      const map = positionMap.get(pos)!;
      if (!map.has(digit)) {
        map.set(digit, row.draw_date);
      }
    }
  });

  // Para cada posición, ordenar por fecha (más vieja primero)
  const quedados: Array<{ position: number; digit: string; lastDate: string | null }> = [];
  for (let pos = 0; pos < digitCount; pos++) {
    const map = positionMap.get(pos)!;
    const arr = Array.from(map.entries()).map(([digit, lastDate]) => ({ position: pos, digit, lastDate }));
    arr.sort((a, b) => new Date(a.lastDate).getTime() - new Date(b.lastDate).getTime());
    quedados.push(...arr);
  }

  return {
    country,
    lotteryName,
    digitCount,
    quedados,
    totalDraws: results.length,
  };
}
