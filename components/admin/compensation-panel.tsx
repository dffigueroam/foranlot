"use client";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Calculator, DollarSign, Users, TrendingUp } from "lucide-react"
import { useState } from "react"

// Nueva función API para compensación real por contratos
async function fetchContractCompensation() {
  const res = await fetch("/api/admin/contract-compensation");
  if (!res.ok) throw new Error("Error al obtener compensación por contrato");
  return res.json();
}

const CompensationPanel = React.memo(function CompensationPanel() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [contractComp, setContractComp] = useState<any[] | null>(null);
  const [loadingContractComp, setLoadingContractComp] = useState(false);

  async function handleShowContractComp() {
    setLoadingContractComp(true);
    setError(null);
    try {
      const data = await fetchContractCompensation();
      setContractComp(data);
    } catch (e: any) {
      setError(e.message);
    }
    setLoadingContractComp(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Sistema de Compensación
        </CardTitle>
        <CardDescription>
          Consulta la compensación real por contratos activos y tarifa pactada.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/20">
          {/* Solo botón para compensación real por contratos */}
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={handleShowContractComp} disabled={loadingContractComp}>
              {loadingContractComp ? "Cargando..." : "Ver compensación real por contratos"}
            </Button>
          </div>
        </Alert>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        {/* Resultados de compensación real por contratos */}
        {contractComp && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Compensación por contratos activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {contractComp.length === 0 && <div>No hay contratos activos.</div>}
                {contractComp.map((row) => (
                  <div key={row.predictorId} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{row.predictorId}</Badge>
                      <span className="font-medium">Predictor</span>
                      <span className="text-sm text-muted-foreground">Contratos: {row.contratos}</span>
                    </div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {(row.totalCompensacion / 100).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
})

export default CompensationPanel;
