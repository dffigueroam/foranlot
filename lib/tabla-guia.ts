export interface TablaGuiaResult {
  country: string
  digitCount: number
  lottery?: string
  heatmap: Array<{ position: number; digit: string; count: number }>
  totalDraws: number
}

/**
 * Genera un mapa de calor de cifras por posición para una lotería específica
 * country: país ("COL", "ESP", "USA")
 * digitCount: 3 o 4
 * lottery: nombre de la lotería
 */
export async function generateTablaGuiaByPosition(country: string, digitCount: number, lottery?: string): Promise<TablaGuiaResult> {
  const digitsCol = digitCount === 3 ? 'digits_3' : digitCount === 4 ? 'digits_4' : null;
  if (!digitsCol) throw new Error('Solo se soportan 3 o 4 dígitos');

  const countryMap: Record<string, string[]> = {
    COL: ['COL', 'Colombia'],
    ESP: ['ESP', 'España'],
    USA: ['USA', 'Estados Unidos', 'USA', 'United States'],
  };
  const countryValues = countryMap[country] || [country];

  let query = `
    SELECT lr.${digitsCol} AS winning_number, lr.draw_date
    FROM lottery_results lr
    JOIN lotteries l ON lr.lottery_name = l.name
    WHERE l.country = ANY($1)
      AND lr.${digitsCol} IS NOT NULL
      AND lr.draw_date >= CURRENT_DATE - INTERVAL '3 days'
  `;
  const params: any[] = [countryValues];
  if (lottery) {
    query += ' AND l.name = $2';
    params.push(lottery);
  }
  query += ' ORDER BY lr.draw_date DESC';
  const results = await sql.query(query, params);

  // Conteo por posición y cifra
  const heatmap: Array<{ position: number; digit: string; count: number }> = [];
  const positionMap: Map<number, Map<string, number>> = new Map();

  for (let pos = 0; pos < digitCount; pos++) {
    positionMap.set(pos, new Map());
  }

  results.forEach((row: any) => {
    const number = row.winning_number;
    for (let pos = 0; pos < digitCount; pos++) {
      const digit = number[pos];
      const map = positionMap.get(pos)!;
      map.set(digit, (map.get(digit) || 0) + 1);
    }
  });

  // Convertir a array
  for (let pos = 0; pos < digitCount; pos++) {
    const map = positionMap.get(pos)!;
    for (const [digit, count] of map.entries()) {
      heatmap.push({ position: pos, digit, count });
    }
  }

  return {
    country,
    digitCount,
    lottery,
    heatmap,
    totalDraws: results.length,
  };
}
import "server-only"
import { neon } from "@neondatabase/serverless"
const sql = neon(process.env.DATABASE_URL!)

export interface TablaGuiaResult {
  country: string
  digitCount: number
  heatmap: Array<{ position: number; digit: string; count: number }>
  totalDraws: number
}

/**
 * Genera el conteo por columna (modelo igual a mapa de calor)
 * country: país ("COL", "ESP", "USA")
 * digitCount: 3 o 4
 */
export async function generateTablaGuiaByColumn(country: string, digitCount: number): Promise<TablaGuiaResult> {
  const digitsCol = digitCount === 3 ? 'digits_3' : digitCount === 4 ? 'digits_4' : null;
  if (!digitsCol) throw new Error('Solo se soportan 3 o 4 dígitos');

  // Accept lottery as optional third parameter
  let lotteryName: string | undefined;
  if (arguments.length > 2) lotteryName = arguments[2];

  const countryMap: Record<string, string[]> = {
    COL: ['COL', 'Colombia'],
    ESP: ['ESP', 'España'],
    USA: ['USA', 'Estados Unidos', 'USA', 'United States'],
  };
  const countryValues = countryMap[country] || [country];

  let query = `
    SELECT lr.${digitsCol} AS winning_number, lr.draw_date
    FROM lottery_results lr
    JOIN lotteries l ON lr.lottery_name = l.name
    WHERE l.country = ANY($1)
      AND lr.${digitsCol} IS NOT NULL
  `;
  const params: any[] = [countryValues];
  if (lotteryName) {
    query += ' AND l.name = $2';
    params.push(lotteryName);
  }
  query += ' ORDER BY lr.draw_date DESC LIMIT 100';
  const results = await sql.query(query, params);

  // Conteo por posición y cifra
  const heatmap: Array<{ position: number; digit: string; count: number }> = [];
  const positionMap: Map<number, Map<string, number>> = new Map();

  for (let pos = 0; pos < digitCount; pos++) {
    positionMap.set(pos, new Map());
  }

  results.forEach((row: any) => {
    const number = row.winning_number;
    for (let pos = 0; pos < digitCount; pos++) {
      const digit = number[pos];
      const map = positionMap.get(pos)!;
      map.set(digit, (map.get(digit) || 0) + 1);
    }
  });

  // Convertir a array
  for (let pos = 0; pos < digitCount; pos++) {
    const map = positionMap.get(pos)!;
    for (const [digit, count] of map.entries()) {
      heatmap.push({ position: pos, digit, count });
    }
  }

  return {
    country,
    digitCount,
    heatmap,
    totalDraws: results.length,
  };
}
