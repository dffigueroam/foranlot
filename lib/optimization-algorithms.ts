import { Prediction } from "./predictions"

// Ejemplo de algoritmo: invertir el número predicho
export function invertPrediction(prediction: Prediction): string {
  // Invierte el string del número (manteniendo ceros a la izquierda)
  return prediction.predicted_number.split('').reverse().join('')
}

// Ejemplo: sumar 1 a cada dígito (mod 10)
export function incrementDigits(prediction: Prediction): string {
  return prediction.predicted_number
    .split('')
    .map(d => String((parseInt(d, 10) + 1) % 10))
    .join('')
}

// Ejemplo: sugerir el número más frecuente
export function mostFrequentPrediction(predictions: Prediction[]): string | null {
  const freq: Record<string, number> = {}
  for (const p of predictions) {
    freq[p.predicted_number] = (freq[p.predicted_number] || 0) + 1
  }
  let max = 0
  let result: string | null = null
  for (const [num, count] of Object.entries(freq)) {
    if (count > max) {
      max = count
      result = num
    }
  }
  return result
}
