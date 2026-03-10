"use server"

// Pagos vía Stripe eliminados - usar flujo manual de pagos (BRE-B, Bancolombia, Giros)
export async function createCheckoutSession(_productId: string): Promise<{ url: string | null }> {
  return { url: null }
}

export async function createBillingPortalSession(): Promise<{ url: string | null }> {
  return { url: null }
}

export async function cancelSubscription(): Promise<{ success: boolean }> {
  return { success: false }
}

