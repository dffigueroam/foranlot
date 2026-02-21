"use client"

import { useState } from "react"
import { reactivateAccount } from "@/app/actions/auth"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert } from "@/components/ui/alert"

export default function ReactivationForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)
    const result = await reactivateAccount(email, password, message)
    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error || "Error al reactivar la cuenta")
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success ? (
        <Alert variant="success">Cuenta reactivada correctamente. Ya puedes acceder al sistema.</Alert>
      ) : (
        <>
          <Input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <Input
            type="text"
            placeholder="Mensaje para el sistema"
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
            disabled={loading}
          />
          {error && <Alert variant="destructive">{error}</Alert>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Reactivando..." : "Reactivar cuenta"}
          </Button>
        </>
      )}
    </form>
  )
}
