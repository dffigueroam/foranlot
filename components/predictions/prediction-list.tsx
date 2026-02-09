"use client"

import type { Prediction } from "@/lib/predictions"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, TrendingUp, User } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface PredictionListProps {
  predictions: Prediction[]
  isPremium: boolean
}

export function PredictionList({ predictions, isPremium }: PredictionListProps) {
  if (predictions.length === 0) {
    return (
      <Card className="prediction-empty">
        <CardContent className="prediction-empty-content">
          <p>No hay pronósticos disponibles</p>
        </CardContent>
      </Card>
    )
  }

  const getLotteryTypeLabel = (type: string) =>
    type === "2_digits" ? "2 Cifras" : type === "3_digits" ? "3 Cifras" : "4 Cifras"

  const getLotteryNameLabel = (name: string) =>
    name === "sin_definir" ? "Lotería sin definir" : name

  const getConfidenceClass = (level: number) => {
    if (level >= 4) return "confidence-high"
    if (level === 3) return "confidence-medium"
    return "confidence-low"
  }

  const getResultBadge = (prediction: Prediction) => {
    if (!prediction.is_verified) {
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
        >
          En espera
        </Badge>
      )
    }

    if (prediction.is_correct) {
      return <Badge className="bg-green-500">Acertado ✓</Badge>
    }

    return <Badge variant="destructive">Fallado ✗</Badge>
  }

  return (
    <div className="prediction-list space-y-4">
      {!isPremium && (
        <Card className="prediction-warning mb-4">
          <CardContent className="prediction-warning-content">
            Estás viendo contenido limitado.{" "}
            <span className="font-semibold">Hazte Premium</span> para ver todos los pronósticos.
          </CardContent>
        </Card>
      )}

      {predictions.map((prediction, index) => {
        const isCompact = index < 3

        return (
          <Card
            key={prediction.id}
            className={`prediction-item border border-border ${
              isCompact ? "shadow-sm" : "shadow-md"
            }`}
          >
            <CardContent
              className={`prediction-item-content flex flex-col gap-4 md:flex-row md:items-start md:justify-between ${
                isCompact ? "p-3" : "p-5"
              }`}
            >
              <div
                className={`prediction-main flex-1 ${
                  isCompact ? "space-y-2" : "space-y-3"
                }`}
              >
                <div className="prediction-header flex flex-wrap items-center gap-2 text-sm">
                  <User className="prediction-user-icon h-4 w-4 text-muted-foreground" />
                  <span className="prediction-username font-medium">
                    {prediction.username}
                  </span>
                  <Badge variant="outline">
                    {getLotteryTypeLabel(prediction.lottery_type)}
                  </Badge>
                </div>

                <div
                  className={`prediction-number font-bold tracking-tight ${
                    isCompact ? "text-2xl" : "text-3xl"
                  }`}
                >
                  {prediction.predicted_number}
                </div>

                <div
                  className={`prediction-meta flex flex-wrap items-center text-muted-foreground ${
                    isCompact ? "gap-2 text-xs" : "gap-3 text-sm"
                  }`}
                >
                  <div className="prediction-meta-item inline-flex items-center gap-1">
                    <Calendar className="prediction-meta-icon h-4 w-4" />
                    {format(new Date(prediction.draw_date), "dd MMM yyyy", {
                      locale: es,
                    })}
                  </div>

                  <Badge variant="secondary">
                    {getLotteryNameLabel(prediction.lottery_name)}
                  </Badge>

                  <span
                    className={`prediction-confidence ${getConfidenceClass(
                      prediction.confidence_level
                    )} text-xs font-semibold`}
                  >
                    Confianza: {prediction.confidence_level}/5
                  </span>
                </div>

                {prediction.is_verified ? (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Resultado: </span>
                    <span className="font-mono font-semibold text-foreground">
                      {prediction.actual_number || "-"}
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Resultado pendiente de verificación
                  </div>
                )}

                {prediction.notes && (
                  <p className="prediction-notes text-sm text-muted-foreground">
                    {prediction.notes}
                  </p>
                )}
              </div>

              <div className="prediction-result shrink-0">
                {getResultBadge(prediction)}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
