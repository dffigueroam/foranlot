"use client"

import { useState } from "react"
import { manualVerifyPredictions, manualVerifyPredictionsFromDb, runAutoVerification } from "@/app/actions/verification"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export function VerificationPanel() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])

  async function handleManualVerification() {
    setLoading(true)
    setError(null)
    setResult(null)

    const res = await manualVerifyPredictions(selectedDate)

    if (res.error) {
      setError(res.error)
    } else {
      setResult(res)
    }

    setLoading(false)
  }

  async function handleStoredVerification() {
    setLoading(true)
    setError(null)
    setResult(null)

    const res = await manualVerifyPredictionsFromDb(selectedDate)

    if (res.error) {
      setError(res.error)
    } else {
      setResult(res)
    }

    setLoading(false)
  }

  async function handleAutoVerification() {
    setLoading(true)
    setError(null)
    setResult(null)

    const res = await runAutoVerification()

    if (res.error) {
      setError(res.error)
    } else {
      setResult(res)
    }

    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Panel de Verificación</CardTitle>
        <CardDescription>Verifica pronósticos con resultados oficiales de lotería</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="font-semibold mb-2">Verificación completada</div>
              <ul className="text-sm space-y-1">
                <li>Pronósticos verificados: {result.verified || result.totalVerified}</li>
                <li>Aciertos: {result.correct || result.totalCorrect}</li>
                {result.resultsProcessed && <li>Resultados procesados: {result.resultsProcessed}</li>}
                {result.datesProcessed && <li>Fechas procesadas: {result.datesProcessed}</li>}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="verify-date">Verificar fecha específica</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              <Input
                id="verify-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                disabled={loading}
              />
              <Button onClick={handleManualVerification} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verificar"}
              </Button>
              <Button onClick={handleStoredVerification} disabled={loading} variant="outline">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verificar con resultados cargados"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Verifica pronósticos para una fecha específica usando la API o resultados cargados
            </p>
          </div>

          <div className="pt-4 border-t">
            <Button onClick={handleAutoVerification} disabled={loading} className="w-full" variant="secondary">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar Todos los Pendientes"
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Verifica automáticamente todos los pronósticos pendientes de los últimos 7 días
            </p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-2 text-sm">Nota Importante</h3>
          <p className="text-xs text-muted-foreground">
            Los resultados oficiales se cargan en la base de datos desde el panel admin (CSV). La verificacion usa esos
            datos para marcar aciertos y recalcular estadisticas.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
