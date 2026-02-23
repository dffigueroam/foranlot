"use server"
import { analyzeNumberByLoteries } from "@/lib/number-lottery-analysis"
/**
 * Analiza cada número ingresado y devuelve en qué loterías del país tiene alta probabilidad de salir
 */
export async function analyzeNumberByLoteriesAction(userNumbers: string[], country: string, digitCount: number) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "No autenticado" }
    }
    const result = await analyzeNumberByLoteries(userNumbers, country, digitCount)
    return { success: true, result }
  } catch (error) {
    console.error("[v0] Error en analyzeNumberByLoteriesAction:", error)
    return { error: "Error al analizar números por lotería" }
  }
}
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"
import {
  analyzeHotNumbers,
  analyzeColdNumbers,
  analyzeNumberPatterns,
} from "@/lib/tool-analyzers"

const sql = neon(process.env.DATABASE_URL!)

/**
 * Obtener límites de uso diario del usuario
 */
export async function getUserDailyLimitsAction() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "No autenticado" }
    }

    const result = await sql`
      SELECT * FROM get_user_daily_limits(${user.id})
    `

    if (result.length === 0) {
      // Crear límites iniciales
      await sql`
        INSERT INTO daily_tool_limits (
          user_id,
          usage_date,
          total_uses,
          free_uses_remaining,
          premium_uses_remaining
        ) VALUES (
          ${user.id},
          CURRENT_DATE,
          0,
          20,
          20
        )
      `

      return {
        success: true,
        limits: {
          totalUses: 0,
          freeRemaining: 20,
          premiumRemaining: 20,
          isPremium: user.is_premium,
          maxUses: 20,
        },
      }
    }

    const limits = result[0]
    return {
      success: true,
      limits: {
        totalUses: limits.total_uses,
        freeRemaining: limits.free_remaining,
        premiumRemaining: limits.premium_remaining,
        isPremium: limits.is_premium,
        maxUses: 20,
      },
    }
  } catch (error: any) {
    console.error("[v0] Error getting user daily limits:", error)
    return { error: error?.message || "Error al obtener límites" }
  }
}

/**
 * 1. Herramienta: Números Calientes
 */
export async function analyzeHotNumbersAction(
  userNumbers: string[],
  lotteryType: string,
  country: string = "COL"
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "No autenticado" }
    }

    // Verificar límites
    const canUse = await sql`SELECT can_use_tool(${user.id}) as can_use`
    if (!canUse[0].can_use) {
      return {
        error: user.is_premium
          ? "Has alcanzado tu límite de 20 usos diarios"
          : "Has alcanzado tu límite de 20 usos diarios. Hazte premium para más ventajas",
      }
    }

    // Ejecutar análisis
    const result = await analyzeHotNumbers(userNumbers, lotteryType, country)

    // Registrar uso
    await sql`
      SELECT record_tool_use(
        ${user.id},
        'numeros_calientes',
        ${lotteryType},
        ${JSON.stringify(userNumbers)},
        ${JSON.stringify(result.summary)}
      )
    `

    revalidatePath("/tools")

    return { success: true, result }
  } catch (error: any) {
    console.error("[v0] Error in analyzeHotNumbersAction:", error)
    return { error: error?.message || "Error al analizar números calientes" }
  }
}

/**
 * 2. Herramienta: Números Fríos/Sin Salir
 */
export async function analyzeColdNumbersAction(
  userNumbers: string[],
  lotteryType: string,
  country: string = "COL"
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "No autenticado" }
    }

    // Verificar límites
    const canUse = await sql`SELECT can_use_tool(${user.id}) as can_use`
    if (!canUse[0].can_use) {
      return {
        error: user.is_premium
          ? "Has alcanzado tu límite de 20 usos diarios"
          : "Has alcanzado tu límite de 20 usos diarios. Hazte premium para más ventajas",
      }
    }

    // Ejecutar análisis
    const result = await analyzeColdNumbers(userNumbers, lotteryType, country)

    // Registrar uso
    await sql`
      SELECT record_tool_use(
        ${user.id},
        'numeros_frios',
        ${lotteryType},
        ${JSON.stringify(userNumbers)},
        ${JSON.stringify(result.summary)}
      )
    `

    revalidatePath("/tools")

    return { success: true, result }
  } catch (error: any) {
    console.error("[v0] Error in analyzeColdNumbersAction:", error)
    return { error: error?.message || "Error al analizar números fríos" }
  }
}

/**
 * 3. Herramienta: Análisis de Patrones
 */
export async function analyzeNumberPatternsAction(
  userNumbers: string[],
  lotteryType: string
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "No autenticado" }
    }

    // Verificar límites
    const canUse = await sql`SELECT can_use_tool(${user.id}) as can_use`
    if (!canUse[0].can_use) {
      return {
        error: user.is_premium
          ? "Has alcanzado tu límite de 20 usos diarios"
          : "Has alcanzado tu límite de 20 usos diarios. Hazte premium para más ventajas",
      }
    }

    // Ejecutar análisis
    const result = await analyzeNumberPatterns(userNumbers, lotteryType)

    // Registrar uso
    await sql`
      SELECT record_tool_use(
        ${user.id},
        'analisis_patrones',
        ${lotteryType},
        ${JSON.stringify(userNumbers)},
        ${JSON.stringify(result.summary || { patrones: result.patterns?.length || 0 })}
      )
    `

    revalidatePath("/tools")

    return { success: true, result }
  } catch (error: any) {
    console.error("[v0] Error in analyzeNumberPatternsAction:", error)
    return { error: error?.message || "Error al analizar patrones" }
  }
}

/**
 * Obtener historial de uso del usuario
 */
export async function getUserToolHistoryAction() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "No autenticado" }
    }

    const history = await sql`
      SELECT 
        tool_name,
        lottery_type,
        usage_date,
        input_numbers,
        result_summary,
        created_at
      FROM tool_usage_tracking
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 20
    `

    return { success: true, history }
  } catch (error: any) {
    console.error("[v0] Error getting user tool history:", error)
    return { error: error?.message || "Error al obtener historial" }
  }
}
