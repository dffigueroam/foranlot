"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StrategySimulator } from "@/components/dashboard/strategy-simulator"
import { TrendingUp, Lightbulb } from "lucide-react"

export function StrategiesTab({ preferredCountry = "" }: { preferredCountry?: string }) {
  return (
    <div className="space-y-6">
      <Card className="bg-linear-to-r from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10 border-purple-200 dark:border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Generador de Estrategias
          </CardTitle>
          <CardDescription>
            Crea modelos matemáticos personalizados basados en sorteos anteriores
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <CardTitle className="text-lg">¿Cómo funcionan las estrategias?</CardTitle>
              <CardDescription className="mt-2 space-y-2 text-sm">
                <p>
                  • <strong>Crea reglas</strong> que analizan posiciones de cifras en sorteos pasados
                </p>
                <p>
                  • <strong>Aplica operaciones</strong> matemáticas (suma, resta, espejo, etc.)
                </p>
                <p>
                  • <strong>Combina loterías</strong> tomando cifras de otras loterías como origen
                </p>
                <p>
                  • <strong>Genera números automáticamente</strong> basados en los últimos 15 resultados
                </p>
                <p>
                  • <strong>Simula</strong> para ver qué números se generarían hoy
                </p>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <StrategySimulator preferredCountry={preferredCountry} />
    </div>
  )
}
