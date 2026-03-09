import "server-only"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

/**
 * Obtiene los últimos 5 sorteos de una lotería por nombre, país y cifras.
 */
export async function getLastDraws(country: string, lotteryName: string, digitCount: number) {
  // Debug: mostrar parámetros recibidos
  console.log("[quedados][DEBUG][getLastDraws] Params:", { country, lotteryName, digitCount });
  console.log("[quedados][DEBUG][getLastDraws] lotteryName typeof:", typeof lotteryName, lotteryName);
  console.log("[quedados][DEBUG][getLastDraws] digitCount typeof:", typeof digitCount, digitCount);
  let digitsField = null;
  console.log("[quedados][DEBUG][getLastDraws] digitCount received:", digitCount, typeof digitCount);
  if (digitCount === 2) digitsField = '2';
  else if (digitCount === 3) digitsField = '3';
  else if (digitCount === 4) digitsField = '4';
  else if (digitCount === 5) digitsField = '5';
  else {
    console.error("[quedados][DEBUG][getLastDraws] Cifra no soportada", digitCount);
    throw new Error('Cifra no soportada');
  }
  let draws;
  try {
    const columnName = `digits_${digitsField}`;
    const queryText = `SELECT draw_date, lottery_name, ${columnName} FROM lottery_results WHERE lottery_name = $1 ORDER BY draw_date DESC LIMIT 5`;
    console.log("[quedados][DEBUG][getLastDraws] SQL query:", queryText, lotteryName);
    draws = await sql.query(queryText, [lotteryName]);
    if (!draws.length) {
      console.warn("[quedados][DEBUG][getLastDraws] No draws found for params:", { lotteryName, digitCount });
    }
  } catch (e) {
    const errMsg = (e && typeof e === "object" && "message" in e) ? (e as Error).message : String(e);
    console.error("[quedados][DEBUG][getLastDraws] SQL error:", errMsg, { lotteryName, digitCount });
    throw new Error("Error de base de datos: " + errMsg);
  }
  console.log("[quedados][DEBUG][getLastDraws] SQL results:", draws);
  return draws;
}
