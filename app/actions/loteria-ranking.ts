import "server-only";
import { getLoteriaRanking } from "../../lib/ranking";

export async function fetchLoteriaRanking({ lotteryName, country, date }: { lotteryName: string; country: string; date?: string }) {
  // Validación básica
  if (!lotteryName || !country) return { error: "Debe seleccionar lotería y país" };
  const ranking = await getLoteriaRanking(lotteryName, country, date);
  return { ranking };
}
