import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import { purchaseContractSlot } from "@/lib/contracts"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

// Evita que Next.js intente evaluar esto en build
export const dynamic = "force-dynamic"

/**
 * Webhook de Stripe para procesar pagos de slots adicionales de contratos
 * Eventos manejados:
 * - checkout.session.completed: Pago único o suscripción exitosa
 * - invoice.paid: Renovación de suscripción mensual
 * - customer.subscription.deleted: Cancelación de suscripción (desactivar slots)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = (await headers()).get("stripe-signature")

    if (!signature) {
      console.error("[stripe-slots-webhook] No signature header")
      return NextResponse.json({ error: "No signature" }, { status: 400 })
    }

    // Verificar firma del webhook
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET_SLOTS!
      )
    } catch (err: any) {
      console.error("[stripe-slots-webhook] Signature verification failed:", err.message)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    console.log(`[stripe-slots-webhook] Event type: ${event.type}`)

    // Manejar eventos de Stripe
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        // Verificar que sea una compra de slot
        if (session.metadata?.type !== "contract_slot_purchase") {
          console.log("[stripe-slots-webhook] Not a slot purchase, ignoring")
          return NextResponse.json({ received: true })
        }

        const userId = parseInt(session.metadata.userId || "0")
        const slotType = session.metadata.slotType as "synthetic" | "organic"
        const billingPeriod = session.metadata.billingPeriod as "monthly" | "yearly"

        if (!userId || !slotType || !billingPeriod) {
          console.error("[stripe-slots-webhook] Missing metadata:", session.metadata)
          return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
        }

        // Obtener detalles del pago
        const paymentIntentId = session.payment_intent as string
        const subscriptionId = session.subscription as string | undefined
        const amountTotal = session.amount_total || 0

        // Registrar compra en la base de datos
        const result = await purchaseContractSlot(
          userId,
          slotType,
          1, // Cantidad: siempre 1 slot por compra
          amountTotal,
          paymentIntentId,
          subscriptionId,
          billingPeriod
        )

        if (!result.success) {
          console.error("[stripe-slots-webhook] Error registering purchase:", result.error)
          return NextResponse.json(
            { error: "Failed to register purchase" },
            { status: 500 }
          )
        }

        console.log(
          `[stripe-slots-webhook] Successfully registered slot purchase: ${slotType} ${billingPeriod} for user ${userId}`
        )

        break
      }

      case "invoice.paid": {
        // Renovación de suscripción mensual
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (!subscriptionId) {
          console.log("[stripe-slots-webhook] No subscription in invoice, ignoring")
          return NextResponse.json({ received: true })
        }

        // Recuperar suscripción para obtener metadata
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        if (subscription.metadata?.type !== "contract_slot_purchase") {
          console.log("[stripe-slots-webhook] Not a slot subscription, ignoring")
          return NextResponse.json({ received: true })
        }

        const userId = parseInt(subscription.metadata.userId || "0")
        const slotType = subscription.metadata.slotType as "synthetic" | "organic"
        const billingPeriod = subscription.metadata.billingPeriod as "monthly" | "yearly"

        if (!userId || !slotType || !billingPeriod) {
          console.error("[stripe-slots-webhook] Missing subscription metadata:", subscription.metadata)
          return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
        }

        // Registrar renovación como nueva compra
        const result = await purchaseContractSlot(
          userId,
          slotType,
          1,
          invoice.amount_paid,
          invoice.payment_intent as string,
          subscriptionId,
          billingPeriod
        )

        if (!result.success) {
          console.error("[stripe-slots-webhook] Error registering renewal:", result.error)
          return NextResponse.json(
            { error: "Failed to register renewal" },
            { status: 500 }
          )
        }

        console.log(
          `[stripe-slots-webhook] Successfully registered slot renewal for user ${userId}`
        )

        break
      }

      case "customer.subscription.deleted": {
        // Usuario canceló la suscripción
        // Nota: Los slots existentes seguirán activos hasta su valid_until
        // El cron job deactivate_expired_slots() los desactivará cuando expire el período pagado
        const subscription = event.data.object as Stripe.Subscription

        console.log(
          `[stripe-slots-webhook] Subscription ${subscription.id} deleted - slots will expire naturally`
        )

        break
      }

      default:
        console.log(`[stripe-slots-webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[stripe-slots-webhook] Error processing webhook:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
