import "server-only"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

/**
 * Sistema mejorado de contratos premium con renovación automática
 * 
 * LÍMITES:
 * - Sintéticos: 1 contrato activo por mes
 * - Orgánicos: 2 contratos activos por mes
 * 
 * RENOVACIÓN:
 * - Automática si hay créditos disponibles
 * - Ventana: 0-9 AM del día siguiente al vencimiento
 */

export interface ContractLimits {
  syntheticLimit: number  // Base + comprados
  organicLimit: number    // Base + comprados
  syntheticBase: number   // 1
  organicBase: number     // 2
  syntheticPurchased: number // Slots adicionales comprados
  organicPurchased: number   // Slots adicionales comprados
  syntheticActive: number
  organicActive: number
  canAddSynthetic: boolean
  canAddOrganic: boolean
}

export interface ContractRenewalInfo {
  selectionId: number
  subscriberId: number
  username: string
  email: string
  expiryDate: string
  daysUntilExpiry: number
  availableCredits: number
  canAutoRenew: boolean
  contractDuration: string
  isSynthetic: boolean
}

/**
 * Contar suscriptores activos de un usuario
 */
export async function getActiveSubscribersCount(userId: number) {
  const result = await sql` SELECT COUNT(*)::int AS total 
  FROM user_selections WHERE selected_user_id = ${userId} AND is_active = true`
  return result[0]?.total ?? 0
}

/**
 * Verificar límites de contratos del usuario (incluyendo slots comprados)
 */
export async function getContractLimits(userId: number): Promise<ContractLimits> {
  try {
    const result = await sql`
      SELECT * FROM get_user_contract_limits(${userId})
    `

    if (result.length === 0) {
      return {
        syntheticBase: 1,
        organicBase: 2,
        syntheticPurchased: 0,
        organicPurchased: 0,
        syntheticLimit: 1,
        organicLimit: 2,
        syntheticActive: 0,
        organicActive: 0,
        canAddSynthetic: true,
        canAddOrganic: true,
      }
    }

    const limits = result[0] as any

    return {
      syntheticBase: parseInt(limits.synthetic_base || 1),
      organicBase: parseInt(limits.organic_base || 2),
      syntheticPurchased: parseInt(limits.synthetic_purchased || 0),
      organicPurchased: parseInt(limits.organic_purchased || 0),
      syntheticLimit: parseInt(limits.synthetic_total || 1),
      organicLimit: parseInt(limits.organic_total || 2),
      syntheticActive: parseInt(limits.synthetic_active_contracts || 0),
      organicActive: parseInt(limits.organic_active_contracts || 0),
      canAddSynthetic: Boolean(limits.can_add_synthetic),
      canAddOrganic: Boolean(limits.can_add_organic),
    }
  } catch (error) {
    console.error("[v0] Error getting contract limits:", error)
    return {
      syntheticBase: 1,
      organicBase: 2,
      syntheticPurchased: 0,
      organicPurchased: 0,
      syntheticLimit: 1,
      organicLimit: 2,
      syntheticActive: 0,
      organicActive: 0,
      canAddSynthetic: true,
      canAddOrganic: true,
    }
  }
}

/**
 * Crear nuevo contrato con verificación de límites
 */
export async function createContract(
  subscriberId: number,
  targetUserId: number,
  lotteryType: string,
  contractDuration: "weekly" | "monthly" = "weekly"
): Promise<{ success: boolean; error?: string; selectionId?: number }> {
  try {
    // 1. Verificar si el usuario objetivo es sintético
    const targetUser = await sql`
      SELECT id, username, is_synthetic
      FROM users
      WHERE id = ${targetUserId}
    `

    if (targetUser.length === 0) {
      return { success: false, error: "Usuario no encontrado" }
    }

    const isSynthetic = targetUser[0].is_synthetic

    // 2. Verificar límites
    const limits = await getContractLimits(subscriberId)

    if (isSynthetic && !limits.canAddSynthetic) {
      return {
        success: false,
        error: `Ya tienes ${limits.syntheticActive} contrato(s) con usuarios sintéticos este mes. Límite: ${limits.syntheticLimit}`,
      }
    }

    if (!isSynthetic && !limits.canAddOrganic) {
      return {
        success: false,
        error: `Ya tienes ${limits.organicActive} contrato(s) con usuarios orgánicos este mes. Límite: ${limits.organicLimit}`,
      }
    }

    // 3. Calcular créditos necesarios
    const durationDays = contractDuration === "weekly" ? 7 : 30
    const creditsNeeded = durationDays * 1 // 1 crédito por día

    // 4. Verificar créditos disponibles
    const credits = await sql`
      SELECT available_credits
      FROM user_credits
      WHERE user_id = ${subscriberId}
    `

    if (credits.length === 0 || credits[0].available_credits < creditsNeeded) {
      return {
        success: false,
        error: `Créditos insuficientes. Necesitas ${creditsNeeded}, tienes ${credits[0]?.available_credits || 0}`,
      }
    }

    // 5. Crear contrato
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + durationDays)

    const result = await sql`
      INSERT INTO user_selections (
        subscriber_id,
        selection_type,
        selected_user_id,
        lottery_type,
        credits_per_day,
        start_date,
        expiry_date,
        is_active,
        contract_duration,
        is_synthetic_target,
        auto_renew
      )
      VALUES (
        ${subscriberId},
        'user',
        ${targetUserId},
        ${lotteryType},
        1,
        CURRENT_DATE,
        ${expiryDate.toISOString().split('T')[0]},
        true,
        ${contractDuration},
        ${isSynthetic},
        true
      )
      RETURNING id
    `

    const selectionId = result[0].id

    // 6. Crear notificación de contrato creado
    await sql`
      INSERT INTO notifications (
        user_id,
        notification_type,
        title,
        message,
        related_selection_id
      )
      VALUES (
        ${subscriberId},
        'contract_created',
        'Contrato activado',
        ${`Contrato ${contractDuration === 'weekly' ? 'semanal' : 'mensual'} con ${targetUser[0].username} activo hasta ${expiryDate.toLocaleDateString('es-CO')}`},
        ${selectionId}
      )
    `

    return { success: true, selectionId }

  } catch (error: any) {
    console.error("[v0] Error creating contract:", error)
    return { success: false, error: error?.message || "Error al crear contrato" }
  }
}

/**
 * Obtener contratos que están por vencer (para notificaciones)
 */
export async function getExpiringContracts(daysBefore: number = 1): Promise<ContractRenewalInfo[]> {
  try {
    const result = await sql`
      SELECT 
        s.id as selection_id,
        s.subscriber_id,
        u.username,
        u.email,
        s.expiry_date,
        (s.expiry_date - CURRENT_DATE)::INTEGER as days_until_expiry,
        uc.available_credits,
        (s.auto_renew AND uc.available_credits >= s.credits_per_day * 7) as can_auto_renew,
        s.contract_duration,
        s.is_synthetic_target as is_synthetic
      FROM user_selections s
      JOIN users u ON s.subscriber_id = u.id
      LEFT JOIN user_credits uc ON uc.user_id = u.id
      WHERE s.is_active = TRUE
        AND s.expiry_date IS NOT NULL
        AND s.expiry_date <= CURRENT_DATE + ${daysBefore}
        AND s.expiry_date >= CURRENT_DATE
    `

    return result.map((row: any) => ({
      selectionId: row.selection_id,
      subscriberId: row.subscriber_id,
      username: row.username,
      email: row.email,
      expiryDate: row.expiry_date,
      daysUntilExpiry: row.days_until_expiry,
      availableCredits: row.available_credits,
      canAutoRenew: row.can_auto_renew,
      contractDuration: row.contract_duration,
      isSynthetic: row.is_synthetic,
    }))
  } catch (error) {
    console.error("[v0] Error getting expiring contracts:", error)
    return []
  }
}

/**
 * Renovar contrato automáticamente
 */
export async function renewContract(selectionId: number): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Obtener datos del contrato
    const selection = await sql`
      SELECT 
        s.*,
        uc.available_credits
      FROM user_selections s
      LEFT JOIN user_credits uc ON uc.user_id = s.subscriber_id
      WHERE s.id = ${selectionId}
        AND s.is_active = TRUE
        AND s.auto_renew = TRUE
    `

    if (selection.length === 0) {
      return { success: false, error: "Contrato no encontrado o no renovable" }
    }

    const contract = selection[0]

    // 2. Calcular días según duración
    const durationDays = contract.contract_duration === 'weekly' ? 7 : 30
    const creditsNeeded = contract.credits_per_day * durationDays

    // 3. Verificar créditos
    if (contract.available_credits < creditsNeeded) {
      // Desactivar y notificar
      await sql`
        UPDATE user_selections
        SET is_active = FALSE,
            auto_renew = FALSE
        WHERE id = ${selectionId}
      `

      await sql`
        INSERT INTO notifications (
          user_id,
          notification_type,
          title,
          message,
          related_selection_id
        )
        VALUES (
          ${contract.subscriber_id},
          'contract_renewal_failed',
          'Contrato no renovado',
          'Tu contrato no pudo renovarse automáticamente por falta de créditos. Recarga para reactivarlo.',
          ${selectionId}
        )
      `

      return { success: false, error: "Créditos insuficientes para renovación" }
    }

    // 4. Renovar: extender fecha
    const newExpiryDate = new Date(contract.expiry_date)
    newExpiryDate.setDate(newExpiryDate.getDate() + durationDays)

    await sql`
      UPDATE user_selections
      SET expiry_date = ${newExpiryDate.toISOString().split('T')[0]},
          last_renewal_date = CURRENT_TIMESTAMP,
          renewal_attempts = COALESCE(renewal_attempts, 0) + 1,
          last_deduction_date = CURRENT_DATE
      WHERE id = ${selectionId}
    `

    // 5. Notificar éxito
    await sql`
      INSERT INTO notifications (
        user_id,
        notification_type,
        title,
        message,
        related_selection_id
      )
      VALUES (
        ${contract.subscriber_id},
        'contract_renewed',
        'Contrato renovado',
        ${`Tu contrato se ha renovado automáticamente hasta el ${newExpiryDate.toLocaleDateString('es-CO')}. Duración: ${durationDays} días.`},
        ${selectionId}
      )
    `

    return { success: true }

  } catch (error: any) {
    console.error("[v0] Error renewing contract:", error)
    return { success: false, error: error?.message || "Error al renovar contrato" }
  }
}

/**
 * Enviar notificaciones de vencimiento próximo
 */
export async function notifyExpiringContracts(): Promise<{ notificationsSent: number }> {
  try {
    const expiringContracts = await getExpiringContracts(1) // Contratos que vencen mañana

    let notificationsSent = 0

    for (const contract of expiringContracts) {
      // Solo notificar una vez por día
      const existingNotification = await sql`
        SELECT id FROM notifications
        WHERE user_id = ${contract.subscriberId}
          AND notification_type = 'contract_expiring_soon'
          AND related_selection_id = ${contract.selectionId}
          AND DATE(created_at) = CURRENT_DATE
      `

      if (existingNotification.length === 0) {
        await sql`
          INSERT INTO notifications (
            user_id,
            notification_type,
            title,
            message,
            related_selection_id
          )
          VALUES (
            ${contract.subscriberId},
            'contract_expiring_soon',
            'Contrato por vencer',
            ${`Tu contrato vence ${contract.daysUntilExpiry === 0 ? 'hoy' : 'mañana'}. ${contract.canAutoRenew ? 'Se renovará automáticamente.' : 'Recarga créditos para renovar.'}`},
            ${contract.selectionId}
          )
        `
        notificationsSent++
      }
    }

    return { notificationsSent }

  } catch (error) {
    console.error("[v0] Error notifying expiring contracts:", error)
    return { notificationsSent: 0 }
  }
}

/**
 * Procesar renovaciones automáticas (ejecutar entre 0-9 AM)
 */
export async function processAutomaticRenewals(): Promise<{ renewed: number; failed: number }> {
  try {
    // Obtener contratos que vencen hoy
    const expiringContracts = await getExpiringContracts(0)

    let renewed = 0
    let failed = 0

    for (const contract of expiringContracts) {
      if (contract.canAutoRenew) {
        const result = await renewContract(contract.selectionId)
        if (result.success) {
          renewed++
        } else {
          failed++
        }
      } else {
        // Desactivar contrato sin créditos
        await sql`
          UPDATE user_selections
          SET is_active = FALSE
          WHERE id = ${contract.selectionId}
        `
        failed++
      }
    }

    console.log(`[v0] Automatic renewals: ${renewed} renewed, ${failed} failed`)

    return { renewed, failed }

  } catch (error) {
    console.error("[v0] Error processing automatic renewals:", error)
    return { renewed: 0, failed: 0 }
  }
}

/**
 * Obtener precios de slots adicionales
 */
export interface SlotPrice {
  slotType: "synthetic" | "organic"
  priceCents: number
  currency: string
  billingPeriod: "monthly" | "yearly"
  stripeProductId: string | null
  stripePriceId: string | null
}

export async function getSlotPrices(): Promise<SlotPrice[]> {
  try {
    const result = await sql`
      SELECT 
        slot_type,
        price_cents,
        currency,
        billing_period,
        stripe_product_id,
        stripe_price_id
      FROM contract_slot_prices
      WHERE is_active = TRUE
      ORDER BY slot_type, billing_period
    `

    return result.map((row: any) => ({
      slotType: row.slot_type,
      priceCents: row.price_cents,
      currency: row.currency,
      billingPeriod: row.billing_period,
      stripeProductId: row.stripe_product_id,
      stripePriceId: row.stripe_price_id,
    }))
  } catch (error) {
    console.error("[v0] Error getting slot prices:", error)
    return []
  }
}

/**
 * Registrar compra de slot adicional (llamado después de pago exitoso)
 */
export async function purchaseContractSlot(
  userId: number,
  slotType: "synthetic" | "organic",
  quantity: number,
  priceCents: number,
  stripePaymentIntentId: string,
  stripeSubscriptionId?: string | null,
  billingPeriod: "monthly" | "yearly" = "monthly"
): Promise<{ success: boolean; error?: string; slotId?: number }> {
  try {
    const result = await sql`
      SELECT purchase_contract_slot(
        ${userId},
        ${slotType},
        ${quantity},
        ${priceCents},
        ${stripePaymentIntentId},
        ${stripeSubscriptionId || null},
        ${billingPeriod}
      ) as slot_id
    `

    if (result.length === 0) {
      return { success: false, error: "Error al registrar compra de slot" }
    }

    const slotId = result[0].slot_id

    console.log(`[v0] Purchased ${quantity} ${slotType} slot(s) for user ${userId}`)

    return {
      success: true,
      slotId,
    }
  } catch (error) {
    console.error("[v0] Error purchasing contract slot:", error)
    return { success: false, error: "Error al procesar compra de slot" }
  }
}

/**
 * Obtener historial de slots comprados por usuario
 */
export interface PurchasedSlot {
  id: number
  slotType: "synthetic" | "organic"
  quantity: number
  priceCents: number
  isActive: boolean
  validFrom: string
  validUntil: string | null
  createdAt: string
}

export async function getUserPurchasedSlots(userId: number): Promise<PurchasedSlot[]> {
  try {
    const result = await sql`
      SELECT 
        id,
        slot_type,
        quantity,
        price_cents,
        is_active,
        valid_from,
        valid_until,
        created_at
      FROM contract_slots_purchased
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `

    return result.map((row: any) => ({
      id: row.id,
      slotType: row.slot_type,
      quantity: row.quantity,
      priceCents: row.price_cents,
      isActive: row.is_active,
      validFrom: row.valid_from,
      validUntil: row.valid_until,
      createdAt: row.created_at,
    }))
  } catch (error) {
    console.error("[v0] Error getting purchased slots:", error)
    return []
  }
}

