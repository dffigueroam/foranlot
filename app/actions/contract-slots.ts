"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import {
  getSlotPrices,
  getUserPurchasedSlots,
  type SlotPrice,
  type PurchasedSlot,
} from "@/lib/contracts"
/**
 * Obtener precios de slots disponibles
 */
export async function getPricesAction(): Promise<{
  success: boolean
  data?: SlotPrice[]
  error?: string
}> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "No autenticado" }
    }

    if (!user.is_premium) {
      return { success: false, error: "Debes ser usuario premium" }
    }

    const prices = await getSlotPrices()

    return {
      success: true,
      data: prices,
    }
  } catch (error) {
    console.error("[v0] Error getting slot prices:", error)
    return { success: false, error: "Error al obtener precios" }
  }
}

/**
 * Obtener historial de slots comprados por el usuario actual
 */
export async function getMyPurchasedSlotsAction(): Promise<{
  success: boolean
  data?: PurchasedSlot[]
  error?: string
}> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "No autenticado" }
    }

    if (!user.is_premium) {
      return { success: false, error: "Debes ser usuario premium" }
    }

    const slots = await getUserPurchasedSlots(user.id)

    return {
      success: true,
      data: slots,
    }
  } catch (error) {
    console.error("[v0] Error getting purchased slots:", error)
    return { success: false, error: "Error al obtener slots comprados" }
  }
}

/**
 * Iniciar proceso de compra de slot adicional
 * Por ahora retorna error ya que los pagos en línea no están disponibles.
 * Contactar al administrador para adquirir slots adicionales.
 */
export async function purchaseSlotAction(
  _slotType: "synthetic" | "organic",
  _billingPeriod: "monthly" | "yearly"
): Promise<{
  success: boolean
  checkoutUrl?: string
  error?: string
}> {
  return {
    success: false,
    error: "Pagos en línea no disponibles. Contacta al administrador para adquirir slots adicionales.",
  }
}
