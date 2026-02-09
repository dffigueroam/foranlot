"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Calculator, DollarSign, Users, TrendingUp } from "lucide-react"
import { simulateCompensationAction, executeCompensationAction } from "@/app/actions/admin/compensation"

interface DistributionResult {
  userId: number
  username: string
  score: number
  compensation: number
}

interface SimulationResult {
  scenario: {
    totalCapital: number
    multiplier: number
    grossPrize: number
    userFund: number
    platformShare: number
  }
  distribution: DistributionResult[]
}

export function CompensationPanel() {
  const [isSimulating, setIsSimulating] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [simulation, setSimulation] = useState<SimulationResult | null>(null)

  async function handleSimulate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSimulating(true)
    setError(null)
    setMessage(null)
    setSimulation(null)

    const formData = new FormData(e.currentTarget)
    const result = await simulateCompensationAction(formData)

    if (result.error) {
      setError(result.error)
    } else {
      setMessage(result.message!)
      setSimulation(result.simulation!)
    }

    setIsSimulating(false)
  }

  async function handleExecute(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    if (!confirm("¿Estás seguro de ejecutar esta compensación? Se registrarán pagos reales.")) {
      return
    }

    setIsExecuting(true)
    setError(null)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const result = await executeCompensationAction(formData)

    if (result.error) {
      setError(result.error)
    } else {
      setMessage(result.message!)
    }

    setIsExecuting(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Sistema de Compensación
        </CardTitle>
        <CardDescription>
          Simular y ejecutar compensaciones basadas en aciertos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/20">
          <AlertDescription className="text-sm">
            Este módulo es un simulador de compensación: no genera números ganadores, no realiza apuestas reales
            y no garantiza resultados. Los cálculos son auditables y se basan en reglas preacordadas.
          </AlertDescription>
        </Alert>
        {/* Formulario principal */}
        <form onSubmit={handleSimulate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalCapital">Capital Total ($)</Label>
              <Input
                id="totalCapital"
                name="totalCapital"
                type="number"
                step="0.01"
                placeholder="100.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="multiplier">Multiplicador</Label>
              <Input
                id="multiplier"
                name="multiplier"
                type="number"
                placeholder="400"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="winningNumber">Número Ganador</Label>
              <Input
                id="winningNumber"
                name="winningNumber"
                type="text"
                placeholder="123"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lotteryType">Lotería</Label>
              <Input
                id="lotteryType"
                name="lotteryType"
                type="text"
                placeholder="Baloto"
                required
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="drawDate">Fecha del Sorteo</Label>
              <Input
                id="drawDate"
                name="drawDate"
                type="date"
                required
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              variant="outline"
              disabled={isSimulating || isExecuting}
            >
              {isSimulating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Simulando...
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  Simular
                </>
              )}
            </Button>

            <Button 
              type="button"
              onClick={(e) => {
                const form = e.currentTarget.closest("form")!
                handleExecute({ preventDefault: () => {}, currentTarget: form } as any)
              }}
              disabled={isSimulating || isExecuting}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ejecutando...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Ejecutar Compensación
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Mensajes */}
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

        {/* Resultados de simulación */}
        {simulation && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Premio Bruto</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${(simulation.scenario.grossPrize / 100).toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Fondo Usuarios (25%)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${(simulation.scenario.userFund / 100).toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Plataforma (75%)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${(simulation.scenario.platformShare / 100).toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Usuarios Compensados</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {simulation.distribution.length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabla de distribución */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribución Detallada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {simulation.distribution.map((dist) => (
                    <div
                      key={dist.userId}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{dist.userId}</Badge>
                        <span className="font-medium">{dist.username}</span>
                        <span className="text-sm text-muted-foreground">
                          Score: {(dist.score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${(dist.compensation / 100).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
