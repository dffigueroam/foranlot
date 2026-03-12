"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2, Mail, Send } from "lucide-react"

interface ManualSendResponse {
  success?: boolean
  runId?: number
  totalLotteries?: number
  totalItems?: number
  liteUsersProcessed?: number
  emailDelivered?: number
  emailFailed?: number
  emailSkipped?: number
  error?: string
}

export default function ManualLiteRecommendationsButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ManualSendResponse | null>(null)
  const [confirmText, setConfirmText] = useState("")

  async function handleSend() {
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/admin/recommendations/send-lite", {
        method: "POST",
      })

      const payload = (await res.json()) as ManualSendResponse
      setResult(payload)
    } catch (error) {
      setResult({ error: "Error de red ejecutando envío manual" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Envío Manual Lite
        </CardTitle>
        <CardDescription>
          Ejecuta ahora el envío de recomendados por correo para usuarios Lite premium.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar recomendados Lite
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar envío manual</AlertDialogTitle>
              <AlertDialogDescription>
                Se enviarán correos de recomendados a usuarios Lite premium con notificación email activa.
                Esta acción ejecuta el proceso ahora mismo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Escribe <strong>CONFIRMAR</strong> para habilitar el envío.
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="CONFIRMAR"
                disabled={loading}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={loading}
                onClick={() => setConfirmText("")}
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSend}
                disabled={loading || confirmText.trim().toUpperCase() !== "CONFIRMAR"}
              >
                Confirmar envío
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {result?.error && (
          <Alert variant="destructive">
            <AlertDescription>{result.error}</AlertDescription>
          </Alert>
        )}

        {result?.success && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Run #{result.runId}</Badge>
            <Badge variant="outline">Loterías: {result.totalLotteries ?? 0}</Badge>
            <Badge variant="outline">Items: {result.totalItems ?? 0}</Badge>
            <Badge variant="outline">Lite procesados: {result.liteUsersProcessed ?? 0}</Badge>
            <Badge className="bg-green-600">Enviados: {result.emailDelivered ?? 0}</Badge>
            <Badge variant="destructive">Fallidos: {result.emailFailed ?? 0}</Badge>
            <Badge variant="outline">Omitidos: {result.emailSkipped ?? 0}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
