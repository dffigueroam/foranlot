// ...existing code...
import { getLastDraws } from "./last-draws"
// ...existing code...
import "server-only"
import { neon } from "@neondatabase/serverless"
import { getAvailableLotteries } from "./lotteries"

const sql = neon(process.env.DATABASE_URL!)

export interface QuedadosResult {
  country: string
  lotteryName: string
  digitCount: number
  quedados: Array<{ position: number; digit: string; lastDate: string | null }>
  totalDraws: number
}

// Mapa global para normalizar país
const countryNameMap: Record<string, string> = {
  COL: "Colombia",
  ESP: "España",
  USA: "Estados Unidos"
};

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

  // Normalizar nombre de país si viene como código (usar solo la global)
  const normalizedCountry = countryNameMap[country] || country;

  // Debug: mostrar parámetros recibidos
  console.log("[quedados][DEBUG] Params:", { country, normalizedCountry, lotteryName, digitCount });
  // Validar que la lotería esté disponible para el país y cifras
  const availableLotteries = await getAvailableLotteries(normalizedCountry, digitCount);
  console.log("[quedados][DEBUG] availableLotteries:", availableLotteries);
  if (!availableLotteries.includes(lotteryName)) {
    console.warn("[quedados][DEBUG] Lotería no disponible para país/cifras", { lotteryName, normalizedCountry, digitCount });
    return {
      country: normalizedCountry,
      lotteryName,
      digitCount,
      quedados: [],
      totalDraws: 0,
    };
  }
  const dbLotteryName = lotteryName;
  let digitsField = null;
  if (digitCount === 2) digitsField = 'digits_2';
  else if (digitCount === 3) digitsField = 'digits_3';
  else if (digitCount === 4) digitsField = 'digits_4';
  else return {
    country,
    lotteryName,
    digitCount,
    quedados: [],
    totalDraws: 0,
  };

  // Obtener resultados históricos usando JOIN con lotteries para asegurar validez (solo filtra país en lotteries)
  const query = `
    SELECT lr.winning_number, lr.draw_date, lr.${digitsField}
    FROM lottery_results lr
    INNER JOIN lotteries l ON lr.lottery_name = l.name
    WHERE lr.lottery_name = $1
      AND l.country = $2
      AND $3 = ANY(l.digits)
      AND lr.${digitsField} IS NOT NULL
    ORDER BY lr.draw_date DESC
  `;
  const results = await sql.query(query, [dbLotteryName, normalizedCountry, digitCount]);
  console.log("[quedados][DEBUG] SQL results:", results);

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
