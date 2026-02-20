"use client"

import { useState } from "react"
import { runAutoVerification } from "@/app/actions/verification"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export const ResultsVerificationButton = React.memo(function ResultsVerificationButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function handleVerifyPending() {
    setLoading(true)
    setResult(null)

    const res = await runAutoVerification()
    setResult(res)

    setLoading(false)
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="secondary"
        onClick={handleVerifyPending}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Verificando pronosticos...
          </>
        ) : (
          "Verificar pronosticos pendientes"
        )}
      </Button>

      {result?.error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      )}

      {result?.success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Verificacion completada. Pronosticos verificados: {result.totalVerified || 0}. Aciertos: {result.totalCorrect || 0}.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
})
