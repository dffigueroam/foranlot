"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ContractForm } from "./contract-form"

interface Props {
  rankingUsers: any[]
  availableCredits: number
}

export function ContractsSection({ rankingUsers, availableCredits }: Props) {
  const [showForm, setShowForm] = useState(false)

  return (
    <Card className="contracts-section">
      <CardHeader className="contracts-header">
        <div className="contracts-header-text">
          <CardTitle className="contracts-title">
            Contratos de Pronósticos
          </CardTitle>

          <p className="contracts-description">
            Contrata usuarios del ranking y recibe pronósticos diarios
          </p>
        </div>

        <Button
          size="sm"
          className="contracts-cta"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancelar" : "Hacer contrato"}
        </Button>
      </CardHeader>

      <CardContent className="contracts-content">
        {showForm && (
          <div className="contracts-form">
            <ContractForm
              rankingUsers={rankingUsers}
              availableCredits={availableCredits}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
