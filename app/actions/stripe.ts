"use server"

import { stripe } from "@/lib/stripe"
import { MEMBERSHIP_PRODUCTS } from "@/lib/products"
import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"
import { headers } from "next/headers"

const sql = neon(process.env.DATABASE_URL!)

export async function createCheckoutSession(productId: string) {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Usuario no autenticado")
  }

  const product = MEMBERSHIP_PRODUCTS.find((p) => p.id === productId)
  if (!product) {
    throw new Error(`Producto con id "${productId}" no encontrado`)
  }

  const interval = productId.includes("yearly") ? "year" : "month"
  const plan = interval === "year" ? "annual" : "monthly"

  const headersList = await headers()
  const origin = headersList.get("origin") || "http://localhost:3000"

  // Crear o reutilizar customer de Stripe
  let customerId = user.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        userId: user.id.toString(),
      },
    })
    customerId = customer.id

    // Actualizar usuario con customer ID
    await sql`
      UPDATE users
      SET stripe_customer_id = ${customerId}
      WHERE id = ${user.id}
    `
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceInCents,
          recurring: {
            interval: interval,
          },
        },
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${origin}/dashboard?success=true`,
    cancel_url: `${origin}/pricing?canceled=true`,
    metadata: {
      userId: user.id.toString(),
      plan: plan,
    },
  })

  return { url: session.url }
}

export async function createBillingPortalSession() {
  const user = await getCurrentUser()

  if (!user || !user.stripe_customer_id) {
    throw new Error("Usuario no tiene customer ID de Stripe")
  }

  const headersList = await headers()
  const origin = headersList.get("origin") || "http://localhost:3000"

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: `${origin}/dashboard`,
  })

  return { url: session.url }
}

export async function cancelSubscription() {
  const user = await getCurrentUser()

  if (!user || !user.subscription_status) {
    throw new Error("Usuario no tiene suscripción activa")
  }

  const result = await sql`
    SELECT stripe_subscription_id FROM memberships
    WHERE user_id = ${user.id} AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1
  `

  if (result.length === 0) {
    throw new Error("No se encontró suscripción activa")
  }

  const subscriptionId = (result[0] as any).stripe_subscription_id

  // Cancelar al final del período actual
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })

  await sql`
    UPDATE memberships
    SET cancel_at_period_end = true, updated_at = CURRENT_TIMESTAMP
    WHERE stripe_subscription_id = ${subscriptionId}
  `

  return { success: true }
}
