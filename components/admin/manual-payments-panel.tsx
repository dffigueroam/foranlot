"use client"

import { useEffect, useState } from "react"
import { getPendingPayments, approvePayment, rejectPayment } from "@/app/actions/manual-payments"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Check, X, Loader2, FileText, CheckCircle, AlertCircle } from "lucide-react"

interface PaymentRequest {
  id: number
  username: string
  email: string
  plan_type: string
  amount_cents: number
  credits_to_add: number
  reference_number?: string
  bank_name?: string
  payment_date?: string
  receipt_url?: string
  notes?: string
  account_validated: boolean
  account_validated_at?: string
  created_at: string
}

export function ManualPaymentsPanel() {
  const [payments, setPayments] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")

  async function loadPayments() {
    setLoading(true)
    const result = await getPendingPayments()
    if (result.success) {
      setPayments(result.data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadPayments()
  }, [])

  async function handleApprove(id: number) {
    if (!confirm("¿Confirmar aprobación de este pago?")) return

    setProcessingId(id)
    const result = await approvePayment(id)

    if (result.success) {
      alert("Pago aprobado exitosamente")
      loadPayments()
    } else {
      alert(result.error || "Error al aprobar")
    }

    setProcessingId(null)
  }

  async function handleReject(id: number) {
    if (!rejectionReason.trim()) {
      alert("Debes proporcionar una razón de rechazo")
      return
    }

    setProcessingId(id)
    const result = await rejectPayment(id, rejectionReason)

    if (result.success) {
      alert("Pago rechazado")
      setRejectingId(null)
      setRejectionReason("")
      loadPayments()
    } else {
      alert(result.error || "Error al rechazar")
    }

    setProcessingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-1">No hay pagos pendientes</h3>
        <p className="text-sm text-muted-foreground">Las nuevas solicitudes aparecerán aquí</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => (
        <Card key={payment.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">{payment.username}</h3>
              <p className="text-sm text-muted-foreground">{payment.email}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">{payment.plan_type === "monthly" ? "Mensual" : "Anual"}</Badge>
              {payment.account_validated ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Validado
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Sin validar
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <p className="text-muted-foreground">Monto</p>
              <p className="font-semibold">${payment.amount_cents.toLocaleString("es-CO")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Créditos</p>
              <p className="font-semibold">{payment.credits_to_add}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Referencia</p>
              <p className="font-semibold">{payment.reference_number || "N/A"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Banco</p>
              <p className="font-semibold">{payment.bank_name || "N/A"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Fecha de pago</p>
              <p className="font-semibold">
                {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString("es-ES") : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Solicitado</p>
              <p className="font-semibold">{new Date(payment.created_at).toLocaleDateString("es-ES")}</p>
            </div>
          </div>

          {payment.account_validated && payment.account_validated_at && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-700">
                ✓ Usuario validó que es su cuenta el {new Date(payment.account_validated_at).toLocaleDateString("es-ES")}
              </p>
            </div>
          )}

          {payment.notes && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Notas:</p>
              <p className="text-sm">{payment.notes}</p>
            </div>
          )}

          {payment.receipt_url && (
            <div className="mb-4">
              <a
                href={payment.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Ver comprobante
              </a>
            </div>
          )}

          {rejectingId === payment.id ? (
            <div className="space-y-3">
              <Textarea
                placeholder="Razón del rechazo..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReject(payment.id)}
                  disabled={processingId === payment.id}
                >
                  {processingId === payment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Rechazo"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRejectingId(null)
                    setRejectionReason("")
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleApprove(payment.id)}
                disabled={processingId === payment.id}
                className="flex-1"
              >
                {processingId === payment.id ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Aprobar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectingId(payment.id)}
                disabled={processingId === payment.id}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Rechazar
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
