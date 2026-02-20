"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, BarChart3, Brain, RefreshCw, TrendingUp } from "lucide-react"
import {
  evaluateModelAction,
  getMLStatsAction,
} from "@/app/actions/admin/ml-utilities"
import React, { useMemo } from "react"

export const MLOverviewCard = React.memo(function MLOverviewCard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const result = await getMLStatsAction()
      if (result.success) {
        setStats(result)
      }
    } catch (error) {
      console.error("[v0] Error fetching ML stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEvaluate = async () => {
    setEvaluating(true)
    try {
      const result = await evaluateModelAction()
      if (result.success) {
        // Recargar stats después de evaluar
        await fetchStats()
      }
    } catch (error) {
      console.error("[v0] Error evaluating model:", error)
    } finally {
      setEvaluating(false)
    }
  }

  const memoizedStats = useMemo(() => stats, [stats])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-muted-foreground text-center">Cargando estadísticas...</p>
        </CardContent>
      </Card>
    )
  }

  const lastEval = memoizedStats?.lastEvaluation
  const accuracy = lastEval?.accuracy_percentage || 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              Estado del Modelo ML
            </CardTitle>
            <CardDescription>Sistema de análisis y scoring de predicciones</CardDescription>
          </div>
          <Badge 
            variant={accuracy >= 50 ? "default" : "secondary"}
            className="text-base px-3 py-1"
          >
            {accuracy.toFixed(1)}% Precisión
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {lastEval ? (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Predicciones</p>
              <p className="text-2xl font-bold text-blue-600">{lastEval.total_predictions}</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Aciertos</p>
              <p className="text-2xl font-bold text-green-600">{lastEval.correct_predictions}</p>
            </div>
            <div className="col-span-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-muted-foreground">Última Evaluación</p>
              <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
                {new Date(lastEval.evaluation_date).toLocaleDateString("es-CO", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">Sin evaluaciones</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Ejecuta la primera evaluación del modelo
              </p>
            </div>
          </div>
        )}

        <Button
          onClick={handleEvaluate}
          disabled={evaluating}
          className="w-full"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${evaluating ? "animate-spin" : ""}`} />
          {evaluating ? "Evaluando..." : "Evaluar Modelo Ahora"}
        </Button>
      </CardContent>
    </Card>
  )
})
