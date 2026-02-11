"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Mail, X } from "lucide-react"
import { resendVerification } from "@/app/actions/email-verification"
import { useRouter } from "next/navigation"

interface EmailVerificationBannerProps {
  isVerified: boolean
  email: string
}

export function EmailVerificationBanner({ isVerified, email }: EmailVerificationBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [resending, setResending] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Restaurar estado de dismissal desde localStorage
    const wasDismissed = localStorage.getItem("email-banner-dismissed")
    if (wasDismissed === "true") {
      setDismissed(true)
    }
  }, [])

  if (isVerified || dismissed) {
    return null
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem("email-banner-dismissed", "true")
  }

  const handleResend = async () => {
    setResending(true)
    try {
      const result = await resendVerification()
      if (result.success) {
        alert("Email de verificación enviado. Revisa tu bandeja de entrada.")
      } else {
        alert(result.error || "Error al enviar email")
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setResending(false)
    }
  }

  const handleVerify = () => {
    router.push("/verify-email")
  }

  return (
    <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 mb-4">
      <Mail className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="font-medium text-yellow-800 dark:text-yellow-300">
            Por favor verifica tu correo electrónico
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            Enviamos un email de verificación a <strong>{email}</strong>. Verifica tu cuenta para
            acceder a todas las funcionalidades.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleResend}
            disabled={resending}
            className="whitespace-nowrap"
          >
            {resending ? "Enviando..." : "Reenviar"}
          </Button>
          <Button size="sm" onClick={handleVerify} className="whitespace-nowrap">
            Verificar Ahora
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="whitespace-nowrap px-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
