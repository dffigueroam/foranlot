"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Copy, CheckCircle } from "lucide-react"
import { submitPaymentReportAction } from "@/app/actions/payments"

const PAYMENT_METHODS = {
  breb: {
    name: "BRE-B",
    account: process.env.NEXT_PUBLIC_PAYMENT_BREB_CODE || "94329938",
    instructions: "Realiza una transferencia a BRE-B con el código de cuenta mostrado arriba",
    cedula: undefined,
  },
  bancolombia: {
    name: "Cuenta Ahorros Bancolombia",
    account: process.env.NEXT_PUBLIC_PAYMENT_BANCOLOMBIA_ACCOUNT || "30625176901",
    instructions: "Realiza una transferencia a la cuenta de ahorros de Bancolombia",
    cedula: undefined,
  },
  giro: {
    name: "Giro",
    account: `${process.env.NEXT_PUBLIC_PAYMENT_GIRO_NAME || "Diego Fernando Figueroa"}`,
    cedula: process.env.NEXT_PUBLIC_PAYMENT_GIRO_CEDULA || "94329938",
    instructions: "Realiza un giro a nombre del beneficiario mostrado arriba",
  },
}

interface PaymentReportFormProps {
  planType: "monthly" | "annual"
  amount: number
  creditsToAdd: number
}

export function PaymentReportForm({
  planType,
  amount,
  creditsToAdd,
}: PaymentReportFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<keyof typeof PAYMENT_METHODS>("breb")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [bankName, setBankName] = useState("")
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const method = PAYMENT_METHODS[paymentMethod]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!referenceNumber.trim()) {
      setMessage({ type: "error", text: "Ingresa el número de referencia o comprobante" })
      return
    }

    setIsLoading(true)
    setMessage(null)

    const formData = new FormData()
    formData.append("planType", planType)
    formData.append("amountCents", (amount * 100).toString())
    formData.append("creditsToAdd", creditsToAdd.toString())
    formData.append("paymentMethod", paymentMethod)
    formData.append("referenceNumber", referenceNumber)
    if (bankName) formData.append("bankName", bankName)
    formData.append("paymentDate", paymentDate)
    if (notes) formData.append("notes", notes)

    const result = await submitPaymentReportAction(formData)

    if (result.error) {
      setMessage({ type: "error", text: result.error })
    } else {
      setMessage({
        type: "success",
        text: "Reporte de pago enviado. Será revisado en las próximas 24 horas.",
      })
      // Limpiar formulario
      setReferenceNumber("")
      setBankName("")
      setNotes("")
    }

    setIsLoading(false)
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reportar Pago Manual</CardTitle>
        <CardDescription>
          Ya has realizado la transferencia? Reporta tu pago aquí para que lo verifiquemos y acreditemos tus créditos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resumen del plan */}
          <Alert>
            <AlertDescription>
              <div className="space-y-1">
                <p>
                  <strong>Plan:</strong> {planType === "monthly" ? "Mensual" : "Anual"}
                </p>
                <p>
                  <strong>Monto:</strong> ${amount.toFixed(2)} USD
                </p>
                <p>
                  <strong>Créditos:</strong> {creditsToAdd} créditos premium
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Seleccionar método de pago */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">¿Cómo realizaste el pago?</Label>
            <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
              {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                <div
                  key={key}
                  className="relative flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 dark:bg-gray-950/30 dark:border-gray-700 dark:hover:bg-gray-900/60 cursor-pointer"
                  onClick={() => setPaymentMethod(key as keyof typeof PAYMENT_METHODS)}
                >
                  <RadioGroupItem
                    value={key}
                    id={key}
                    className="mt-1"
                  />
                  <label htmlFor={key} className="flex-1 cursor-pointer">
                    <p className="font-semibold text-sm">{method.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {method.instructions}
                    </p>
                    {key === "giro" && method.cedula ? (
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-mono mt-2">
                        Beneficiario: {method.account} | Cédula: {method.cedula}
                      </p>
                    ) : (
                      <div className="flex items-center gap-2 mt-2">
                        <p className="text-xs text-gray-700 dark:text-gray-300 font-mono">
                          {method.account}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(method.account, key)
                          }}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                        >
                          {copiedField === key ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Formulario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reference">
                Número de Referencia o Comprobante *
              </Label>
              <Input
                id="reference"
                placeholder="Ej: 123456789"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">
                Número de transacción, recibo o comprobante de tu banco
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">Banco o Entidad (Opcional)</Label>
              <Input
                id="bankName"
                placeholder="Ej: Banco de Crédito"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate">Fecha del Pago *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas Adicionales (Opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Ej: Pago realizado desde Smartphone, cualquier información adicional..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Mensajes */}
          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Botones */}
          <div className="flex gap-2 justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reportando...
                </>
              ) : (
                "Reportar Pago"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
