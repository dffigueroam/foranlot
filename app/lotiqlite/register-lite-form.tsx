

import React, { useState, useEffect } from "react"
import { getCurrentUser } from "@/lib/auth"
import { registerLiteUserAction } from "./actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CardDescription } from "@/components/ui/card"
import { ManualPaymentForm } from "@/components/payments/manual-payment-form"
import { getPaymentMethods } from "@/lib/payment-methods"

interface RankingUser {
  user_id: number
  username: string
  accuracy_percentage: number
  total_score: number
  rank_position: number
  subscribers_count?: number
}

export function RegisterLiteForm({ forceRanking }: { forceRanking?: boolean } = {}) {
  // Si se forzó el paso de pago desde login, mostrar pricing directamente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.localStorage.getItem('lotiqlite:forcePayment') === '1') {
        setShowPricing(true)
        window.localStorage.removeItem('lotiqlite:forcePayment')
      }
      if (window.localStorage.getItem('lotiqlite:forceRanking') === '1' || !!forceRanking) {
        setShowPricing(false)
        setPaymentConfirmed(true)
        if (window.localStorage.getItem('lotiqlite:forceRanking') === '1') {
          window.localStorage.removeItem('lotiqlite:forceRanking')
        }
        // Cargar usuario lite desde API
        fetch('/api/current-user')
          .then(res => res.json())
          .then(data => {
            if (data.user) setUser(data.user);
          });
      }
    }
  }, [!!forceRanking])
  // Estado para saber si el usuario completó el formulario de pago manual
  const [paymentFormValid, setPaymentFormValid] = useState(false)

  // Métodos de pago para el formulario manual
  const [paymentMethods, setPaymentMethods] = React.useState<any[]>([]);
  React.useEffect(() => {
    async function fetchMethods() {
      const res = await fetch("/api/payment-methods");
      const data = await res.json();
      setPaymentMethods(data.paymentMethods || []);
    }
    fetchMethods();
  }, []);
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [user, setUser] = useState<any>(null)
  const [ranking, setRanking] = useState<RankingUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [onboardingLoading, setOnboardingLoading] = useState(false)
  const [onboardingSuccess, setOnboardingSuccess] = useState("")
  const [onboardingError, setOnboardingError] = useState("")
  const [showPricing, setShowPricing] = useState(false)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)

  // Cargar top 5 ranking tras registro
  useEffect(() => {
    if (user) {
      fetch("/api/lotiqlite/top5")
        .then(res => res.json())
        .then(data => setRanking(data.ranking || []))
        .catch(() => setRanking([]))
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("nombre", nombre)
      formData.append("email", email)
      formData.append("password", password)
      const result = await registerLiteUserAction(formData)
      if (result?.error) {
        if (result.error.includes("ya está registrado") || result.error.includes("duplicate key")) {
          setError("Ya existe una cuenta con ese correo o usuario. Si ya tienes cuenta, inicia sesión o recupera tu contraseña.")
          setLoading(false)
          return
        }
        setError(result.error)
        setLoading(false)
        return
      }
      setUser(result.user)
      setSuccess("¡Registro exitoso! Ahora realiza el pago para activar tu cuenta.")
      setShowPricing(true)
      setLoading(false)
    } catch (err: any) {
      setError("Error al registrar. Intenta de nuevo.")
      setLoading(false)
    }
  }

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) {
      setOnboardingError("Debes seleccionar un pronosticador.")
      return
    }
    setOnboardingLoading(true)
    setOnboardingError("")
    setOnboardingSuccess("")
    try {
      const res = await fetch("/api/lotiqlite/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, selectedUserId })
      })
      const data = await res.json()
      if (data?.error) {
        setOnboardingError(data.error)
        setOnboardingLoading(false)
        return
      }
      setOnboardingSuccess("¡Activación premium y selección completadas! Revisa tu correo para recibir los pronósticos diarios.")
      setOnboardingLoading(false)
    } catch (err: any) {
      setOnboardingError("Error al activar. Intenta de nuevo.")
      setOnboardingLoading(false)
    }
  }

  if (showPricing && !paymentConfirmed) {
    // Paso intermedio: mostrar sección de precios/pago con instrucciones claras
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <h2 className="font-bold text-lg mb-2 text-yellow-700">Paso 2: Realiza tu pago</h2>
          <ol className="list-decimal list-inside text-sm text-yellow-900 space-y-1">
            <li>Realiza el pago de la membresía premium usando el formulario a continuación.</li>
            <li>Guarda el comprobante de tu transferencia.</li>
            <li>Llena el formulario de pago manual y adjunta el comprobante.</li>
            <li>Una vez enviado, haz clic en <b>"Ya realicé el pago"</b> para continuar.</li>
          </ol>
          <div className="mt-2 text-xs text-yellow-800">Nuestro equipo validará tu pago y te notificará por correo cuando tu cuenta esté activa.</div>
        </div>
        <ManualPaymentForm paymentMethods={paymentMethods} onSuccess={() => setPaymentFormValid(true)} />
        <div className="text-center mt-4 space-y-2">
          <Button
            onClick={() => setPaymentConfirmed(true)}
            className="bg-green-600 hover:bg-green-700"
            disabled={!paymentFormValid}
          >
            Ya realicé el pago y envié el comprobante
          </Button>
          <div>
            <button
              type="button"
              className="underline text-blue-700 text-sm hover:text-blue-900 mt-2"
              onClick={() => setPaymentConfirmed(true)}
            >
              ¿Ya tienes premium? <span className="font-semibold">Haz clic aquí para continuar</span>
            </button>
          </div>
          {!paymentFormValid && (
            <div className="mt-2 text-xs text-red-600">Debes ingresar el número de referencia y adjuntar el comprobante antes de continuar.</div>
          )}
          <div className="mt-2 text-xs text-muted-foreground">Si tienes dudas, revisa tu correo o contacta soporte.</div>
        </div>
      </div>
    )
  }

  // ...existing code...

  // Paso 1: registro
  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <CardDescription className="text-center mb-2 text-muted-foreground">
        Ingresa tus datos para comenzar
      </CardDescription>
      <Input
        placeholder="Nombre de usuario"
        value={nombre}
        onChange={e => setNombre(e.target.value)}
        required
        minLength={3}
        maxLength={32}
        autoComplete="username"
        disabled={loading}
      />
      <Input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        minLength={6}
        maxLength={64}
        autoComplete="new-password"
        disabled={loading}
      />
      <Input
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        autoComplete="email"
        disabled={loading}
      />
      {error && <div className="text-red-600 text-sm text-center">{error}</div>}
      {success && <div className="text-green-700 text-sm text-center">{success}</div>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Registrando..." : "Registrarme"}
      </Button>
    </form>
  )
}
