"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, History } from "lucide-react"
import { getMLEvaluationHistoryAction } from "@/app/actions/admin/ml-utilities"

export function MLEvaluationHistoryCard() {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const result = await getMLEvaluationHistoryAction()
      if (result.success) {
        setHistory(result.history || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching evaluation history:", error)
    } finally {
      setLoading(false)
    }
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 70) return "bg-green-100 text-green-800"
    if (accuracy >= 50) return "bg-yellow-100 text-yellow-800"
    if (accuracy >= 30) return "bg-orange-100 text-orange-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-amber-500" />
          Historial de Evaluaciones
        </CardTitle>
        <CardDescription>Últimas 20 evaluaciones del modelo</CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Cargando historial...
          </div>
        ) : history.length === 0 ? (
          <div className="p-6 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">Sin evaluaciones</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                El historial de evaluaciones aparecerá aquí
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Aciertos</TableHead>
                  <TableHead className="text-center">Precisión</TableHead>
                  <TableHead>Evaluado Por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((eval_item, idx) => (
                  <TableRow key={idx} className="text-sm">
                    <TableCell className="font-mono text-xs">
                      {new Date(eval_item.evaluation_date).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {eval_item.total_predictions}
                    </TableCell>
                    <TableCell className="text-center font-medium text-green-600">
                      {eval_item.correct_predictions}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${getAccuracyColor(eval_item.accuracy_percentage)}`}>
                        {eval_item.accuracy_percentage?.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {eval_item.evaluated_by_username || "Sistema"}
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
