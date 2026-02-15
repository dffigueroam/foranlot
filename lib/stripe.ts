import "server-only"
import Stripe from "stripe"

// Proporcionar una clave dummy para desarrollo si no está configurada
const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_dummy"

if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV === "production") {
  throw new Error("STRIPE_SECRET_KEY is not configured")
}

export const stripe = new Stripe(stripeKey)
