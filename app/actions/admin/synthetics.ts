"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { 
  generateMonthlySynthetics, 
  getSyntheticComposition 
} from "@/lib/synthetic-users"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

/**
 * Generar usuarios sintéticos manualmente (admin)
 */
export async function generateSyntheticsAction() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return { error: "No autorizado" }
    }

    const result = await generateMonthlySynthetics(true)

    if (result.error) {
      return { error: result.error }
    }

    revalidatePath("/admin")
    revalidatePath("/ranking")

    return {
      success: true,
      message: `Generados ${result.total} usuarios sintéticos`,
      dayBest: result.dayBestUsers.length,
      lotBest: result.lotBestUsers.length,
    }

  } catch (error) {
    console.error("[v0] Error generating synthetics:", error)
    return { error: "Error al generar usuarios sintéticos" }
  }
}

/**
 * Obtener lista de usuarios sintéticos
 */
export async function getSyntheticUsersAction() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return { error: "No autorizado" }
    }

    const synthetics = await sql`
      SELECT 
        u.id,
        u.username,
        u.created_at,
        u.synthetic_type,
        u.synthetic_specialization,
        u.is_synthetic_pending,
        us.total_predictions,
        us.correct_predictions,
        us.accuracy_percentage
      FROM users u
      LEFT JOIN user_stats us ON u.id = us.user_id
      WHERE u.is_synthetic = true
      ORDER BY u.created_at DESC
    `

    return {
      success: true,
      users: synthetics.map((s: any) => ({
        id: s.id,
        username: s.username,
        createdAt: s.created_at,
        totalPredictions: s.total_predictions || 0,
        correctPredictions: s.correct_predictions || 0,
        accuracy: parseFloat(s.accuracy_percentage) || 0,
        syntheticType: s.synthetic_type || null,
        specialization: s.synthetic_specialization || null,
        isPending: s.is_synthetic_pending || false,
      }))
    }

  } catch (error) {
    console.error("[v0] Error fetching synthetic users:", error)
    return { error: "Error al obtener usuarios sintéticos" }
  }
}

/**
 * Ver composición de un usuario sintético
 */
export async function getCompositionAction(syntheticId: number) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return { error: "No autorizado" }
    }

    const composition = await getSyntheticComposition(syntheticId)

    return {
      success: true,
      composition,
    }

  } catch (error) {
    console.error("[v0] Error fetching composition:", error)
    return { error: "Error al obtener composición" }
  }
}

/**
 * Obtener pendientes de aprobación
 */
export async function getPendingSyntheticUpdatesAction() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return { error: "No autorizado" }
    }

    const pending = await sql`
      SELECT 
        su.id as update_id,
        su.synthetic_user_id,
        su.proposed_name,
        su.synthetic_type,
        su.specialization,
        su.created_at,
        u.username as current_username
      FROM synthetic_user_pending_updates su
      JOIN users u ON su.synthetic_user_id = u.id
      WHERE su.status = 'pending'
      ORDER BY su.created_at DESC
    `

    return {
      success: true,
      updates: pending || [],
    }
  } catch (error) {
    console.error("[v0] Error fetching pending synthetics:", error)
    return { error: "Error al obtener pendientes" }
  }
}

/**
 * Aprobar actualización o creación de sintético
 */
export async function approveSyntheticUpdateAction(updateId: number, finalName?: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return { error: "No autorizado" }
    }

    const update = await sql`
      SELECT * FROM synthetic_user_pending_updates WHERE id = ${updateId}
    `

    if (!update[0]) {
      return { error: "Solicitud no encontrada" }
    }

    const syntheticUserId = update[0].synthetic_user_id
    const newName = finalName?.trim() || update[0].proposed_name

    // Actualizar usuario sintético
    await sql`
      UPDATE users
      SET
        username = ${newName},
        is_synthetic = true,
        is_synthetic_pending = false,
        synthetic_type = ${update[0].synthetic_type},
        synthetic_specialization = ${update[0].specialization}
      WHERE id = ${syntheticUserId}
    `

    // Asegurar stats
    await sql`
      INSERT INTO user_stats (user_id, total_predictions, correct_predictions, accuracy_percentage)
      VALUES (${syntheticUserId}, 0, 0, 0)
      ON CONFLICT (user_id) DO NOTHING
    `

    // Reemplazar composición
    await sql`
      DELETE FROM synthetic_user_composition
      WHERE synthetic_user_id = ${syntheticUserId}
    `

    const composition = await sql`
      SELECT organic_user_id, weight_contribution
      FROM synthetic_user_pending_composition
      WHERE update_id = ${updateId}
    `

    for (const row of composition as any[]) {
      await sql`
        INSERT INTO synthetic_user_composition (
          synthetic_user_id,
          organic_user_id,
          weight_contribution,
          created_at
        ) VALUES (
          ${syntheticUserId},
          ${row.organic_user_id},
          ${row.weight_contribution},
          CURRENT_TIMESTAMP
        )
      `
    }

    await sql`
      UPDATE synthetic_user_pending_updates
      SET status = 'approved', approved_at = CURRENT_TIMESTAMP, approved_by = ${user.userId}
      WHERE id = ${updateId}
    `

    revalidatePath("/admin")
    revalidatePath("/ranking")

    return { success: true }
  } catch (error) {
    console.error("[v0] Error approving synthetic update:", error)
    return { error: "Error al aprobar" }
  }
}

/**
 * Rechazar solicitud
 */
export async function rejectSyntheticUpdateAction(updateId: number) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return { error: "No autorizado" }
    }

    await sql`
      UPDATE synthetic_user_pending_updates
      SET status = 'rejected', approved_at = CURRENT_TIMESTAMP, approved_by = ${user.userId}
      WHERE id = ${updateId}
    `

    revalidatePath("/admin")

    return { success: true }
  } catch (error) {
    console.error("[v0] Error rejecting synthetic update:", error)
    return { error: "Error al rechazar" }
  }
}
