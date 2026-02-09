import "server-only"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

/**
 * Sistema de generación de usuarios sintéticos (AI expertos)
 * Se ejecuta cada 15 de mes para crear perfiles especializados por día o lotería
 * Requiere aprobación del admin antes de activar o actualizar composición.
 */

interface SyntheticUserProfile {
  username: string
  type: "daybest" | "lotbest"
  specialization: string  // Día de semana o nombre de lotería
  baseAccuracy: number
  contributionWeight: number
  recurrenceWeight: number
  consistencyWeight: number
}

interface PendingCompositionEntry {
  organicUserId: number
  weight: number
}

async function createPendingUpdate(
  syntheticUserId: number,
  proposedName: string,
  type: "daybest" | "lotbest",
  specialization: string,
  composition: PendingCompositionEntry[],
) {
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
      ${proposedName},
      ${type},
      ${specialization},
      'pending',
      CURRENT_TIMESTAMP
    )
    RETURNING id
  `

  const updateId = update[0]?.id
  if (!updateId) return null

  for (const entry of composition) {
    await sql`
      INSERT INTO synthetic_user_pending_composition (
        update_id,
        organic_user_id,
        weight_contribution,
        created_at
      ) VALUES (
        ${updateId},
        ${entry.organicUserId},
        ${entry.weight},
        CURRENT_TIMESTAMP
      )
    `
  }

  return updateId
}

async function findSyntheticUser(type: "daybest" | "lotbest", specialization: string) {
  const existing = await sql`
    SELECT id, is_synthetic, is_synthetic_pending
    FROM users
    WHERE synthetic_type = ${type}
      AND synthetic_specialization = ${specialization}
    LIMIT 1
  `

  return existing[0] || null
}

async function createPendingSyntheticUser(
  proposedName: string,
  type: "daybest" | "lotbest",
  specialization: string,
) {
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
      ${proposedName},
      ${`${proposedName}@lotiq.ai`},
      ${'synthetic_password_hash_not_usable'},
      false,
      true,
      ${type},
      ${specialization},
      CURRENT_TIMESTAMP
    )
    RETURNING id
  `

  return created[0]?.id as number
}

/**
 * Generar usuarios Sintetic_daybest (1 por día de semana)
 * Basado en mejores usuarios orgánicos de cada día
 */
export async function generateDayBestSynthetics(month: string, year: string) {
  const weekDays = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"]
  const generatedUsers: Array<{ username: string; userId: number }> = []

  for (let dayIndex = 0; dayIndex < weekDays.length; dayIndex++) {
    const dayName = weekDays[dayIndex]
    
    // Encontrar usuarios orgánicos con buen rendimiento en este día
    const topUsersForDay = await sql`
      SELECT 
        p.user_id,
        u.username,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE p.is_correct = true) as correct,
        (COUNT(*) FILTER (WHERE p.is_correct = true)::DECIMAL / COUNT(*)) as accuracy
      FROM predictions p
      JOIN users u ON p.user_id = u.id
      WHERE EXTRACT(DOW FROM p.draw_date::timestamp) = ${dayIndex + 1}
        AND p.is_verified = true
        AND u.is_synthetic = false
      GROUP BY p.user_id, u.username
      HAVING COUNT(*) >= 10
      ORDER BY accuracy DESC, correct DESC
      LIMIT 3
    `

    if (topUsersForDay.length === 0) {
      console.log(`[v0] No hay datos suficientes para ${dayName}, saltando...`)
      continue
    }

    const proposedName = `Sintetic_daybest_${dayName}`
    const specialization = dayName

    let syntheticUserId: number
    const existing = await findSyntheticUser("daybest", specialization)

    if (existing) {
      syntheticUserId = existing.id
    } else {
      const byName = await sql`
        SELECT id FROM users WHERE username = ${proposedName} LIMIT 1
      `

      if (byName[0]?.id) {
        syntheticUserId = byName[0].id
        await sql`
          UPDATE users
          SET synthetic_type = 'daybest', synthetic_specialization = ${specialization}
          WHERE id = ${syntheticUserId}
        `
      } else {
        syntheticUserId = await createPendingSyntheticUser(proposedName, "daybest", specialization)
      }
    }

    const composition: PendingCompositionEntry[] = topUsersForDay.map((u: any) => ({
      organicUserId: u.user_id,
      weight: 1.0 / topUsersForDay.length,
    }))

    await createPendingUpdate(
      syntheticUserId,
      proposedName,
      "daybest",
      specialization,
      composition,
    )

    generatedUsers.push({ username: proposedName, userId: syntheticUserId })
  }

  return generatedUsers
}

/**
 * Generar usuarios Sintetic_lotbest (1 por lotería)
 * Basado en mejores usuarios orgánicos de cada lotería
 */
export async function generateLotBestSynthetics(month: string, year: string) {
  // Obtener todas las loterías activas
  const lotteries = await sql`
    SELECT DISTINCT lottery_name 
    FROM lottery_results 
    ORDER BY lottery_name
  `

  const generatedUsers: Array<{ username: string; userId: number }> = []

  for (const lottery of lotteries as any[]) {
    const lotteryName = lottery.lottery_name

    // Encontrar usuarios orgánicos con buen rendimiento en esta lotería
    const topUsersForLottery = await sql`
      SELECT 
        p.user_id,
        u.username,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE p.is_correct = true) as correct,
        (COUNT(*) FILTER (WHERE p.is_correct = true)::DECIMAL / COUNT(*)) as accuracy
      FROM predictions p
      JOIN users u ON p.user_id = u.id
      WHERE p.lottery_name = ${lotteryName}
        AND p.is_verified = true
        AND u.is_synthetic = false
      GROUP BY p.user_id, u.username
      HAVING COUNT(*) >= 10
      ORDER BY accuracy DESC, correct DESC
      LIMIT 3
    `

    if (topUsersForLottery.length === 0) {
      console.log(`[v0] No hay datos suficientes para ${lotteryName}, saltando...`)
      continue
    }

    const cleanLotteryName = String(lotteryName)
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "")

    const proposedName = `Sintetic_lotbest_${cleanLotteryName}`
    const specialization = lotteryName

    let syntheticUserId: number
    const existing = await findSyntheticUser("lotbest", specialization)

    if (existing) {
      syntheticUserId = existing.id
    } else {
      const byName = await sql`
        SELECT id FROM users WHERE username = ${proposedName} LIMIT 1
      `

      if (byName[0]?.id) {
        syntheticUserId = byName[0].id
        await sql`
          UPDATE users
          SET synthetic_type = 'lotbest', synthetic_specialization = ${specialization}
          WHERE id = ${syntheticUserId}
        `
      } else {
        syntheticUserId = await createPendingSyntheticUser(proposedName, "lotbest", specialization)
      }
    }

    const composition: PendingCompositionEntry[] = topUsersForLottery.map((u: any) => ({
      organicUserId: u.user_id,
      weight: 1.0 / topUsersForLottery.length,
    }))

    await createPendingUpdate(
      syntheticUserId,
      proposedName,
      "lotbest",
      specialization,
      composition,
    )

    generatedUsers.push({ username: proposedName, userId: syntheticUserId })
  }

  return generatedUsers
}

/**
 * Ejecutar generación completa (día 15 de cada mes)
 */
export async function generateMonthlySynthetics(force = false) {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = String(now.getFullYear())

  if (!force && now.getDate() !== 15) {
    return {
      success: false,
      error: "La generación automática solo está permitida el día 15",
      dayBestUsers: [],
      lotBestUsers: [],
      total: 0,
    }
  }

  console.log(`[v0] Generando usuarios sintéticos para ${year}-${month}`)

  // Generar usuarios por día de semana
  const dayBestUsers = await generateDayBestSynthetics(month, year)
  console.log(`[v0] Generados ${dayBestUsers.length} usuarios Sintetic_daybest`)

  // Generar usuarios por lotería
  const lotBestUsers = await generateLotBestSynthetics(month, year)
  console.log(`[v0] Generados ${lotBestUsers.length} usuarios Sintetic_lotbest`)

  return {
    success: true,
    dayBestUsers,
    lotBestUsers,
    total: dayBestUsers.length + lotBestUsers.length,
  }
}

/**
 * Obtener composición de un usuario sintético
 */
export async function getSyntheticComposition(syntheticUserId: number) {
  try {
    const composition = await sql`
      SELECT 
        suc.organic_user_id,
        u.username,
        suc.weight_contribution,
        suc.created_at
      FROM synthetic_user_composition suc
      JOIN users u ON suc.organic_user_id = u.id
      WHERE suc.synthetic_user_id = ${syntheticUserId}
      ORDER BY suc.weight_contribution DESC
    `

    return composition.map((c: any) => ({
      userId: c.organic_user_id,
      username: c.username,
      weight: parseFloat(c.weight_contribution),
      createdAt: c.created_at,
    }))
  } catch (error) {
    console.error("[v0] Error getting synthetic composition:", error)
    return []
  }
}
