import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface ManualPaymentRequest {
  id: number
  user_id: number
  plan_type: "monthly" | "annual"
  amount_cents: number
  credits_to_add: number
  payment_method: string
  receipt_url?: string
  reference_number?: string
  bank_name?: string
  payment_date?: string
  notes?: string
  status: "pending" | "approved" | "rejected"
  reviewed_by?: number
  reviewed_at?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
  username?: string
  email?: string
}

export async function createManualPaymentRequest(data: {
  userId: number
  planType: "monthly" | "annual"
  amountCents: number
  creditsToAdd: number
  paymentMethod: string
  receiptUrl?: string
  referenceNumber?: string
  bankName?: string
  paymentDate?: string
  notes?: string
}) {
  const result = await sql`
    INSERT INTO manual_payment_requests (
      user_id, plan_type, amount_cents, credits_to_add, 
      payment_method, receipt_url, reference_number, 
      bank_name, payment_date, notes
    )
    VALUES (
      ${data.userId}, ${data.planType}, ${data.amountCents}, ${data.creditsToAdd},
      ${data.paymentMethod}, ${data.receiptUrl}, ${data.referenceNumber},
      ${data.bankName}, ${data.paymentDate}, ${data.notes}
    )
    RETURNING *
  `
  return result[0]
}

export async function getPendingPaymentRequests(): Promise<ManualPaymentRequest[]> {
  const result = await sql`
    SELECT 
      mpr.*,
      u.username,
      u.email
    FROM manual_payment_requests mpr
    JOIN users u ON u.id = mpr.user_id
    WHERE mpr.status = 'pending'
    ORDER BY mpr.created_at DESC
  `
  return result as ManualPaymentRequest[]
}

export async function getUserPaymentRequests(userId: number): Promise<ManualPaymentRequest[]> {
  const result = await sql`
    SELECT * FROM manual_payment_requests
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `
  return result as ManualPaymentRequest[]
}

export async function approvePaymentRequest(requestId: number, adminId: number) {
  // Obtener detalles de la solicitud
  const request = await sql`
    SELECT * FROM manual_payment_requests
    WHERE id = ${requestId}
  `

  if (request.length === 0) {
    throw new Error("Solicitud no encontrada")
  }

  const paymentRequest = request[0] as ManualPaymentRequest

  if (paymentRequest.status !== "pending") {
    throw new Error("Esta solicitud ya fue procesada")
  }

  // Iniciar transacción
  const result = await sql`
    WITH updated_request AS (
      UPDATE manual_payment_requests
      SET status = 'approved',
          reviewed_by = ${adminId},
          reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ${requestId}
      RETURNING *
    ),
    upserted_credits AS (
      INSERT INTO user_credits (user_id, total_credits, used_credits)
      VALUES (${paymentRequest.user_id}, ${paymentRequest.credits_to_add}, 0)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        total_credits = user_credits.total_credits + ${paymentRequest.credits_to_add}
      RETURNING *
    ),
    transaction_record AS (
      INSERT INTO credit_transactions (
        user_id, amount, transaction_type, description, balance_after
      )
      SELECT 
        ${paymentRequest.user_id},
        ${paymentRequest.credits_to_add},
        'manual_purchase',
        'Compra de créditos por ' || ${paymentRequest.plan_type} || ' - Pago manual',
        (SELECT available_credits FROM user_credits WHERE user_id = ${paymentRequest.user_id})
      RETURNING *
    ),
    notification AS (
      INSERT INTO notifications (
        user_id, notification_type, title, message
      )
      VALUES (
        ${paymentRequest.user_id},
        'payment_approved',
        'Pago Aprobado',
        'Tu pago de ' || ${paymentRequest.credits_to_add} || ' créditos ha sido aprobado y está disponible.'
      )
      RETURNING *
    )
    SELECT * FROM updated_request
  `

  return result[0]
}

export async function rejectPaymentRequest(requestId: number, adminId: number, reason: string) {
  const result = await sql`
    WITH updated_request AS (
      UPDATE manual_payment_requests
      SET status = 'rejected',
          reviewed_by = ${adminId},
          reviewed_at = CURRENT_TIMESTAMP,
          rejection_reason = ${reason}
      WHERE id = ${requestId}
      RETURNING *
    ),
    notification AS (
      INSERT INTO notifications (
        user_id, notification_type, title, message
      )
      SELECT 
        user_id,
        'payment_rejected',
        'Pago Rechazado',
        'Tu solicitud de pago ha sido rechazada. Razón: ' || ${reason}
      FROM updated_request
      RETURNING *
    )
    SELECT * FROM updated_request
  `

  return result[0]
}
