"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { login } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function LoginForm({ onGoToPayment, onGoToConfig }: { onGoToPayment?: () => void, onGoToConfig?: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await login(formData)

    if (result.error) {
      if (result.error.includes("Este tipo de cuenta no puede iniciar sesión")) {
        setError("lite-special")
      } else {
        setError(result.error)
      }
      setLoading(false)
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error === "lite-special" ? (
        <Alert variant="warning">
          <AlertDescription>
            Este tipo de cuenta solo puede continuar completando el <b>formulario de pago y configuración</b>.<br />
            <div className="flex flex-col gap-2 mt-2">
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                type="button"
                onClick={() => {
                  if (onGoToPayment) onGoToPayment();
                }}
              >
                Ir al formulario de pago
              </Button>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                type="button"
                onClick={() => {
                  if (onGoToConfig) onGoToConfig();
                }}
              >
                Configurar mis Pronósticos
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="tu@email.com" required disabled={loading} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" placeholder="••••••••" required disabled={loading} />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
      </Button>
    </form>
  )
}
