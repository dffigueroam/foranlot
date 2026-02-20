import { Prediction } from "./predictions"

export interface OptimizationPattern {
  lottery_name: string
  pattern: 'exact' | 'last3_in_first3' | 'first3_in_last3' | 'off_by_one' | 'custom'
  description: string
  params?: any
}

// Detecta si las últimas 3 cifras del pronóstico coinciden con las primeras 3 del resultado
export function detectLast3InFirst3(prediction: Prediction): boolean {
  if (!prediction.actual_number || prediction.predicted_number.length < 3 || prediction.actual_number.length < 3) return false
  return prediction.predicted_number.slice(-3) === prediction.actual_number.slice(0, 3)
}

// Detecta si las primeras 3 cifras del pronóstico coinciden con las últimas 3 del resultado
export function detectFirst3InLast3(prediction: Prediction): boolean {
  if (!prediction.actual_number || prediction.predicted_number.length < 3 || prediction.actual_number.length < 3) return false
  return prediction.predicted_number.slice(0, 3) === prediction.actual_number.slice(-3)
}

// Detecta si el pronóstico es igual al resultado
export function detectExactMatch(prediction: Prediction): boolean {
  return prediction.predicted_number === prediction.actual_number
}

// Detecta si el pronóstico está a 1 dígito de diferencia (en cualquier posición)
export function detectOffByOne(prediction: Prediction): boolean {
  if (!prediction.actual_number || prediction.predicted_number.length !== prediction.actual_number.length) return false
  let diffs = 0
  for (let i = 0; i < prediction.predicted_number.length; i++) {
    if (Math.abs(Number(prediction.predicted_number[i]) - Number(prediction.actual_number[i])) === 1) diffs++
  }
  return diffs === 1
}

// Analiza patrones de acierto por lotería
export function analyzePatterns(predictions: Prediction[]): OptimizationPattern[] {
  const patterns: OptimizationPattern[] = []
  const byLottery: Record<string, Prediction[]> = {}
  for (const p of predictions) {
    if (!byLottery[p.lottery_name]) byLottery[p.lottery_name] = []
    byLottery[p.lottery_name].push(p)
  }
  for (const [lottery, preds] of Object.entries(byLottery)) {
    let last3infirst3 = 0, first3inlast3 = 0, exact = 0, offbyone = 0
    for (const p of preds) {
      if (detectLast3InFirst3(p)) last3infirst3++
      if (detectFirst3InLast3(p)) first3inlast3++
      if (detectExactMatch(p)) exact++
      if (detectOffByOne(p)) offbyone++
    }
    const total = preds.length
    if (last3infirst3 > 0) patterns.push({ lottery_name: lottery, pattern: 'last3_in_first3', description: `Las últimas 3 cifras del pronóstico suelen salir como las 3 primeras del resultado (${last3infirst3}/${total})` })
    if (first3inlast3 > 0) patterns.push({ lottery_name: lottery, pattern: 'first3_in_last3', description: `Las primeras 3 cifras del pronóstico suelen salir como las 3 últimas del resultado (${first3inlast3}/${total})` })
    if (exact > 0) patterns.push({ lottery_name: lottery, pattern: 'exact', description: `Coincidencia exacta en ${exact} de ${total}` })
    if (offbyone > 0) patterns.push({ lottery_name: lottery, pattern: 'off_by_one', description: `Aciertos a 1 dígito de diferencia (${offbyone}/${total})` })
  }
  return patterns
}
