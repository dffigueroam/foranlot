"use client"

import type React from "react"
import { useState } from "react"
import { submitManualPayment } from "@/app/actions/manual-payments"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Upload, Loader2 } from "lucide-react"
import { getPlanData } from "@/lib/pricingutils"

type PlanType = "monthly" | "yearly"

interface PaymentMethod {
  id: string
  name: string
  account: string
  type: string
}

interface ManualPaymentFormProps {
  paymentMethods: PaymentMethod[]
  username?: string
}

export function ManualPaymentForm({ paymentMethods }: ManualPaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [planType, setPlanType] = useState<PlanType>("monthly")
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id || "")

  // 🔥 MONTO VIENE DEL PLAN
  const { priceRaw, priceFormatted, credits } = getPlanData(planType)

  const selectedMethod = paymentMethods.find((m) => m.id === paymentMethodId)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    const formData = new FormData(e.currentTarget)
    formData.append("planType", planType)
    formData.append("amount", priceRaw.toString())
    formData.append("credits", credits.toString())
    formData.append("paymentMethodId", paymentMethodId)

    if (file) {formData.append("receiptUrl", `/uploads/${file.name}`)}

    const result = await submitManualPayment(formData)

    if (result.success) {
      setMessage("Solicitud enviada exitosamente. El administrador la revisará pronto.")
    } else {
      setMessage(result.error || "Error al enviar solicitud")
    }

    setLoading(false)
  }

  return (
    <Card className="p-6 max-w-lg mx-auto">
      <h3 className="text-xl font-bold mb-4">Notifica tu Pago</h3>

      {/* PLAN */}
      <div className="mb-4">
        <Label>Selecciona el plan *</Label>
        <select
          className="w-full border rounded-md p-2 mt-1"
          value={planType}
          onChange={(e) => setPlanType(e.target.value as PlanType)}
        >
          <option value="monthly">Mensual</option>
          <option value="yearly">Anual</option>
        </select>
      </div>

      {/* MONTO CALCULADO */}
      <div className="mb-6 p-4 bg-muted rounded-lg text-sm">
        <p>
          <strong>Monto a pagar:</strong> {priceFormatted}
        </p>
        <p>
          <strong>Créditos incluidos:</strong> {credits}
        </p>
      </div>

      {/* MEDIO DE PAGO */}
      <div className="mb-6">
        <Label>Medio de pago *</Label>
        <select
          className="w-full border rounded-md p-2 mt-1"
          value={paymentMethodId}
          onChange={(e) => setPaymentMethodId(e.target.value)}
        >
          {paymentMethods.map((method) => (
            <option key={method.id} value={method.id}>
              {method.name}
            </option>
          ))}
        </select>

        {selectedMethod && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <p><strong>Cuenta:</strong> {selectedMethod.account}</p>
            <p><strong>Tipo:</strong> {selectedMethod.type}</p>
          </div>
        )}
      </div>

      {/* FORMULARIO */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="referenceNumber">Número de referencia *</Label>
          <Input id="referenceNumber" name="referenceNumber" required />
        </div>

        <div>
          <Label>Comprobante *</Label>
          <label className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
            <div className="text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {file ? file.name : "Sube tu comprobante"}
              </p>
            </div>
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
          </label>
        </div>

        <div>
          <Label>Notas (opcional)</Label>
          <Textarea name="notes" rows={3} />
        </div>

        {message && (
          <div className="text-sm p-3 rounded bg-muted">
            {message}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar comprobante"
          )}
        </Button>
      </form>
    </Card>
  )
}