"use client"
import { useEffect, useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchLinkedAccounts, linkAccountAction, unlinkAccountAction, fetchActiveLinkedAccount } from "@/app/actions/linked-accounts"

interface LinkedAccount {
  id: number
  premium_user_id: number
  free_user_id: number
  status: string
  linked_at: string
  unlinked_at: string | null
  optimization_start_date: string | null
  optimization_end_date: string | null
  total_days_linked: number
  email?: string
}


export function LinkedAccountsManager({ userId }: { userId: number }) {
  const [accounts, setAccounts] = useState<LinkedAccount[]>([])
  const [active, setActive] = useState<LinkedAccount | null>(null)
  const [loading, startTransition] = useTransition()
  const [freeUserEmail, setFreeUserEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    startTransition(async () => {
      const res = await fetchLinkedAccounts()
      if (res.accounts) setAccounts(res.accounts)
      const act = await fetchActiveLinkedAccount()
      if (act.account) setActive(act.account)
    })
  }, [])

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set("freeUserEmail", freeUserEmail)
      const res = await linkAccountAction(formData)
      if (res.success) {
        setSuccess("Cuenta vinculada correctamente.")
        setFreeUserEmail("")
        const updated = await fetchLinkedAccounts()
        setAccounts(updated.accounts || [])
        const act = await fetchActiveLinkedAccount()
        setActive(act.account)
      } else {
        setError(res.error)
      }
    })
  }

  const handleUnlink = async (id: number) => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set("freeUserId", String(id))
      const res = await unlinkAccountAction(formData)
      if (res.success) {
        setSuccess("Cuenta desvinculada.")
        const updated = await fetchLinkedAccounts()
        setAccounts(updated.accounts || [])
        const act = await fetchActiveLinkedAccount()
        setActive(act.account)
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Vincular cuenta gratis para optimización</CardTitle>
        <CardDescription>
          Puedes asociar hasta 3 cuentas gratis, solo 1 activa. La cuenta gratis debe tener mínimo 60 días de posteos y no ser premium.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLink} className="flex gap-2 mb-4">
          <input
            type="email"
            className="input input-bordered w-64"
            placeholder="Correo de cuenta gratis"
            value={freeUserEmail}
            onChange={e => setFreeUserEmail(e.target.value)}
            disabled={loading}
            required
          />
          <Button type="submit" disabled={loading || !freeUserEmail}>Vincular</Button>
        </form>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">{success}</div>}
        <div>
          <h4 className="font-semibold mb-2">Cuentas vinculadas</h4>
          <ul className="space-y-2">
            {accounts.map(acc => (
              <li key={acc.id} className="flex items-center gap-2">
                <span className={acc.status === "active" ? "text-green-600" : "text-gray-500"}>
                  {acc.email ? (
                    <>
                      <span className="font-mono">{acc.email}</span>
                      <span className="text-xs text-muted-foreground ml-1">(ID #{acc.free_user_id})</span>
                    </>
                  ) : (
                    <>#{acc.free_user_id}</>
                  )}
                  <span className="ml-2">({acc.status})</span>
                </span>
                {acc.status === "active" && (
                  <Button size="sm" variant="outline" onClick={() => handleUnlink(acc.free_user_id)} disabled={loading}>
                    Desvincular
                  </Button>
                )}
              </li>
            ))}
            {accounts.length === 0 && <li className="text-muted-foreground">No hay cuentas vinculadas.</li>}
          </ul>
        </div>
        {active && (
          <div className="mt-4 text-sm text-blue-700">
            Cuenta activa: <span className="font-mono">{active.email}</span> (ID #{active.free_user_id})<br />
            <span className="text-xs">Desde {active.optimization_start_date}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
