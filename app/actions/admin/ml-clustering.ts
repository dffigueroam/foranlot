"use server"

import { getCurrentUser } from "@/lib/auth"
import {
  identifyGoodUsers,
  clusterUsersBySpecialization,
  generateSyntheticUsersFromClusters,
  getClusteringStats,
} from "@/lib/ml-user-clustering"
import { neon } from "@neondatabase/serverless"
import { revalidatePath } from "next/cache"

const sql = neon(process.env.DATABASE_URL!)

/**
 * Analizar usuarios buenos y crear clusters para usuarios sintéticos
 * Solo para administradores
 */
export async function analyzeUsersForSyntheticsAction() {
  const user = await getCurrentUser()

  if (!user || user.role !== "admin") {
    return { error: "No autorizado - Se requiere rol de administrador" }
  }

  try {
    console.log("[v0] Starting ML user analysis for synthetics generation")

    // Paso 1: Identificar usuarios buenos
    const goodUsers = await identifyGoodUsers()

    if (goodUsers.length === 0) {
      return {
        error: "No hay usuarios con suficiente historial (mínimo 20 predicciones, 40% accuracy)",
        goodUsers: [],
        clusters: [],
        stats: null,
      }
    }

    // Paso 2: Agrupar usuarios por especialización
    const clusters = await clusterUsersBySpecialization(goodUsers)

    if (clusters.length === 0) {
      return {
        error: "No se pudieron formar clusters válidos",
        goodUsers,
        clusters: [],
        stats: null,
      }
    }

    // Paso 3: Generar datos para sintéticos
    const syntheticsData = await generateSyntheticUsersFromClusters(clusters)

    // Paso 4: Obtener estadísticas
    const stats = getClusteringStats(clusters)

    console.log(`[v0] Analysis complete: ${clusters.length} clusters, ${stats.totalUsersInvolved} users`)

    return {
      success: true,
      goodUsers,
      clusters,
      syntheticsData,
      stats,
    }
  } catch (error) {
    console.error("[v0] Error analyzing users:", error)
    return { error: "Error al analizar usuarios" }
  }
}

/**
 * Generar usuarios sintéticos basados en clusters ML
 * Crea las composiciones pendientes para aprobación del admin
 */
export async function generateSyntheticsFromClustersAction() {
  const user = await getCurrentUser()

  if (!user || user.role !== "admin") {
    return { error: "No autorizado - Se requiere rol de administrador" }
  }

  try {
    console.log("[v0] Generating synthetic users from ML clusters")

    // Paso 1: Análisis
    const analysis = await analyzeUsersForSyntheticsAction()

    if (analysis.error) {
      return { error: analysis.error }
    }

    const syntheticsData = (analysis as any).syntheticsData
    const clusters = (analysis as any).clusters

    // Guard check
    if (!syntheticsData || !Array.isArray(syntheticsData)) {
      return { error: "Error: datos de sintéticos no válidos" }
    }

    // Paso 2: Crear usuarios sintéticos pendientes
    const createdSynthetics = []

    for (const syntheticData of syntheticsData) {
      try {
        // Verificar si ya existe el usuario sintético
        const existing = await sql`
          SELECT id FROM users
          WHERE synthetic_type = ${syntheticData.type}
            AND synthetic_specialization = ${syntheticData.specialization}
          LIMIT 1
        `

        let syntheticUserId: number

        if (existing[0]) {
          syntheticUserId = existing[0].id
        } else {
          // Crear usuario pendiente
          const created = await sql`
            INSERT INTO users (
              username,
              email,
              password_hash,
              is_synthetic,
              is_synthetic_pending,
              synthetic_type,
              synthetic_specialization,
              created_at
            ) VALUES (
              ${syntheticData.clusterName},
              ${`${syntheticData.clusterName}@lotiq.ai`},
              'synthetic_not_usable',
              false,
              true,
              ${syntheticData.type},
              ${syntheticData.specialization},
              CURRENT_TIMESTAMP
            )
            RETURNING id
          `

          syntheticUserId = created[0].id
        }

        // Crear actualización pendiente con composición
        const update = await sql`
          INSERT INTO synthetic_user_pending_updates (
            synthetic_user_id,
            proposed_name,
            synthetic_type,
            specialization,
            status,
            created_at
          ) VALUES (
            ${syntheticUserId},
            ${syntheticData.clusterName},
            ${syntheticData.type},
            ${syntheticData.specialization},
            'pending',
            CURRENT_TIMESTAMP
          )
          RETURNING id
        `

        const updateId = update[0].id

        // Agregar composición (usuarios que forman el sintético)
        for (const comp of syntheticData.composition) {
          await sql`
            INSERT INTO synthetic_user_pending_composition (
              update_id,
              organic_user_id,
              weight_contribution,
              created_at
            ) VALUES (
              ${updateId},
              ${comp.userId},
              ${comp.weight},
              CURRENT_TIMESTAMP
            )
          `
        }

        createdSynthetics.push({
          name: syntheticData.clusterName,
          type: syntheticData.type,
          specialization: syntheticData.specialization,
          updateId,
          usersCount: syntheticData.composition.length,
          status: "pending_approval",
        })
      } catch (error) {
        console.error(`[v0] Error creating synthetic ${syntheticData.clusterName}:`, error)
      }
    }

    revalidatePath("/admin")

    return {
      success: true,
      createdSynthetics,
      message: `${createdSynthetics.length} usuarios sintéticos creados (pendientes de aprobación)`,
      totalUsers: (analysis as any).stats?.totalUsersInvolved || 0,
    }
  } catch (error) {
    console.error("[v0] Error generating synthetics from clusters:", error)
    return { error: "Error al generar usuarios sintéticos" }
  }
}

/**
 * Obtener análisis de clusters para preview
 */
export async function getClusterAnalysisAction() {
  const user = await getCurrentUser()

  if (!user || user.role !== "admin") {
    return { error: "No autorizado" }
  }

  try {
    const analysis = await analyzeUsersForSyntheticsAction()
    return analysis
  } catch (error) {
    console.error("[v0] Error getting cluster analysis:", error)
    return { error: "Error al obtener análisis" }
  }
}
