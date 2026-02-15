"use client"

import { useState, useCallback, useEffect } from "react"
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
  const [filteredPredictions, setFilteredPredictions] = useState<Prediction[]>(predictions)

  const isCorrectTrue = (value: Prediction["is_correct"]) =>
    value === true || value === "true" || value === "t" || value === 1

  const isCorrectFalse = (value: Prediction["is_correct"]) =>
    value === false || value === "false" || value === "f" || value === 0

  // Effect para actualizar predicciones filtradas cuando cambia el filtro o las predicciones
  useEffect(() => {
    console.log("[PredictionList] Filtering - Current filter:", filter)
    console.log("[PredictionList] Total predictions available:", predictions.length)
    
    let result: Prediction[] = []
    
    switch (filter) {
      case "correct":
        result = predictions.filter(
          p => p.is_verified && (isCorrectTrue(p.is_correct) || p.match_type === "exact")
        )
        console.log("[PredictionList] Filtered to CORRECT (exact):", result.length)
        break
      case "pending":
        result = predictions.filter(p => !p.is_verified)
        console.log("[PredictionList] Filtered to PENDING:", result.length)
        break
      case "incorrect":
        result = predictions.filter(
          p =>
            p.is_verified &&
            (isCorrectFalse(p.is_correct) || p.match_type === "no_match")
        )
        console.log("[PredictionList] Filtered to INCORRECT:", result.length)
        break
      case "combinations":
        result = predictions.filter(
          p => p.is_verified && p.match_type === "combination"
        )
        console.log("[PredictionList] Filtered to COMBINATIONS:", result.length)
        break
      case "all":
      default:
        result = predictions
        console.log("[PredictionList] Filtered to ALL:", result.length)
        break
    }
    
    setFilteredPredictions(result)
  }, [filter, predictions])

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

  const getConfidenceClass = (level: number) => {
    if (level >= 4) return "confidence-high"
    if (level === 3) return "confidence-medium"
    return "confidence-low"
  }

  const getConfidencePercentage = (level: number) => {
    return (level / 5) * 100
  }

  const getResultBadge = (prediction: Prediction) => {
    if (!prediction.is_verified) {
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs py-0.5"
        >
          En espera
        </Badge>
      )
    }

    // Usar is_correct si existe, con fallback a match_type
    if (isCorrectTrue(prediction.is_correct) || prediction.match_type === "exact") {
      return (
        <div className="flex flex-col gap-1 items-end">
          <Badge className="bg-green-500 text-xs py-0.5">Acertado ✓</Badge>
        </div>
      )
    }

    // Verificar si hay combinación
    if (prediction.match_type === "combination") {
      return (
        <div className="flex flex-col gap-1 items-end">
          <Badge className="bg-yellow-500 dark:bg-yellow-600 text-xs py-0.5">
            Combinación
          </Badge>
          {prediction.match_score && (
            <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
              +{prediction.match_score} pts
            </span>
          )}
        </div>
      )
    }

    // Sin acierto
    if (isCorrectFalse(prediction.is_correct) || prediction.match_type === "no_match") {
      const label =
        prediction.lottery_type === "2_digits"
          ? "Sin acierto 2 cifras"
          : prediction.lottery_type === "3_digits"
            ? "Sin acierto 3 cifras"
            : "Sin acierto 4 cifras"
      return <Badge variant="destructive" className="text-xs py-0.5">{label}</Badge>
    }

    // Fallback (no debería ocurrir)
    return (
      <Badge variant="outline" className="text-muted-foreground text-xs py-0.5">
        Desconocido
      </Badge>
    )
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
            Aciertos (
            {predictions.filter(
              p => p.is_verified && (isCorrectTrue(p.is_correct) || p.match_type === "exact")
            ).length}
            )
          </Button>
          <Button
            variant={filter === "combinations" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("combinations")}
            className="text-xs"
          >
            Combinaciones (
            {predictions.filter(p => p.is_verified && p.match_type === "combination").length}
            )
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
            Sin acierto (
            {predictions.filter(
              p => p.is_verified && (isCorrectFalse(p.is_correct) || p.match_type === "no_match")
            ).length}
            )
          </Button>
        </div>
      </div>

      {/* Lista con scroll */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {/* Mensaje si no hay resultados con el filtro actual */}
        {filteredPredictions.length === 0 && (
          <Card className="prediction-empty">
            <CardContent className="prediction-empty-content">
              <p>No hay pronósticos en esta categoría</p>
            </CardContent>
          </Card>
        )}

        {filteredPredictions.map((prediction, index) => {
        const isCompact = true

        return (
          <Card
            key={prediction.id}
            className={`prediction-item border border-border ${
              isCompact ? "shadow-sm" : "shadow-md"
            }`}
          >
            <CardContent
              className={`prediction-item-content flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between ${
                isCompact ? "p-2" : "p-5"
              }`}
            >
              <div
                className={`prediction-main flex-1 min-w-0 ${
                  isCompact ? "space-y-1" : "space-y-3"
                }`}
              >
                <div className="prediction-header flex flex-wrap items-center gap-1.5 text-xs">
                  <User className="prediction-user-icon h-3.5 w-3.5 text-muted-foreground" />
                  <span className="prediction-username font-medium">
                    {prediction.username}
                  </span>
                  <Badge variant="outline" className="text-xs py-0">
                    {getLotteryTypeLabel(prediction.lottery_type)}
                  </Badge>
                </div>

                <div
                  className={`prediction-number font-bold tracking-tight ${
                    isCompact ? "text-xl" : "text-3xl"
                  }`}
                >
                  {prediction.predicted_number}
                </div>

                <div className={`text-muted-foreground ${isCompact ? "text-xs" : "text-sm"}`}>
                  <div className={`flex flex-wrap items-center ${isCompact ? "gap-1.5" : "gap-3"}`}>
                    <span className="font-medium text-foreground">País:</span>
                    <span>{getCountryLabel(prediction.lottery_name) || "-"}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="font-medium text-foreground">Cantidad Cifras:</span>
                    <span>{getLotteryTypeLabel(prediction.lottery_type)}</span>
                  </div>

                  <div className={`mt-1 flex flex-wrap items-center ${isCompact ? "gap-1.5" : "gap-3"}`}>
                    <div className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(prediction.draw_date), "dd MMM yyyy", {
                        locale: es,
                      })}
                    </div>
                  </div>

                  <div className="mt-1">
                    <Badge variant="secondary" className="text-xs py-0">
                      {getLotteryNameLabel(prediction.lottery_name)}
                    </Badge>
                  </div>
                </div>

                {prediction.is_verified ? (
                  <div className="text-xs">
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
                  <p className="prediction-notes text-xs text-muted-foreground">
                    {prediction.notes}
                  </p>
                )}

                <div className="mt-1 pt-1 border-t border-border">
                  <span
                    className={`prediction-confidence ${getConfidenceClass(
                      prediction.confidence_level
                    )} text-xs font-semibold`}
                  >
                    Confianza: {getConfidencePercentage(prediction.confidence_level)}%
                  </span>
                </div>
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
