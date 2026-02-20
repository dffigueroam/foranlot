"use client"
import { useEffect, useState, useTransition } from "react"
import { analyzeOptimizationPatterns } from "@/app/actions/optimization"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { SaveOptimizationTemplatePanel } from "./save-optimization-template-panel"

export function OptimizationPatternsPanel() {
  const [patterns, setPatterns] = useState<any[]>([])
  const [loading, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    startTransition(async () => {
      const res = await analyzeOptimizationPatterns()
      if (res.patterns) setPatterns(res.patterns)
      if (res.latestPrediction) setError(`Último pronóstico de la cuenta vinculada: ${res.latestPrediction.predicted_number} (${res.latestPrediction.lottery_name})`)
      if (res.error && !res.latestPrediction) setError(res.error)
    })
  }, [])

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Patrones de Optimización Detectados</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Requisitos y repercusiones para vincular cuentas */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-500 rounded p-3 text-sm text-blue-900 dark:text-blue-100 mb-6">
          <span className="font-semibold">Requisitos para vincular cuentas:</span>
          <ul className="list-disc ml-6 mt-2">
            <li>Solo usuarios premium pueden solicitar vinculación.</li>
            <li>La cuenta gratis debe aprobar la solicitud desde su panel.</li>
            <li>La cuenta gratis no debe ser premium.</li>
            <li>Debe tener al menos 60 días de posteos.</li>
            <li>Un usuario premium puede vincular hasta 3 cuentas gratis.</li>
          </ul>
          <span className="font-semibold mt-4 block">Repercusiones:</span>
          <ul className="list-disc ml-6 mt-2">
            <li>La cuenta premium podrá analizar los pronósticos de la cuenta gratis y recibir sugerencias de optimización.</li>
            <li>La cuenta gratis puede desvincularse en cualquier momento.</li>
            <li>La vinculación es visible en el panel de ambas cuentas.</li>
            <li>
              <span className="text-red-600 dark:text-red-300 font-semibold">
                La cuenta gratis pierde acceso a las herramientas de análisis y deja de aparecer en el ranking.
              </span>
            </li>
          </ul>
        </div>
        {loading && <div className="text-muted-foreground">Analizando patrones...</div>}
        {error && <div className="text-red-500">{error}</div>}
        {!loading && !error && patterns.length === 0 && (
          <div className="text-muted-foreground">No se detectaron patrones relevantes en los pronósticos recientes.</div>
        )}
        <ul className="space-y-3">
          {patterns.map((p, i) => (
            <li key={i} className="border rounded p-3 bg-muted/30">
              <div className="font-semibold text-sm text-blue-900 dark:text-blue-200">{p.lottery_name}</div>
              <div className="text-xs text-muted-foreground">{p.description}</div>
              <SaveOptimizationTemplatePanel pattern={p} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
