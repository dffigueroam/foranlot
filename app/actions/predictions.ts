"use server"

import { getCurrentUser } from "@/lib/auth"
import { 
  createPrediction, 
  getPredictions, 
  getUserPredictions, 
  getRemainingDailyLimit,
  toggleFavoriteCombination,
  deleteLotteryCombination,
  incrementCombinationUsage
} from "@/lib/predictions"
import { saveLotteryCombination, getUserLastCombinations } from "@/lib/lottery-combinations"
import { sanitizeInput } from "@/lib/security"
import { revalidatePath } from "next/cache"
import { LOTTERIES } from "@/lib/lotteries"
import { canPublishPrediction } from "@/lib/timezones"


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

  // Usar la hora específica de la lotería (lottery.time)
  const resolvedDrawTime = drawTime || `${lottery.time.toString().padStart(2, "0")}:00`

  // 🕐 VALIDACIÓN DE TIEMPO: Debe publicar al menos 1 hora antes del sorteo
  const timeValidation = canPublishPrediction(
    drawDate,
    resolvedDrawTime,
    lottery.country
  )

  if (!timeValidation.allowed) {
    return { error: timeValidation.message || "No se puede publicar esta predicción" }
  }
 
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

  // 🕐 VALIDACIÓN DE TIEMPO: Verificar al menos una lotería para tiempo
  if (validatedLotteries.length > 0) {
    const firstLottery = validatedLotteries[0]
    // Usar dayTypeHours o time según la definición de la lotería
    let lotteryHour = firstLottery.time;
    if (lotteryHour === undefined && firstLottery.dayTypeHours) {
      // Tomar la hora laboral por defecto
      lotteryHour = firstLottery.dayTypeHours.laboral || Object.values(firstLottery.dayTypeHours)[0];
    }
    const resolvedDrawTime = drawTime || `${lotteryHour?.toString().padStart(2, "0")}:00`
    
    const timeValidation = canPublishPrediction(
      drawDate,
      resolvedDrawTime,
      firstLottery.country
    )

    if (!timeValidation.allowed) {
      return { error: timeValidation.message || "No se puede publicar esta predicción" }
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

  // Guardar combinación de loterías para uso futuro
  await saveLotteryCombination(user.id, lotteryNames, lotteryType)

  revalidatePath("/dashboard")
  revalidatePath("/predictions")

  return { 
    success: true,
    message: `Pronóstico publicado: ${successCount} registros (${predictedNumbers.length} números × ${validatedLotteries.length} loterias)`
  }
}

export async function fetchPredictions(limit?: number) {
  const user = await getCurrentUser()
  const predictions = await getPredictions(user?.id || null, limit)
  return predictions
}

export async function fetchUserPredictions(userId: number) {
  const predictions = await getUserPredictions(userId)
  return predictions
}

export async function getLastLotteryCombinations(limit?: number) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "No autenticado" }
  }

  const combinations = await getUserLastCombinations(user.id, limit || 5)
  
  return { success: true, combinations }
}

export async function toggleFavoriteCombinationAction(combinationId: number) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "No autenticado" }
  }

  const result = await toggleFavoriteCombination(combinationId, user.id)
  
  if (result.success) {
    revalidatePath("/dashboard")
    return { success: true, isFavorite: result.isFavorite }
  }

  return { error: result.error || "Error al actualizar favorito" }
}

export async function deleteLotteryCombinationAction(combinationId: number) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "No autenticado" }
  }

  const result = await deleteLotteryCombination(combinationId, user.id)
  
  if (result.success) {
    revalidatePath("/dashboard")
    return { success: true }
  }

  return { error: result.error || "Error al eliminar combinación" }
}

export async function applyCombinationAction(combinationId: number) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "No autenticado" }
  }

  const result = await incrementCombinationUsage(combinationId, user.id)
  
  return result
}

/**
 * Obtiene las loterias disponibles para una fecha específica
 * Filtra por país y verifica que tengan hora configurada para ese tipo de día
 */
export async function getAvailableLotteriesForDate(date: string, country: string) {
  const { getAvailableLotteriesForPosting } = await import("@/lib/lotteries")
  
  if (!date || !country) {
    return { error: "Fecha y país son requeridos", lotteries: [] }
  }

  // Validar formato de fecha
  const dateObj = new Date(date + "T00:00:00")
  if (isNaN(dateObj.getTime())) {
    return { error: "Formato de fecha inválido (YYYY-MM-DD)", lotteries: [] }
  }

  const lotteries = getAvailableLotteriesForPosting(date, country)
  
  if (lotteries.length === 0) {
    return { 
      error: `No hay loterias disponibles para ${country} en esa fecha`,
      lotteries: [] 
    }
  }

  return {
    success: true,
    lotteries: lotteries.map(l => ({
      name: l.name,
      country: l.country,
      digits: l.digits,
      availableHour: l.availableHour,
      dayType: l.dayType
    }))
  }
}
