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

  predictions: Prediction[];
  isPremium: boolean;
}

export function PredictionList({ predictions, isPremium }: PredictionListProps) {
  const [filter, setFilter] = useState<string>("all");
  const [filteredPredictions, setFilteredPredictions] = useState<Prediction[]>(predictions);

  // Funciones auxiliares
  const isCorrectTrue = (value: Prediction["is_correct"]) =>
    value === true || value === "true" || value === "t" || value === 1;
  const isCorrectFalse = (value: Prediction["is_correct"]) =>
    value === false || value === "false" || value === "f" || value === 0;

  const getResultBadge = (prediction: Prediction) => {
    if (!prediction.is_verified) {
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs py-0.5"
        >
          En espera
        </Badge>
      );
    }
    if (isCorrectTrue(prediction.is_correct) || prediction.match_type === "exact") {
      return (
        <div className="flex flex-col gap-1 items-end">
          <Badge className="bg-green-500 text-xs py-0.5">Acertado ✓</Badge>
        </div>
      );
    }
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
      );
    }
    if (isCorrectFalse(prediction.is_correct) || prediction.match_type === "no_match") {
      const label =
        prediction.lottery_type === "2_digits"
          ? "Sin acierto 2 cifras"
          : prediction.lottery_type === "3_digits"
          ? "Sin acierto 3 cifras"
          : "Sin acierto 4 cifras";
      return <Badge variant="destructive" className="text-xs py-0.5">{label}</Badge>;
    }
    // Fallback
    return (
      <Badge variant="outline" className="text-muted-foreground text-xs py-0.5">
        Desconocido
      </Badge>
    );
  };

  if (predictions.length === 0) {
    return (
      <Card className="prediction-empty">
        <CardContent className="prediction-empty-content">
          <p>No hay pronósticos disponibles</p>
        </CardContent>
      </Card>
    );
  }


  const getLotteryTypeLabel = (type: string) =>
    type === "2_digits" ? "2 Cifras" : type === "3_digits" ? "3 Cifras" : "4 Cifras";

  const getLotteryNameLabel = (name: string) =>
    name === "sin_definir" ? "Lotería sin definir" : name;

  // Filtros de predicciones
  useEffect(() => {
    let result: Prediction[] = [];
    switch (filter) {
      case "correct": {
        // Mostrar aciertos de los últimos 60 días
        const now = new Date();
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        result = predictions.filter(
          p => {
            if (!p.is_verified) return false;
            if (!(isCorrectTrue(p.is_correct) || p.match_type === "exact")) return false;
            // Si quieres todos los históricos, comenta la siguiente línea:
            if (new Date(p.draw_date) < sixtyDaysAgo) return false;
            return true;
          }
        );
        break;
      }
      case "pending":
        result = predictions.filter(p => !p.is_verified);
        break;
      case "incorrect":
        result = predictions.filter(
          p => p.is_verified && (isCorrectFalse(p.is_correct) || p.match_type === "no_match")
        );
        break;
      case "combinations":
        result = predictions.filter(
          p => p.is_verified && p.match_type === "combination"
        );
        break;
      case "all":
      default:
        result = predictions;
        break;
    }
    setFilteredPredictions(result);
  }, [filter, predictions]);

  // Renderizado de filtros y lista
  return (
    <div className="prediction-list flex flex-col h-full">
      <div className="flex items-center gap-4 mb-2">
        <span className="text-xs text-muted-foreground">Total: <b>{predictions.length}</b></span>
        <Button
          variant={filter === "correct" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("correct")}
          className={`text-xs flex items-center gap-1 ${filter === "correct" ? "bg-green-600 text-white hover:bg-green-700 border-green-700" : "border-green-600 text-green-700"}`}
        >
          <span className="text-lg">✓</span> Ver solo aciertos
        </Button>
      </div>
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
            variant={filter === "combinations" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("combinations")}
            className="text-xs"
          >
            Combinaciones ({predictions.filter(p => p.is_verified && p.match_type === "combination").length})
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
            Sin acierto ({predictions.filter(
              p => p.is_verified && (isCorrectFalse(p.is_correct) || p.match_type === "no_match")
            ).length})
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {filteredPredictions.length === 0 && (
          <Card className="prediction-empty">
            <CardContent className="prediction-empty-content">
              <p>No hay pronósticos en esta categoría</p>
            </CardContent>
          </Card>
        )}
        {filteredPredictions.map((prediction, index) => (
          <Card key={prediction.id} className="prediction-item border border-border shadow-sm">
            <CardContent className="prediction-item-content flex flex-col gap-2">
              {/* Aquí puedes renderizar los datos de cada predicción */}
              <div className="prediction-header flex flex-wrap items-center gap-1.5 text-xs">
                <User className="prediction-user-icon h-3.5 w-3.5 text-muted-foreground" />
                <span className="prediction-username font-medium">
                  {prediction.username}
                </span>
                <Badge variant="outline" className="text-xs py-0">
                  {getLotteryTypeLabel(prediction.lottery_type)}
                </Badge>
              </div>
              <div className="prediction-number font-bold tracking-tight text-xl">
                {prediction.predicted_number}
              </div>
              <div className="text-muted-foreground text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium text-foreground">País:</span>
                  <span>{getLotteryNameLabel(prediction.lottery_name)}</span>
                </div>
              </div>
              <div className="prediction-result shrink-0">
                {getResultBadge(prediction)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


