"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { verifyEmail, resendVerification } from "@/app/actions/email-verification"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Mail, Loader2 } from "lucide-react"

export function VerifyEmailForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [token, setToken] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  // Auto-verificar si hay token en URL
  useEffect(() => {
    const urlToken = searchParams.get("token")
    if (urlToken) {
      handleVerification(urlToken)
    }
  }, [searchParams])

  async function handleVerification(tokenToVerify: string) {
    setError(null)
    setLoading(true)

    const result = await verifyEmail(tokenToVerify)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      // Redirigir al dashboard después de 2 segundos
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token.trim()) {
      setError("Por favor ingresa el token")
      return
    }
    await handleVerification(token)
  }

  async function handleResend() {
    setError(null)
    setResending(true)

    const result = await resendVerification()

    if (result.error) {
      setError(result.error)
    } else {
      setError(null)
      alert("Email de verificación reenviado. Revisa tu bandeja de entrada.")
    }

    setResending(false)
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
        </div>
        <h3 className="text-xl font-semibold">¡Email Verificado!</h3>
        <p className="text-muted-foreground">
          Tu cuenta ha sido activada exitosamente. Redirigiendo al dashboard...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="token">
            Token de Verificación
          </Label>
          <Input
            id="token"
            name="token"
            type="text"
            placeholder="Ingresa el token del email"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={loading}
            required
          />
          <p className="text-xs text-muted-foreground">
            Revisa tu correo electrónico y copia el token de verificación, o haz clic en el enlace del email.
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Verificar Email
            </>
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">¿No recibiste el email?</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleResend}
        disabled={resending || loading}
      >
        {resending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Reenviando...
          </>
        ) : (
          <>
            <Mail className="w-4 h-4 mr-2" />
            Reenviar Email de Verificación
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        El token expira en 24 horas. Si necesitas ayuda, contacta a soporte.
      </p>
    </div>
  )
}
