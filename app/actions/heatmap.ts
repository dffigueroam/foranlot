import { generateHeatmapByPosition } from "@/lib/heatmap"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

/**
 * Acción server para obtener mapa de calor de cifras por posición
 * country: país ("COL", "ESP", "USA")
 * digitCount: 3 o 4
 */
export async function getHeatmapAction(country: string, digitCount: number) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "No autenticado" }
    }
    const result = await generateHeatmapByPosition(country, digitCount)
    revalidatePath("/tools")
    return { success: true, result }
  } catch (error: any) {
    console.error("[v0] Error in getHeatmapAction:", error)
    return { error: error?.message || "Error al generar mapa de calor" }
  }
}
