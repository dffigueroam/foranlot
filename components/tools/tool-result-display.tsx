"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, BarChart3, Download } from "lucide-react"
import React, { useMemo } from "react"

interface ToolResultDisplayProps {
  result: any
}

export const ToolResultDisplay = React.memo(function ToolResultDisplay({ result }) {
  const memoizedResult = useMemo(() => result, [result])
  if (!memoizedResult) return null

  const downloadPrediction = () => {
    const predictions = memoizedResult.recommendation || memoizedResult.predictions || []
    const date = new Date(memoizedResult.generatedAt).toLocaleString("es-CO")

    let content = "==========================================\n"
    content += "   PRONÓSTICO DE LOTERÍA - CHANCE\n"
    content += "==========================================\n\n"
    content += `Herramienta: ${memoizedResult.toolName}\n`
    content += `Tipo: ${memoizedResult.lotteryType?.replace("_", " ").toUpperCase()}\n`
    content += `Fecha de Pronóstico: ${memoizedResult.predictionDate || "Próximo sorteo"}\n`
    content += `Generado: ${date}\n`
    content += `Datos Analizados: ${memoizedResult.dataPoints || 0} números históricos\n`
    content += "\n------------------------------------------\n"
    content += "  NÚMEROS RECOMENDADOS\n"
    content += "------------------------------------------\n\n"

    predictions.forEach((num: string, idx: number) => {
      content += `  ${idx + 1}. ${num}\n`
    })

    content += "\n------------------------------------------\n"
    content += "  ANÁLISIS DETALLADO\n"
    content += "------------------------------------------\n\n"

    if (memoizedResult.type === "frequency") {
      content += "Análisis de Frecuencia:\n"
      memoizedResult.data?.slice(0, 5).forEach((item: any, idx: number) => {
        content += `  ${idx + 1}. ${item.number} - ${item.frequency} apariciones (${item.percentage}%)\n`
      })
    } else if (memoizedResult.type === "hot_cold") {
      content += "Números Calientes (más frecuentes recientemente):\n"
      memoizedResult.hot?.forEach((item: any, idx: number) => {
        content += `  ${idx + 1}. ${item.number} - ${item.appearances} apariciones\n`
      })
      content += "\nNúmeros Fríos (menos frecuentes):\n"
      memoizedResult.cold?.forEach((item: any, idx: number) => {
        content += `  ${idx + 1}. ${item.number} - ${item.appearances} apariciones\n`
      })
    } else if (memoizedResult.type === "trend") {
      content += `Tendencia: ${memoizedResult.trend === "ascending" ? "Ascendente" : "Descendente"}\n`
      content += `Promedio: ${memoizedResult.average}\n`
    } else if (memoizedResult.type === "distribution") {
      content += `Media: ${memoizedResult.mean}\n`
      content += `Mediana: ${memoizedResult.median}\n`
      content += `Desviación Estándar: ${memoizedResult.stdDev}\n`
      content += `Rango: ${memoizedResult.min} - ${memoizedResult.max}\n`
    }

    content += "\n==========================================\n"
    content += "AVISO: Este pronóstico es solo una\n"
    content += "herramienta de análisis estadístico.\n"
    content += "Juegue responsablemente.\n"
    content += "==========================================\n"

    // Crear y descargar el archivo
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    const fileName = `pronostico_${memoizedResult.lotteryType}_${memoizedResult.predictionDate || "hoy"}_${Date.now()}.txt`
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {memoizedResult.title}
          </CardTitle>
          <Button onClick={downloadPrediction} variant="default" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Descargar Pronóstico
          </Button>
        </div>
        {memoizedResult.predictionDate && (
          <p className="text-sm text-muted-foreground">
            Pronóstico para: {new Date(memoizedResult.predictionDate).toLocaleDateString("es-CO")}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {memoizedResult.type === "frequency" && (
          <div className="space-y-4">
            <div className="space-y-2">
              {memoizedResult.data.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="font-bold text-lg">{item.number}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {item.frequency} veces ({item.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded">
              <p className="font-semibold mb-2">Números Recomendados:</p>
              <div className="flex gap-2 flex-wrap">
                {memoizedResult.recommendation.map((num: string, idx: number) => (
                  <Badge key={idx} className="text-lg px-3 py-1">
                    {num}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {memoizedResult.type === "hot_cold" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-red-500" />
                Números Calientes
              </h3>
              <div className="flex gap-2 flex-wrap">
                {memoizedResult.hot.map((item: any, idx: number) => (
                  <div key={idx} className="bg-red-100 dark:bg-red-950 px-3 py-2 rounded">
                    <span className="font-bold">{item.number}</span>
                    <span className="text-xs ml-2">({item.appearances})</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-blue-500" />
                Números Fríos
              </h3>
              <div className="flex gap-2 flex-wrap">
                {memoizedResult.cold.map((item: any, idx: number) => (
                  <div key={idx} className="bg-blue-100 dark:bg-blue-950 px-3 py-2 rounded">
                    <span className="font-bold">{item.number}</span>
                    <span className="text-xs ml-2">({item.appearances})</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded">
              <p className="font-semibold mb-2">Números Recomendados:</p>
              <div className="flex gap-2 flex-wrap">
                {memoizedResult.recommendation.map((num: string, idx: number) => (
                  <Badge key={idx} className="text-lg px-3 py-1">
                    {num}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {memoizedResult.type === "pattern" && (
          <div className="space-y-4">
            <div className="space-y-2">
              {memoizedResult.patterns.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="font-mono">{item.pattern}</span>
                  <span className="text-sm text-muted-foreground">{item.occurrences} veces</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded">
              <p className="font-semibold mb-2">Próximos Posibles:</p>
              <div className="flex gap-2 flex-wrap">
                {memoizedResult.recommendation.map((num: string, idx: number) => (
                  <Badge key={idx} className="text-lg px-3 py-1">
                    {num}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {memoizedResult.type === "trend" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded">
                <p className="text-sm text-muted-foreground">Tendencia</p>
                <p className="text-lg font-semibold capitalize">{memoizedResult.trend}</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-sm text-muted-foreground">Promedio</p>
                <p className="text-lg font-semibold">{memoizedResult.average}</p>
              </div>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded">
              <p className="font-semibold mb-2">Predicciones:</p>
              <div className="flex gap-2 flex-wrap">
                {memoizedResult.predictions.map((num: string, idx: number) => (
                  <Badge key={idx} className="text-lg px-3 py-1">
                    {num}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {memoizedResult.type === "combination" && (
          <div className="space-y-4">
            <div className="space-y-2">
              {memoizedResult.pairs.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex gap-2">
                    {item.numbers.map((num: string, idx: number) => (
                      <Badge key={idx} variant="outline">
                        {num}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">{item.occurrences} veces juntos</span>
                </div>
              ))}
            </div>
            {memoizedResult.recommendation.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded">
                <p className="font-semibold mb-2">Par Más Frecuente:</p>
                <div className="flex gap-2">
                  {memoizedResult.recommendation.map((num: string, idx: number) => (
                    <Badge key={idx} className="text-lg px-3 py-1">
                      {num}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {memoizedResult.type === "distribution" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded">
                <p className="text-sm text-muted-foreground">Media</p>
                <p className="text-lg font-semibold">{memoizedResult.mean}</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-sm text-muted-foreground">Mediana</p>
                <p className="text-lg font-semibold">{memoizedResult.median}</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-sm text-muted-foreground">Desviación Estándar</p>
                <p className="text-lg font-semibold">{memoizedResult.stdDev}</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-sm text-muted-foreground">Rango</p>
                <p className="text-lg font-semibold">
                  {memoizedResult.min} - {memoizedResult.max}
                </p>
              </div>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded">
              <p className="font-semibold mb-2">Números Recomendados (Distribución Normal):</p>
              <div className="flex gap-2 flex-wrap">
                {memoizedResult.recommendation.map((num: string, idx: number) => (
                  <Badge key={idx} className="text-lg px-3 py-1">
                    {num}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {memoizedResult.type === "random" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{memoizedResult.description}</p>
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded">
              <p className="font-semibold mb-2">Números Generados:</p>
              <div className="flex gap-2 flex-wrap">
                {memoizedResult.predictions.map((num: string, idx: number) => (
                  <Badge key={idx} className="text-lg px-3 py-1">
                    {num}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
})
