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
        <div className="grid grid-cols-2 gap-3 mt-2">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => setPaymentMethodId(method.id)}
              className={`p-3 rounded-lg border-2 transition-all ${
                paymentMethodId === method.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <div className="text-2xl mb-1">{method.icon || "💳"}</div>
              <div className="text-xs font-semibold text-gray-900 dark:text-white">
                {method.name}
              </div>
            </button>
          ))}
        </div>

        {selectedMethod && (
          <div
            className="mt-4 p-4 rounded-lg border-l-4 text-sm"
            style={{
              backgroundColor: (selectedMethod.color || "#3B82F6") + "15",
              borderLeftColor: selectedMethod.color || "#3B82F6",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{selectedMethod.icon || "💳"}</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedMethod.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {selectedMethod.type}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-2">
              <strong>Cuenta:</strong> {selectedMethod.account}
            </p>
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

        <Button type="submit" disabled={loading} className="w-full bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Enviar comprobante
            </>
          )}
        </Button>
      </form>
    </Card>
  )
}