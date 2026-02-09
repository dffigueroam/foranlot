"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, User, Hash, Calendar, Download, Loader2 } from "lucide-react"
import { getSelectedPredictionsAction, generatePredictionAction, getSelectionsAction } from "@/app/actions/credits"

export default function SelectedPredictionsList() {
  const [predictions, setPredictions] = useState<any[]>([])
  const [selections, setSelections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [predResult, selResult] = await Promise.all([getSelectedPredictionsAction(), getSelectionsAction()])

    if (predResult.predictions) {
      setPredictions(predResult.predictions)
    }
    if (selResult.selections) {
      setSelections(selResult.selections)
    }
    setLoading(false)
  }

  const handleDownload = async (prediction: any) => {
    // Encontrar la selección correspondiente
    const selection = selections.find(
      (s) =>
        (s.selection_type === "number" &&
          s.selected_number === prediction.predicted_number &&
          s.lottery_type === prediction.lottery_type) ||
        (s.selection_type === "user" &&
          s.selected_user_id === prediction.user_id &&
          s.lottery_type === prediction.lottery_type),
    )

    if (!selection) {
      alert("No se encontró la selección correspondiente")
      return
    }

    setDownloading(prediction.id)

    try {
      const result = await generatePredictionAction(selection.id)

      if (result.success && result.content && result.filename) {
        // Crear el archivo de texto y descargarlo
        const blob = new Blob([result.content], { type: "text/plain;charset=utf-8" })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = result.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        // Recargar datos para reflejar los créditos actualizados
        await loadData()

        alert(`Pronóstico descargado exitosamente. El crédito ha sido descontado.`)
      } else {
        alert(result.error || "Error al generar el pronóstico")
      }
    } catch (error: any) {
      alert("Error al descargar el pronóstico: " + error.message)
    } finally {
      setDownloading(null)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getConfidenceColor = (level: number) => {
    if (level >= 4) return "text-green-500"
    if (level >= 3) return "text-yellow-500"
    return "text-orange-500"
  }

  const getStatusBadge = (prediction: any) => {
    if (!prediction.is_verified) {
      return <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">En espera</Badge>
    }
    if (prediction.is_correct) {
      return <Badge className="bg-green-500">Acertado ✓</Badge>
    }
    return <Badge variant="destructive">Fallado ✗</Badge>
  }

  const getLotteryTypeLabel = (type: string) => {
    switch (type) {
      case "2_digits":
        return "2 Cifras"
      case "3_digits":
        return "3 Cifras"
      case "4_digits":
        return "4 Cifras"
      default:
        return type
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Cargando pronósticos seleccionados...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Pronósticos de Mis Selecciones
        </CardTitle>
        <CardDescription>
          Pronósticos de los números y usuarios que sigues. Descarga para consumir 1 crédito.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {predictions.length > 0 ? (
          <div className="space-y-3">
            {predictions.map((prediction: any) => (
              <div key={prediction.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{prediction.username}</span>
                      <Badge variant="outline">{getLotteryTypeLabel(prediction.lottery_type)}</Badge>
                      {getStatusBadge(prediction)}
                    </div>

                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-primary" />
                        <span className="font-mono font-bold text-2xl">{prediction.predicted_number}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < prediction.confidence_level
                                ? getConfidenceColor(prediction.confidence_level) + " fill-current"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(prediction.draw_date)}
                      </span>
                      {prediction.draw_time && <span className="capitalize">{prediction.draw_time}</span>}
                    </div>

                    {prediction.notes && <p className="text-sm text-muted-foreground mt-2">{prediction.notes}</p>}
                  </div>

                  <div className="shrink-0">
                    <Button
                      onClick={() => handleDownload(prediction)}
                      disabled={downloading === prediction.id || prediction.status !== "pending"}
                      variant="default"
                      size="sm"
                      className="gap-2"
                    >
                      {downloading === prediction.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Descargar (1 crédito)
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No hay pronósticos disponibles de tus selecciones actuales
          </p>
        )}
      </CardContent>
    </Card>
  )
}
