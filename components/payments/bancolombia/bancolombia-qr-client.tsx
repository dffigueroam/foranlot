"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type PlanType = "monthly" | "annual"

interface BancolombiaQrClientProps {
  username: string
  defaultBusinessKey: string
}

const PLAN_CONFIG: Record<PlanType, { label: string; amountCOP: number }> = {
  monthly: { label: "Plan Mensual", amountCOP: 25995 },
  annual: { label: "Plan Anual", amountCOP: 195000 },
}

function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount)
}

function buildReference(username: string) {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  const hh = String(now.getHours()).padStart(2, "0")
  const mm = String(now.getMinutes()).padStart(2, "0")
  const ss = String(now.getSeconds()).padStart(2, "0")
  const cleanUser = username.toLowerCase().replace(/[^a-z0-9]/g, "") || "user"
  return `${cleanUser}-${y}${m}${d}${hh}${mm}${ss}`
}

export function BancolombiaQrClient({ username, defaultBusinessKey }: BancolombiaQrClientProps) {
  const [planType, setPlanType] = useState<PlanType>("monthly")
  const [businessKey, setBusinessKey] = useState(defaultBusinessKey)
  const [reference, setReference] = useState("")
  const [qrUrl, setQrUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState("")

  useEffect(() => {
    setReference((prev) => prev || buildReference(username))
  }, [username])

  const amountCOP = PLAN_CONFIG[planType].amountCOP
  const isReferenceReady = reference.trim().length > 0
  const isBusinessKeyValid = /^\d{10}$/.test(businessKey.trim())
  const canRequestQr = isBusinessKeyValid && amountCOP > 0 && isReferenceReady

  const requestBody = useMemo(
    () => ({
      businessKey: businessKey.trim(),
      amountCOP,
      reference: reference.trim(),
    }),
    [amountCOP, businessKey, reference],
  )

  useEffect(() => {
    async function loadQr() {
      if (!canRequestQr) {
        setQrUrl("")
        setApiError("Llave de negocio invalida. Debe tener 10 digitos.")
        return
      }

      setLoading(true)
      setApiError("")

      try {
        const response = await fetch("/api/bancolombia/qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          setQrUrl("")
          setApiError("No fue posible generar QR con API Bancolombia. Usa llave y monto manualmente.")
          return
        }

        const data = (await response.json()) as { ok: boolean; qrImageUrl?: string; error?: string }
        if (!data.ok || !data.qrImageUrl) {
          setQrUrl("")
          setApiError("API Bancolombia sin QR disponible. Usa llave y monto manualmente.")
          return
        }

        setQrUrl(data.qrImageUrl)
      } catch {
        setQrUrl("")
        setApiError("Fallo de conexion con API Bancolombia. Usa llave y monto manualmente.")
      } finally {
        setLoading(false)
      }
    }

    loadQr()
  }, [canRequestQr, requestBody])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pago Bancolombia</CardTitle>
        <CardDescription>
          Flujo exclusivo Bancolombia. Si la API no responde, se muestra solo llave y monto.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Plan</Label>
            <select
              className="w-full rounded-md border px-3 py-2 bg-background"
              value={planType}
              onChange={(e) => setPlanType(e.target.value as PlanType)}
            >
              <option value="monthly">{PLAN_CONFIG.monthly.label}</option>
              <option value="annual">{PLAN_CONFIG.annual.label}</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessKey">Llave de negocio Bancolombia</Label>
            <Input
              id="businessKey"
              value={businessKey}
              onChange={(e) => setBusinessKey(e.target.value)}
              placeholder="0091765912"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Referencia unica</Label>
            <div className="flex gap-2">
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Generando referencia..."
                className={!isReferenceReady ? "border-amber-500 bg-amber-50 text-amber-900 placeholder:text-amber-700" : ""}
              />
              <Button type="button" variant="outline" onClick={() => setReference(buildReference(username))}>
                Regenerar
              </Button>
            </div>
            {!isReferenceReady ? (
              <p className="text-xs font-medium text-amber-800">
                Generando referencia unica...
              </p>
            ) : null}
          </div>

          <div className="rounded-lg border p-3 text-sm space-y-1">
            <p><strong>Banco:</strong> Bancolombia</p>
            <p><strong>Llave:</strong> {businessKey.trim() || "-"}</p>
            <p><strong>Monto:</strong> {formatCOP(amountCOP)}</p>
            <p><strong>Referencia:</strong> {reference.trim() || "-"}</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            QR dinamico Bancolombia con llave y monto.
          </p>
          <div className="rounded-lg border p-4 flex min-h-83 items-center justify-center bg-white">
            {loading ? (
              <p className="text-sm text-gray-700 text-center">Generando QR...</p>
            ) : qrUrl ? (
              <img src={qrUrl} alt="QR Bancolombia" width={300} height={300} />
            ) : (
              <p className="text-sm text-gray-700 text-center">{apiError || "QR no disponible"}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
