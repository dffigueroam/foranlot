"use client"

import { useState } from "react"
import type { Prediction } from "@/lib/predictions"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, TrendingUp, User, Filter } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { LOTTERIES } from "@/lib/lotteries"

interface PredictionListProps {
  predictions: Prediction[]
  isPremium: boolean
}

type FilterType = "all" | "correct" | "pending" | "incorrect" | "combinations"

export function PredictionList({ predictions, isPremium }: PredictionListProps) {
  const [filter, setFilter] = useState<FilterType>("all")

  // Aplicar filtro
  const filteredPredictions = predictions.filter(prediction => {
    switch (filter) {
      case "correct":
        return prediction.is_verified && prediction.is_correct
      case "pending":
        return !prediction.is_verified
      case "incorrect":
        return prediction.is_verified && !prediction.is_correct && (!prediction.match_score || prediction.match_score === 0)
      case "combinations":
        return prediction.is_verified && prediction.match_score && prediction.match_score > 0
      case "all":
      default:
        return true
    }
  })

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

  const getCountryLabel = (name: string) => {
    const match = LOTTERIES.find((lottery) => lottery.name === name)
    return match?.country || ""
  }

  const getDrawTimeLabel = (drawTime: string | null | undefined) =>
    drawTime && drawTime !== "null" ? drawTime : "Sin horario"

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
      return (
        <div className="flex flex-col gap-1 items-end">
          <Badge className="bg-green-500">Acertado ✓</Badge>
        </div>
      )
    }

    // Verificar si hay combinación (score > 0)
    if (prediction.match_score && prediction.match_score > 0) {
      return (
        <div className="flex flex-col gap-1 items-end">
          <Badge className="bg-yellow-500 dark:bg-yellow-600">
            Combinación
          </Badge>
          <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
            +{prediction.match_score} pts
          </span>
        </div>
      )
    }

    const label =
      prediction.lottery_type === "2_digits"
        ? "Sin acierto 2 cifras"
        : prediction.lottery_type === "3_digits"
          ? "Sin acierto 3 cifras"
          : "Sin acierto 4 cifras"
    return <Badge variant="destructive">{label}</Badge>
  }

  return (
    <div className="prediction-list flex flex-col h-full">
      {!isPremium && (
        <Card className="prediction-warning mb-4">
          <CardContent className="prediction-warning-content">
            Estás viendo contenido limitado.{" "}
            <span className="font-semibold">Hazte Premium</span> para ver todos los pronósticos.
          </CardContent>
        </Card>
      )}

      {/* Filtros Fijos */}
      <div className="shrink-0 mb-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className="text-xs"
          >
            <Filter className="w-3 h-3 mr-1" />
            Todos ({predictions.length})
          </Button>
          <Button
            variant={filter === "correct" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("correct")}
            className="text-xs"
          >
            Aciertos ({predictions.filter(p => p.is_verified && p.is_correct).length})
          </Button>
          <Button
            variant={filter === "combinations" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("combinations")}
            className="text-xs"
          >
            Combinaciones ({predictions.filter(p => p.is_verified && p.match_score && p.match_score > 0).length})
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("pending")}
            className="text-xs"
          >
            Pendientes ({predictions.filter(p => !p.is_verified).length})
          </Button>
          <Button
            variant={filter === "incorrect" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("incorrect")}
            className="text-xs"
          >
            Sin acierto ({predictions.filter(p => p.is_verified && !p.is_correct && (!p.match_score || p.match_score === 0)).length})
          </Button>
        </div>
      </div>

      {/* Lista con scroll */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {/* Mensaje si no hay resultados con el filtro actual */}
        {filteredPredictions.length === 0 && (
          <Card className="prediction-empty">
            <CardContent className="prediction-empty-content">
              <p>No hay pronósticos en esta categoría</p>
            </CardContent>
          </Card>
        )}

        {filteredPredictions.map((prediction, index) => {
        const isCompact = index < 3

        return (
          <Card
            key={prediction.id}
            className={`prediction-item border border-border ${
              isCompact ? "shadow-sm" : "shadow-md"
            }`}
          >
            <CardContent
              className={`prediction-item-content flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between ${
                isCompact ? "p-3" : "p-5"
              }`}
            >
              <div
                className={`prediction-main flex-1 min-w-0 ${
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

                <div className={`text-muted-foreground ${isCompact ? "text-xs" : "text-sm"}`}>
                  <div className={`flex flex-wrap items-center ${isCompact ? "gap-2" : "gap-3"}`}>
                    <span className="font-medium text-foreground">País:</span>
                    <span>{getCountryLabel(prediction.lottery_name) || "-"}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="font-medium text-foreground">Cantidad Cifras:</span>
                    <span>{getLotteryTypeLabel(prediction.lottery_type)}</span>
                  </div>

                  <div className={`mt-2 flex flex-wrap items-center ${isCompact ? "gap-2" : "gap-3"}`}>
                    <div className="inline-flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(prediction.draw_date), "dd MMM yyyy", {
                        locale: es,
                      })}
                    </div>
                    <span className="text-muted-foreground">·</span>
                    <span>Horario: {getDrawTimeLabel(prediction.draw_time)}</span>
                    <span className="text-muted-foreground">·</span>
                    <span
                      className={`prediction-confidence ${getConfidenceClass(
                        prediction.confidence_level
                      )} text-xs font-semibold`}
                    >
                      Confianza: {prediction.confidence_level}/5
                    </span>
                  </div>

                  <div className="mt-2">
                    <Badge variant="secondary">
                      {getLotteryNameLabel(prediction.lottery_name)}
                    </Badge>
                  </div>
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
    </div>
  )
}
