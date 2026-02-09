"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import {
  getSlotPrices,
  getUserPurchasedSlots,
  type SlotPrice,
  type PurchasedSlot,
} from "@/lib/contracts"
import { stripe } from "@/lib/stripe"

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
 * Crea un Stripe Checkout Session
 */
export async function purchaseSlotAction(
  slotType: "synthetic" | "organic",
  billingPeriod: "monthly" | "yearly"
): Promise<{
  success: boolean
  checkoutUrl?: string
  error?: string
}> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "No autenticado" }
    }

    if (!user.is_premium) {
      return { success: false, error: "Debes ser usuario premium para comprar slots adicionales" }
    }

    // Obtener precio del slot según tipo y período
    const prices = await getSlotPrices()
    const priceInfo = prices.find(
      (p) => p.slotType === slotType && p.billingPeriod === billingPeriod
    )

    if (!priceInfo) {
      return { success: false, error: "Precio no encontrado" }
    }

    if (!priceInfo.stripePriceId) {
      return {
        success: false,
        error: "Precio de Stripe no configurado. Contacta al administrador.",
      }
    }

    // Crear Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: billingPeriod === "monthly" ? "subscription" : "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceInfo.stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id.toString(),
        slotType: slotType,
        billingPeriod: billingPeriod,
        type: "contract_slot_purchase",
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/contracts?slot_purchase=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/contracts?slot_purchase=cancelled`,
      customer_email: user.email,
    })

    if (!session.url) {
      return { success: false, error: "Error al crear sesión de pago" }
    }

    console.log(
      `[v0] Created slot purchase checkout for user ${user.id}: ${slotType} ${billingPeriod}`
    )

    return {
      success: true,
      checkoutUrl: session.url,
    }
  } catch (error) {
    console.error("[v0] Error creating slot purchase checkout:", error)
    return { success: false, error: "Error al iniciar proceso de compra" }
  }
}
