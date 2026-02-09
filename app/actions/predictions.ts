"use server"

import { getCurrentUser } from "@/lib/auth"
import { createPrediction, getPredictions, getUserPredictions, getRemainingDailyLimit } from "@/lib/predictions"
import { sanitizeInput } from "@/lib/security"
import { revalidatePath } from "next/cache"
import { LOTTERIES } from "@/lib/lotteries"


export async function submitPrediction(formData: FormData) {
  const user = await getCurrentUser()

  if (!user) {
    return { error: "Debes iniciar sesión para publicar pronósticos" }
  }

  const lotteryName = formData.get("lottery_name") as string
  const lotteryType = formData.get("lottery_type") as string
  const predictedNumberRaw = formData.get("predicted_number") as string
  const drawDate = formData.get("draw_date") as string
  const drawTime = formData.get("draw_time") as string
  const confidenceLevel = formData.get("confidence_level") as string
  const confidenceValue = Number(confidenceLevel)

  // Sanitizar número predicho
  const predictedNumber = sanitizeInput(predictedNumberRaw, "number")

  if (!predictedNumber) {
    return { error: "Número predicho inválido (solo dígitos y espacios)" }
  }

  if (Number.isNaN(confidenceValue) || confidenceValue < 1 || confidenceValue > 5) {
    return { error: "El nivel de confianza debe estar entre 1 y 5" }
  }

  const notesRaw = formData.get("notes")
  const notes = typeof notesRaw === "string" && notesRaw.trim() !== "" ? sanitizeInput(notesRaw, "text") : undefined

  const lottery = LOTTERIES.find(l => l.name === lotteryName)

  if (!lottery) {
    return { error: "Lotería no válida" }
  }

  if (!lotteryName || !lotteryType || !predictedNumber || !confidenceLevel) {
    return { error: "Todos los campos son requeridos" }
  }

  const predictedNumbers = predictedNumber.trim().split(" ")

const allowedDigits = lottery.digits // ej: [3, 4]

const invalid = predictedNumbers.find(
  n => !allowedDigits.includes(n.length)
)

if (invalid) {
  return {
    error: `La lotería ${lottery.name} no soporta ${invalid.length} cifras`
  }
}

// Derivar fecha y hora desde la lotería
const resolvedDrawDate = drawDate || new Date().toISOString().split("T")[0]

const resolvedDrawTime =
  lotteryType === "3_digits" ? "20:00" :
  lotteryType === "4_digits" ? "21:00" :
  null
 
  const result = await createPrediction(
    user.id,
    lotteryName,
    lotteryType,
    predictedNumber,
    drawDate,
    drawTime || null,
    confidenceValue,
    notes,
  )

  if (result.error) {
    return { error: result.error }
  }

  revalidatePath("/dashboard")
  revalidatePath("/predictions")
  return { success: true }
}

// Nuevo: Crear múltiples predicciones en varias loterias (uno por número)
export async function submitMultiplePredictions(
  lotteryNames: string[],
  lotteryType: string,
  predictedNumbersStr: string,
  drawDate: string,
  drawTime: string | null,
  confidenceLevel: string,
  notes: string | null
) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Debes iniciar sesión" }
  }

  const confidenceValue = Number(confidenceLevel)
  if (Number.isNaN(confidenceValue) || confidenceValue < 1 || confidenceValue > 5) {
    return { error: "El nivel de confianza debe estar entre 1 y 5" }
  }

  // Validar y separar números
  const predictedNumbers = predictedNumbersStr.trim().split(" ").filter(Boolean)
  if (predictedNumbers.length === 0) {
    return { error: "Debes ingresar al menos un número" }
  }

  const digitsNum = parseInt(lotteryType.split("_")[0])
  const invalid = predictedNumbers.find(n => n.length !== digitsNum)
  if (invalid) {
    return { error: `Cada número debe tener exactamente ${digitsNum} dígitos` }
  }

  // Validar y procesar loterias
  const validatedLotteries = lotteryNames
    .map(name => LOTTERIES.find(l => l.name === name))
    .filter((lot): lot is typeof LOTTERIES[0] => {
      if (!lot) return false
      return lot.digits.includes(digitsNum)
    })

  if (validatedLotteries.length === 0) {
    return { error: "No hay loterias válidas para los números ingresados" }
  }

  // Verificar límites antes de crear
  for (const lottery of validatedLotteries) {
    const remaining = await getRemainingDailyLimit(user.id, lottery.name, lotteryType, drawDate)
    if (remaining < predictedNumbers.length) {
      return { 
        error: `Límite excedido para ${lottery.name}: solo puedes agregar ${remaining} números más hoy (máx 10 por lotería por tipo de cifra por día)` 
      }
    }
  }

  const notesProcessed = notes && notes.trim() !== "" ? notes : undefined

  // Crear una predicción por cada número por cada lotería
  const errors: string[] = []
  let successCount = 0

  for (const lottery of validatedLotteries) {
    for (const number of predictedNumbers) {
      const result = await createPrediction(
        user.id,
        lottery.name,
        lotteryType,
        number,  // Un solo número por registro
        drawDate,
        drawTime || null,
        confidenceValue,
        notesProcessed,
      )

      if (result.error) {
        errors.push(`${lottery.name} - ${number}: ${result.error}`)
      } else {
        successCount++
      }
    }
  }

  if (successCount === 0) {
    return { error: `No se pudieron crear pronósticos. ${errors.join(" | ")}` }
  }

  revalidatePath("/dashboard")
  revalidatePath("/predictions")

  return { 
    success: true,
    message: `Pronóstico publicado: ${successCount} registros (${predictedNumbers.length} números × ${validatedLotteries.length} loterias)`
  }
}

export async function fetchPredictions(limit?: number) {
  const user = await getCurrentUser()
  const predictions = await getPredictions(user?.id || null)
  return predictions
}

export async function fetchUserPredictions(userId: number) {
  const predictions = await getUserPredictions(userId)
  return predictions
}
