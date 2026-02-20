"use client"
import { useEffect, useState } from "react"
import { Button } from "../ui/button"

interface LinkRequest {
  id: number
  premium_user_id: number
  free_user_id: number
  status: "pendiente" | "aprobada" | "rechazada"
  created_at: string
  premium_email?: string
}

export function LinkRequestsPanel({ freeUserId }: { freeUserId: number }) {
  const [requests, setRequests] = useState<LinkRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/link-requests?freeUserId=${freeUserId}`)
      .then(res => res.json())
      .then(data => setRequests(data.requests || []))
      .catch(() => setError("Error al cargar solicitudes"))
  }, [freeUserId])

  const handleRespond = async (id: number, approve: boolean) => {
    setLoading(true)
    setError("")
    const res = await fetch(`/api/link-requests/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id, approve })
    })
    const data = await res.json()
    if (data.error) setError(data.error)
    else {
      setRequests(requests => requests.filter(r => r.id !== id))
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Solicitudes de vinculación de cuentas</h2>
      <p className="text-sm text-muted-foreground">
        Aquí puedes aprobar o rechazar solicitudes de vinculación de cuentas premium. Al aprobar, tu cuenta gratis será vinculada a la cuenta premium solicitante. Esto permitirá que el usuario premium analice tus pronósticos y reciba sugerencias de optimización. Puedes desvincularte en cualquier momento desde tu panel.
      </p>
      {error && <div className="text-red-500">{error}</div>}
      {requests.length === 0 ? (
        <div className="text-muted-foreground">No tienes solicitudes pendientes.</div>
      ) : (
        <ul className="space-y-2">
          {requests.map(req => (
            <li key={req.id} className="border rounded p-3 flex flex-col">
              <span className="font-medium">Cuenta premium solicitante: {req.premium_email || req.premium_user_id}</span>
              <span className="text-xs text-muted-foreground">Solicitada el {new Date(req.created_at).toLocaleString()}</span>
              <div className="mt-2 flex gap-2">
                <Button disabled={loading} onClick={() => handleRespond(req.id, true)} variant="success">Aprobar</Button>
                <Button disabled={loading} onClick={() => handleRespond(req.id, false)} variant="destructive">Rechazar</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
