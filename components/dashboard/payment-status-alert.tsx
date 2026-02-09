"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Clock, CheckCircle, XCircle } from "lucide-react"

interface PaymentRequest {
  id: number
  user_id: number
  amount?: number
  amount_cents?: number
  amountCents?: number
  status: "pending" | "approved" | "rejected"
  created_at: string
  rejection_reason?: string | null
}

interface PaymentStatusAlertProps {
  payments: PaymentRequest[]
}

export function PaymentStatusAlert({ payments }: PaymentStatusAlertProps) {
  // Filtrar solo pagos recientes (últimos 7 días)
  const recentPayments = payments.filter((p) => {
    const daysSince = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24)
    return daysSince <= 7
  })

  const pendingPayment = recentPayments.find((p) => p.status === "pending")
  const approvedPayment = recentPayments.find((p) => p.status === "approved")
  const rejectedPayment = recentPayments.find((p) => p.status === "rejected")

  if (pendingPayment) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-900">Pago en Revisión</AlertTitle>
        <AlertDescription className="text-yellow-800">
          Tu solicitud de pago está siendo revisada por un administrador. Te notificaremos cuando sea aprobada.
          <Button variant="link" size="sm" asChild className="px-0 ml-2 text-yellow-900 underline">
            <Link href="/my-payments">Ver detalles</Link>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (approvedPayment) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900">Pago Aprobado</AlertTitle>
        <AlertDescription className="text-green-800">
          Tu pago ha sido aprobado y tus créditos están disponibles. ¡Comienza a seleccionar pronósticos!
          <Button variant="link" size="sm" asChild className="px-0 ml-2 text-green-900 underline">
            <Link href="/selections">Ir a Selecciones</Link>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (rejectedPayment) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <XCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-900">Pago Rechazado</AlertTitle>
        <AlertDescription className="text-red-800">
          Tu solicitud de pago fue rechazada. Por favor revisa la razón y envía una nueva solicitud.
          <Button variant="link" size="sm" asChild className="px-0 ml-2 text-red-900 underline">
            <Link href="/my-payments">Ver razón</Link>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}
