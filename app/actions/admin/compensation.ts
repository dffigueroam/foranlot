"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import {
  simulateCompensation,
  calculateUserScores,
  saveRankingScores,
  type CompensationScenario,
} from "@/lib/compensation"

/**
 * Simular compensación sin ejecutar pagos reales
 */
export async function simulateCompensationAction(formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return { error: "No autorizado" }
    }

    const totalCapital = parseFloat(formData.get("totalCapital") as string)
    const multiplier = parseFloat(formData.get("multiplier") as string)
    const winningNumber = formData.get("winningNumber") as string
    const lotteryType = formData.get("lotteryType") as string
    const drawDate = formData.get("drawDate") as string

    // Validaciones
    if (!totalCapital || !multiplier || !winningNumber || !lotteryType || !drawDate) {
      return { error: "Todos los campos son requeridos" }
    }

    if (totalCapital <= 0 || multiplier <= 0) {
      return { error: "Los valores deben ser positivos" }
    }

    // En producción, estos datos vendrían de predicciones reales
    // Por ahora, simulamos con usuarios que predijeron correctamente
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(process.env.DATABASE_URL!)

    const correctPredictions = await sql`
      SELECT DISTINCT p.user_id, 100 as amount
      FROM predictions p
      WHERE p.predicted_number = ${winningNumber}
        AND p.lottery_name = ${lotteryType}
        AND p.is_verified = true
        AND p.is_correct = true
      LIMIT 20
    `

    if (correctPredictions.length === 0) {
      return { error: "No hay predicciones correctas para este escenario" }
    }

    const scenario: CompensationScenario = {
      totalCapital: totalCapital * 100, // Convertir a centavos
      multiplier,
      winningNumber,
      lotteryType,
      drawDate,
      userContributions: correctPredictions.map((p: any) => ({
        userId: p.user_id,
        amount: p.amount,
      })),
    }

    const result = await simulateCompensation(scenario)

    if (result.distribution.length === 0) {
      return { error: "No hay pronosticadores con P&G positivo para remunerar en este escenario" }
    }

    return { 
      success: true, 
      simulation: result,
      message: `Simulación completa: ${result.distribution.length} usuarios compensados`,
    }

  } catch (error) {
    console.error("[v0] Error simulating compensation:", error)
    return { error: "Error al simular compensación" }
  }
}

/**
 * Ejecutar compensación real y registrar en logs
 */
export async function executeCompensationAction(formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return { error: "No autorizado" }
    }

    const totalCapital = parseFloat(formData.get("totalCapital") as string)
    const multiplier = parseFloat(formData.get("multiplier") as string)
    const winningNumber = formData.get("winningNumber") as string
    const lotteryType = formData.get("lotteryType") as string
    const drawDate = formData.get("drawDate") as string

    if (!totalCapital || !multiplier || !winningNumber || !lotteryType || !drawDate) {
      return { error: "Todos los campos son requeridos" }
    }

    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(process.env.DATABASE_URL!)

    // Obtener predicciones correctas
    const correctPredictions = await sql`
      SELECT DISTINCT p.user_id, 100 as amount
      FROM predictions p
      WHERE p.predicted_number = ${winningNumber}
        AND p.lottery_name = ${lotteryType}
        AND p.is_verified = true
        AND p.is_correct = true
    `

    if (correctPredictions.length === 0) {
      return { error: "No hay predicciones correctas para este escenario" }
    }

    const scenario: CompensationScenario = {
      totalCapital: totalCapital * 100,
      multiplier,
      winningNumber,
      lotteryType,
      drawDate,
      userContributions: correctPredictions.map((p: any) => ({
        userId: p.user_id,
        amount: p.amount,
      })),
    }

    // Ejecutar compensación (registra en compensation_log)
    const result = await simulateCompensation(scenario)

    if (result.distribution.length === 0) {
      return { error: "No hay pronosticadores con P&G positivo para remunerar en este escenario" }
    }

    // Calcular y guardar scores para auditoría
    const userScores = await calculateUserScores(scenario)
    await saveRankingScores(userScores, drawDate)

    revalidatePath("/admin")
    revalidatePath("/ranking")

    return { 
      success: true,
      distribution: result.distribution,
      message: `Compensación ejecutada: ${result.distribution.length} usuarios pagados`,
    }

  } catch (error) {
    console.error("[v0] Error executing compensation:", error)
    return { error: "Error al ejecutar compensación" }
  }
}

/**
 * Obtener historial de compensaciones
 */
export async function getCompensationHistory() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return { error: "No autorizado" }
    }

    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(process.env.DATABASE_URL!)

    const history = await sql`
      SELECT 
        cl.id,
        cl.user_id,
        u.username,
        cl.amount_cents,
        cl.reason,
        cl.created_at
      FROM compensation_log cl
      JOIN users u ON cl.user_id = u.id
      ORDER BY cl.created_at DESC
      LIMIT 50
    `

    return { 
      success: true, 
      history: history.map((h: any) => ({
        id: h.id,
        userId: h.user_id,
        username: h.username,
        amountCents: h.amount_cents,
        reason: h.reason,
        createdAt: h.created_at,
      }))
    }

  } catch (error) {
    console.error("[v0] Error fetching compensation history:", error)
    return { error: "Error al obtener historial" }
  }
}
