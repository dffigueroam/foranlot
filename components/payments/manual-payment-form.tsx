"use client"

import React from "react"
import { useState } from "react"
import { submitManualPayment } from "@/app/actions/manual-payments"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Upload, Loader2, Check } from "lucide-react"
import { displayAccountNumber } from "@/lib/client-decrypt-utils"
import { getPlanData } from "@/lib/pricingutils"

type PlanType = "monthly" | "yearly"

interface PaymentMethod {
  id: string
  name: string
  account: string
  type: string
  icon?: string
  color?: string
  image?: string
}


interface ManualPaymentFormProps {
  paymentMethods: PaymentMethod[]
  username?: string
  onSuccess?: () => void
}


export function ManualPaymentForm({ paymentMethods, onSuccess }: ManualPaymentFormProps) {
  // useState hooks primero
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [referenceNumber, setReferenceNumber] = useState("");
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [planType, setPlanType] = useState<PlanType>("monthly")
  const [file, setFile] = useState<File | null>(null)
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id || "")

  const selectedMethod = paymentMethods.find((m) => m.id === paymentMethodId)

  // Obtener datos del plan
  const planData = getPlanData(planType)

  // (Ya no se usa postMessage, la validación se maneja por callback onSuccess)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!referenceNumber || referenceNumber.trim() === "") {
      setMessage("Ingresa el número de referencia")
      // Informar al padre que no es válido
      if (typeof window !== 'undefined' && window.parent !== window) {
        window.parent.postMessage('manual-payment:invalid', window.location.origin)
      }
      return
    }

    if (!receiptFile) {
      setMessage("Debes adjuntar un comprobante")
      // Informar al padre que no es válido
      if (typeof window !== 'undefined' && window.parent !== window) {
        window.parent.postMessage('manual-payment:invalid', window.location.origin)
      }
      return
    }

    setLoading(true)
    setMessage("")

    const formData = new FormData()
    formData.append("planType", planType)
    formData.append("referenceNumber", referenceNumber)
    formData.append("receiptFile", receiptFile)
    formData.append("paymentMethodId", paymentMethodId)

    const result = await submitManualPayment(formData)

    if (result.success) {
      setMessage("✅ Solicitud enviada exitosamente. El administrador la revisará pronto.")
      ;(e.target as HTMLFormElement).reset()
      setReceiptFile(null)
      setReferenceNumber("");
      if (onSuccess) onSuccess();
    } else {
      setMessage(`❌ ${result.error || "Error al enviar solicitud"}`)
    }

    setLoading(false)
  }

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h3 className="text-xl font-bold mb-6">Reporte de Transferencia</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PLAN */}
        <div>
          <Label>Tipo de Plan *</Label>
          <select
            className="w-full border rounded-md p-2 mt-1"
            value={planType}
            onChange={(e) => setPlanType(e.target.value as PlanType)}
          >
            <option value="monthly">Mensual - {planData.priceFormatted}</option>
            <option value="yearly">Anual - {getPlanData("yearly").priceFormatted}</option>
          </select>
        </div>

        {/* MÉTODOS DE PAGO */}
        <div>
          <Label className="mb-3 block font-semibold">¿A dónde transferiste? *</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {paymentMethods && paymentMethods.length > 0 ? (
              paymentMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethodId(method.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    paymentMethodId === method.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="w-12 h-12 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-800">
                    {method.image ? (
                      <img src={method.image} alt={method.name} className="w-10 h-10 object-contain" />
                    ) : (
                      <span className="text-lg">{method.icon || "💳"}</span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-center">
                    {method.name.split('(')[0].trim()}
                  </div>
                  {paymentMethodId === method.id && (
                    <Check className="w-4 h-4 text-blue-500" />
                  )}
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No hay métodos disponibles</p>
            )}
          </div>
        </div>

        {/* DETALLES DEL BANCO SELECCIONADO */}
        {selectedMethod && (
          <div
            className="p-4 rounded-lg border-l-4"
            style={{
              backgroundColor: (selectedMethod.color || "#3B82F6") + "15",
              borderLeftColor: selectedMethod.color || "#3B82F6",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              {selectedMethod.image ? (
                <img src={selectedMethod.image} alt={selectedMethod.name} className="w-6 h-6 object-contain" />
              ) : (
                <span>{selectedMethod.icon}</span>
              )}
              <p className="font-semibold text-sm">{selectedMethod.name}</p>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{selectedMethod.type}</p>
            <p className="text-sm">
              <strong>Cuenta:</strong> <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-blue-600 dark:text-blue-400">{displayAccountNumber(selectedMethod.account)}</code>
            </p>
          </div>
        )}

        {/* NÚMERO DE REFERENCIA */}
        <div>
          <Label htmlFor="referenceNumber">Número de Referencia (Comprobante) *</Label>
          <Input
            id="referenceNumber"
            name="referenceNumber"
            placeholder="Ej: 1234567890"
            required
            value={referenceNumber}
            onChange={e => setReferenceNumber(e.target.value)}
          />
        </div>

        {/* CARGAR COMPROBANTE */}
        <div>
          <Label>Sube Comprobante de Transferencia *</Label>
          <label className="flex items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {receiptFile ? (
                  <span className="text-green-600 dark:text-green-400">✓ {receiptFile.name}</span>
                ) : (
                  <span>Haz clic o arrastra tu comprobante aquí</span>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF (máx 5MB)</p>
            </div>
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              required
            />
          </label>
        </div>

        {/* MENSAJE */}
        {message && (
          <div className={`text-sm p-3 rounded ${message.includes("✅") ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"}`}>
            {message}
          </div>
        )}

        {/* BOTÓN */}
        <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Enviar Reporte
            </>
          )}
        </Button>
      </form>
    </Card>
  )
}