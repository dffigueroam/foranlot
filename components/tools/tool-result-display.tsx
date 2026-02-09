"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, BarChart3, Download } from "lucide-react"

interface ToolResultDisplayProps {
  result: any
}

export function ToolResultDisplay({ result }: ToolResultDisplayProps) {
  if (!result) return null

  const downloadPrediction = () => {
    const predictions = result.recommendation || result.predictions || []
    const date = new Date(result.generatedAt).toLocaleString("es-CO")

    let content = "==========================================\n"
    content += "   PRONÓSTICO DE LOTERÍA - CHANCE\n"
    content += "==========================================\n\n"
    content += `Herramienta: ${result.toolName}\n`
    content += `Tipo: ${result.lotteryType?.replace("_", " ").toUpperCase()}\n`
    content += `Fecha de Pronóstico: ${result.predictionDate || "Próximo sorteo"}\n`
    content += `Generado: ${date}\n`
    content += `Datos Analizados: ${result.dataPoints || 0} números históricos\n`
    content += "\n------------------------------------------\n"
    content += "  NÚMEROS RECOMENDADOS\n"
    content += "------------------------------------------\n\n"

    predictions.forEach((num: string, idx: number) => {
      content += `  ${idx + 1}. ${num}\n`
    })

    content += "\n------------------------------------------\n"
    content += "  ANÁLISIS DETALLADO\n"
    content += "------------------------------------------\n\n"

    if (result.type === "frequency") {
      content += "Análisis de Frecuencia:\n"
      result.data?.slice(0, 5).forEach((item: any, idx: number) => {
        content += `  ${idx + 1}. ${item.number} - ${item.frequency} apariciones (${item.percentage}%)\n`
      })
    } else if (result.type === "hot_cold") {
      content += "Números Calientes (más frecuentes recientemente):\n"
      result.hot?.forEach((item: any, idx: number) => {
        content += `  ${idx + 1}. ${item.number} - ${item.appearances} apariciones\n`
      })
      content += "\nNúmeros Fríos (menos frecuentes):\n"
      result.cold?.forEach((item: any, idx: number) => {
        content += `  ${idx + 1}. ${item.number} - ${item.appearances} apariciones\n`
      })
    } else if (result.type === "trend") {
      content += `Tendencia: ${result.trend === "ascending" ? "Ascendente" : "Descendente"}\n`
      content += `Promedio: ${result.average}\n`
    } else if (result.type === "distribution") {
      content += `Media: ${result.mean}\n`
      content += `Mediana: ${result.median}\n`
      content += `Desviación Estándar: ${result.stdDev}\n`
      content += `Rango: ${result.min} - ${result.max}\n`
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
    const fileName = `pronostico_${result.lotteryType}_${result.predictionDate || "hoy"}_${Date.now()}.txt`
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
            {result.title}
          </CardTitle>
          <Button onClick={downloadPrediction} variant="default" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Descargar Pronóstico
          </Button>
        </div>
        {result.predictionDate && (
          <p className="text-sm text-muted-foreground">
            Pronóstico para: {new Date(result.predictionDate).toLocaleDateString("es-CO")}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {result.type === "frequency" && (
          <div className="space-y-4">
            <div className="space-y-2">
              {result.data.map((item: any, index: number) => (
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
                {result.recommendation.map((num: string, idx: number) => (
                  <Badge key={idx} className="text-lg px-3 py-1">
                    {num}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {result.type === "hot_cold" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-red-500" />
                Números Calientes
              </h3>
              <div className="flex gap-2 flex-wrap">
                {result.hot.map((item: any, idx: number) => (
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
                {result.cold.map((item: any, idx: number) => (
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
                {result.recommendation.map((num: string, idx: number) => (
                  <Badge key={idx} className="text-lg px-3 py-1">
                    {num}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {result.type === "pattern" && (
          <div className="space-y-4">
            <div className="space-y-2">
              {result.patterns.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="font-mono">{item.pattern}</span>
                  <span className="text-sm text-muted-foreground">{item.occurrences} veces</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded">
              <p className="font-semibold mb-2">Próximos Posibles:</p>
              <div className="flex gap-2 flex-wrap">
                {result.recommendation.map((num: string, idx: number) => (
                  <Badge key={idx} className="text-lg px-3 py-1">
                    {num}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {result.type === "trend" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded">
                <p className="text-sm text-muted-foreground">Tendencia</p>
                <p className="text-lg font-semibold capitalize">{result.trend}</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-sm text-muted-foreground">Promedio</p>
                <p className="text-lg font-semibold">{result.average}</p>
              </div>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded">
              <p className="font-semibold mb-2">Predicciones:</p>
              <div className="flex gap-2 flex-wrap">
                {result.predictions.map((num: string, idx: number) => (
                  <Badge key={idx} className="text-lg px-3 py-1">
                    {num}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {result.type === "combination" && (
          <div className="space-y-4">
            <div className="space-y-2">
              {result.pairs.map((item: any, index: number) => (
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
            {result.recommendation.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded">
                <p className="font-semibold mb-2">Par Más Frecuente:</p>
                <div className="flex gap-2">
                  {result.recommendation.map((num: string, idx: number) => (
                    <Badge key={idx} className="text-lg px-3 py-1">
                      {num}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {result.type === "distribution" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded">
                <p className="text-sm text-muted-foreground">Media</p>
                <p className="text-lg font-semibold">{result.mean}</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-sm text-muted-foreground">Mediana</p>
                <p className="text-lg font-semibold">{result.median}</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-sm text-muted-foreground">Desviación Estándar</p>
                <p className="text-lg font-semibold">{result.stdDev}</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-sm text-muted-foreground">Rango</p>
                <p className="text-lg font-semibold">
                  {result.min} - {result.max}
                </p>
              </div>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded">
              <p className="font-semibold mb-2">Números Recomendados (Distribución Normal):</p>
              <div className="flex gap-2 flex-wrap">
                {result.recommendation.map((num: string, idx: number) => (
                  <Badge key={idx} className="text-lg px-3 py-1">
                    {num}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {result.type === "random" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{result.description}</p>
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded">
              <p className="font-semibold mb-2">Números Generados:</p>
              <div className="flex gap-2 flex-wrap">
                {result.predictions.map((num: string, idx: number) => (
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
}
