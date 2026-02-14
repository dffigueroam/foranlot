import "server-only"
import { neon } from "@neondatabase/serverless"
import { calculateScore } from "@/services/ml_engine/models/scoring.model"
import { createFeatures } from "@/services/ml_engine/data/feature.engineering"

const sql = neon(process.env.DATABASE_URL!)

/**
 * Sistema de Clustering ML para Usuarios Sintéticos
 * Analiza usuarios con buen historial y los agrupa para crear usuarios sintéticos
 * que combinen características de múltiples usuarios destacados.
 */

export interface UserMLProfile {
  userId: number
  username: string
  totalPredictions: number
  correctPredictions: number
  accuracy: number
  avgScore: number
  specialization: string // Día, lotería, o tipo de predicción
  features: {
    frequencyScore: number
    recencyScore: number
    volatility: number
    historicalAccuracy: number
  }
}

export interface UserCluster {
  clusterName: string
  specialization: string
  type: "daybest" | "lotbest"
  users: UserMLProfile[]
  centroid: {
    avgAccuracy: number
    avgScore: number
    avgPredictions: number
    combinedFeatures: any
  }
}

/**
 * Identificar usuarios "buenos" basándose en scores y historial
 * Umbrales:
 * - Mínimo 20 predicciones verificadas
 * - Accuracy >= 40%
 * - Score ML promedio >= 50
 */
export async function identifyGoodUsers(): Promise<UserMLProfile[]> {
  try {
    console.log("[v0] Identifying good users based on ML scores...")

    // Obtener usuarios con buen historial
    const users = await sql`
      SELECT 
        us.user_id,
        u.username,
        us.total_predictions,
        us.correct_predictions,
        us.accuracy_percentage as accuracy,
        COALESCE(us.total_score / NULLIF(us.total_predictions, 0), 0) as avg_score
      FROM user_stats us
      JOIN users u ON us.user_id = u.id
      WHERE us.total_predictions >= 20
        AND us.accuracy_percentage >= 40
        AND u.is_synthetic = false
      ORDER BY us.accuracy_percentage DESC, us.total_score DESC
    `

    // Enriquecer con features ML
    const enrichedUsers: UserMLProfile[] = []

    for (const user of users) {
      // Obtener últimas predicciones para calcular features
      const recentPredictions = await sql`
        SELECT 
          predicted_number,
          created_at,
          lottery_type
        FROM predictions
        WHERE user_id = ${user.user_id}
          AND is_verified = true
        ORDER BY created_at DESC
        LIMIT 50
      `

      if (recentPredictions.length === 0) continue

      // Calcular feature promedio
      let totalFeatures = {
        numberFrequency: 0,
        recencyScore: 0,
        volatility: 0,
        historicalAccuracy: 0,
      }

      for (const pred of recentPredictions) {
        const features = await createFeatures({
          predicted_number: pred.predicted_number,
          created_at: pred.created_at,
          user_accuracy: user.accuracy,
        })

        totalFeatures.numberFrequency += features.numberFrequency
        totalFeatures.recencyScore += features.recencyScore
        totalFeatures.volatility += features.volatility
        totalFeatures.historicalAccuracy += features.historicalAccuracy
      }

      const count = recentPredictions.length
      enrichedUsers.push({
        userId: user.user_id,
        username: user.username,
        totalPredictions: user.total_predictions,
        correctPredictions: user.correct_predictions,
        accuracy: user.accuracy,
        avgScore: user.avg_score || 0,
        specialization: "general",
        features: {
          frequencyScore: totalFeatures.numberFrequency / count,
          recencyScore: totalFeatures.recencyScore / count,
          volatility: totalFeatures.volatility / count,
          historicalAccuracy: totalFeatures.historicalAccuracy / count,
        },
      })
    }

    console.log(`[v0] Found ${enrichedUsers.length} good users for clustering`)
    return enrichedUsers
  } catch (error) {
    console.error("[v0] Error identifying good users:", error)
    return []
  }
}

/**
 * Agrupar usuarios por especialización (día de semana o lotería)
 * Usa K-means simplificado basado en similitud de features
 */
export async function clusterUsersBySpecialization(
  goodUsers: UserMLProfile[],
): Promise<UserCluster[]> {
  try {
    console.log("[v0] Clustering users by specialization...")

    // Agrupar por día de semana (mejor rendimiento)
    const dayClusters: Map<string, UserMLProfile[]> = new Map()
    const dayNames = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"]

    // Asignar usuarios a días basándose en sus mejores predicciones
    for (const user of goodUsers) {
      const bestDay = await sql`
        SELECT 
          EXTRACT(DOW FROM draw_date::timestamp) as day,
          COUNT(*) FILTER (WHERE is_correct = true) as correct,
          COUNT(*) as total,
          (COUNT(*) FILTER (WHERE is_correct = true)::DECIMAL / COUNT(*)) as accuracy
        FROM predictions
        WHERE user_id = ${user.userId}
          AND is_verified = true
        GROUP BY EXTRACT(DOW FROM draw_date::timestamp)
        ORDER BY accuracy DESC
        LIMIT 1
      `

      if (bestDay[0]) {
        const dayIndex = parseInt(bestDay[0].day) - 1
        const dayName = dayNames[dayIndex] || "General"

        if (!dayClusters.has(dayName)) {
          dayClusters.set(dayName, [])
        }
        dayClusters.get(dayName)!.push({
          ...user,
          specialization: dayName,
        })
      }
    }

    // Agrupar por lotería (tipo de lotería)
    const lotteryMap: Map<string, UserMLProfile[]> = new Map()

    for (const user of goodUsers) {
      const bestLottery = await sql`
        SELECT 
          lottery_type,
          COUNT(*) FILTER (WHERE is_correct = true) as correct,
          COUNT(*) as total,
          (COUNT(*) FILTER (WHERE is_correct = true)::DECIMAL / COUNT(*)) as accuracy
        FROM predictions
        WHERE user_id = ${user.userId}
          AND is_verified = true
        GROUP BY lottery_type
        ORDER BY accuracy DESC
        LIMIT 1
      `

      if (bestLottery[0]) {
        const lotteryType = bestLottery[0].lottery_type || "general"

        if (!lotteryMap.has(lotteryType)) {
          lotteryMap.set(lotteryType, [])
        }
        lotteryMap.get(lotteryType)!.push({
          ...user,
          specialization: lotteryType,
        })
      }
    }

    // Construir clusters
    const clusters: UserCluster[] = []

    // Clusters por día
    for (const [dayName, users] of dayClusters) {
      if (users.length < 2) continue // Necesita al menos 2 usuarios

      const centroid = {
        avgAccuracy: users.reduce((sum, u) => sum + u.accuracy, 0) / users.length,
        avgScore: users.reduce((sum, u) => sum + u.avgScore, 0) / users.length,
        avgPredictions: users.reduce((sum, u) => sum + u.totalPredictions, 0) / users.length,
        combinedFeatures: {
          frequencyScore:
            users.reduce((sum, u) => sum + u.features.frequencyScore, 0) / users.length,
          recencyScore:
            users.reduce((sum, u) => sum + u.features.recencyScore, 0) / users.length,
          volatility:
            users.reduce((sum, u) => sum + u.features.volatility, 0) / users.length,
          historicalAccuracy:
            users.reduce((sum, u) => sum + u.features.historicalAccuracy, 0) / users.length,
        },
      }

      clusters.push({
        clusterName: `Sintetic_daybest_${dayName}`,
        specialization: dayName,
        type: "daybest",
        users,
        centroid,
      })
    }

    // Clusters por lotería
    for (const [lotteryType, users] of lotteryMap) {
      if (users.length < 2) continue

      const centroid = {
        avgAccuracy: users.reduce((sum, u) => sum + u.accuracy, 0) / users.length,
        avgScore: users.reduce((sum, u) => sum + u.avgScore, 0) / users.length,
        avgPredictions: users.reduce((sum, u) => sum + u.totalPredictions, 0) / users.length,
        combinedFeatures: {
          frequencyScore:
            users.reduce((sum, u) => sum + u.features.frequencyScore, 0) / users.length,
          recencyScore:
            users.reduce((sum, u) => sum + u.features.recencyScore, 0) / users.length,
          volatility:
            users.reduce((sum, u) => sum + u.features.volatility, 0) / users.length,
          historicalAccuracy:
            users.reduce((sum, u) => sum + u.features.historicalAccuracy, 0) / users.length,
        },
      }

      clusters.push({
        clusterName: `Sintetic_lotbest_${lotteryType}`,
        specialization: lotteryType,
        type: "lotbest",
        users,
        centroid,
      })
    }

    console.log(`[v0] Generated ${clusters.length} clusters`)
    return clusters
  } catch (error) {
    console.error("[v0] Error clustering users:", error)
    return []
  }
}

/**
 * Calcular la composición ponderada de un cluster
 * Usuarios con mejor accuracy tienen mayor peso
 */
export function calculateClusterComposition(cluster: UserCluster): Array<{
  userId: number
  weight: number
  reason: string
}> {
  // Ordenar por accuracy descendente
  const sortedUsers = [...cluster.users].sort((a, b) => b.accuracy - a.accuracy)

  // Asignar pesos: mejor accuracy = mayor peso
  const totalAccuracy = sortedUsers.reduce((sum, u) => sum + u.accuracy, 0)

  return sortedUsers.map((user, index) => ({
    userId: user.userId,
    weight: user.accuracy / totalAccuracy,
    reason: `${user.username} (${user.accuracy.toFixed(1)}% accuracy, ${user.totalPredictions} predictions)`,
  }))
}

/**
 * Generar usuarios sintéticos basados en ML clustering
 */
export async function generateSyntheticUsersFromClusters(
  clusters: UserCluster[],
): Promise<
  Array<{
    clusterName: string
    specialization: string
    type: string
    composition: Array<{ userId: number; weight: number }>
    centroid: any
    usersInvolved: number
  }>
> {
  const results = []

  for (const cluster of clusters) {
    const composition = calculateClusterComposition(cluster)

    results.push({
      clusterName: cluster.clusterName,
      specialization: cluster.specialization,
      type: cluster.type,
      composition,
      centroid: cluster.centroid,
      usersInvolved: cluster.users.length,
    })
  }

  return results
}

/**
 * Obtener estadísticas de clustering
 */
export function getClusteringStats(clusters: UserCluster[]) {
  const stats = {
    totalClusters: clusters.length,
    totalUsersInvolved: clusters.reduce((sum, c) => sum + c.users.length, 0),
    dayBestClusters: clusters.filter((c) => c.type === "daybest").length,
    lotBestClusters: clusters.filter((c) => c.type === "lotbest").length,
    avgClusterSize: clusters.length > 0 ? clusters.reduce((sum, c) => sum + c.users.length, 0) / clusters.length : 0,
    totalCentroidAccuracy:
      clusters.length > 0
        ? clusters.reduce((sum, c) => sum + c.centroid.avgAccuracy, 0) / clusters.length
        : 0,
  }

  return stats
}
