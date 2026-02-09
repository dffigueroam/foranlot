"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {Select, SelectItem, SelectTrigger, SelectValue, SelectContent,} from "@/components/ui/select"
import { createContractAction } from "@/app/actions/contracts"

export function ContractForm({ rankingUsers, availableCredits }: any) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(false)

    const result = await createContractAction(formData)

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Select name="selected_user_id">
        <SelectTrigger>
          <SelectValue placeholder="Selecciona usuario del ranking" />
        </SelectTrigger>
        <SelectContent>
          {rankingUsers.map((u: any) => (
            <SelectItem key={u.id} value={String(u.id)}>
              {u.username}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select name="lottery_type" defaultValue="3_digits">
        <SelectTrigger>
          <SelectValue placeholder="Tipo de lotería" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="2_digits">2 Cifras</SelectItem>
          <SelectItem value="3_digits">3 Cifras</SelectItem>
          <SelectItem value="4_digits">4 Cifras</SelectItem>
        </SelectContent>
      </Select>

      <Input name="start_date" type="date" required />
      <Input name="end_date" type="date" required />

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-600">Contrato creado correctamente</p>}

      <Button type="submit">Firmar contrato</Button>
    </form>
  )
}
