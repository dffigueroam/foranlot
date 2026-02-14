"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, BarChart3, RefreshCw } from "lucide-react"
import { getRankedPredictionsAction } from "@/app/actions/admin/ml-utilities"

export function MLRankedPredictionsCard() {
  const [predictions, setPredictions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchPredictions()
  }, [])

  const fetchPredictions = async () => {
    setLoading(true)
    try {
      const result = await getRankedPredictionsAction(20)
      if (result.success) {
        setPredictions(result.predictions || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching ranked predictions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchPredictions()
    setRefreshing(false)
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 70) return "bg-green-100 text-green-800 border-green-200"
    if (score >= 50) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    if (score >= 30) return "bg-orange-100 text-orange-800 border-orange-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  const getConfidenceLabel = (confidence: number) => {
    const labels = {
      1: "Muy Baja",
      2: "Baja",
      3: "Media",
      4: "Alta",
      5: "Muy Alta",
    }
    return labels[confidence as keyof typeof labels] || "Desconocida"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Predicciones Mejor Ranqueadas
            </CardTitle>
            <CardDescription>Top 20 predicciones ordenadas por score del modelo ML</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Cargando predicciones...
          </div>
        ) : predictions.length === 0 ? (
          <div className="p-6 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">Sin predicciones</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                No hay predicciones verificadas aún
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Score</TableHead>
                  <TableHead>Lotería</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead className="text-center">Confianza</TableHead>
                  <TableHead className="text-right">Recomendación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {predictions.map((pred, idx) => (
                  <TableRow key={idx} className="text-sm">
                    <TableCell>
                      <Badge className={`${getScoreBadgeColor(pred.score)} border`}>
                        {pred.score.toFixed(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-xs uppercase">
                      {pred.lotteryType || "N/A"}
                    </TableCell>
                    <TableCell className="font-mono text-base font-bold">
                      {pred.predictedNumber || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {getConfidenceLabel(pred.confidence)} ({pred.confidence}/5)
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      <span className="line-clamp-2">{pred.recommendation}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
