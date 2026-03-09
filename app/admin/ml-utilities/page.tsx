import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Brain } from "lucide-react"
import { MLOverviewCard } from "@/components/admin/ml-overview-card"
import { MLRankedPredictionsCard } from "@/components/admin/ml-ranked-predictions-card"
import { MLEvaluationHistoryCard } from "@/components/admin/ml-evaluation-history-card"

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function MLUtilitiesPage() {
  const user = await getCurrentUser()

  // Protección: Solo administradores
  if (!user) {
    redirect("/login")
  }

  if (user.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Admin
            </Link>
          </Button>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Brain className="w-8 h-8 text-purple-500" />
              ML Utilities - Sistema de Análisis de Predicciones
            </h1>
            <p className="text-muted-foreground">
              Herramientas avanzadas para analizar, evaluar y rankear predicciones mediante machine learning.
              Acceso exclusivo para administradores.
            </p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="space-y-6">
          {/* Overview Card */}
          <MLOverviewCard />

          {/* Statistics and Ranked Predictions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Placeholder for more stats */}
            <div className="space-y-6">
              <div className="p-6 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-500" />
                  Sobre ML Engine
                </h3>
                <p className="text-sm text-muted-foreground">
                  El sistema de Machine Learning analiza predicciones históricas para:
                </p>
                <ul className="text-sm text-muted-foreground mt-3 space-y-1 ml-4 list-disc">
                  <li>Calcular scores de confianza basados en features extraídas</li>
                  <li>Evaluar desempeño histórico del modelo</li>
                  <li>Rankear predicciones por probabilidad de éxito</li>
                  <li>Proporcionar recomendaciones a usuarios</li>
                </ul>
              </div>
            </div>

            {/* Ranked Predictions - será mostrado bajo overview */}
          </div>

          {/* Ranked Predictions */}
          <MLRankedPredictionsCard />

          {/* Evaluation History */}
          <MLEvaluationHistoryCard />

          {/* Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950/50 dark:to-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-sm mb-2">🎯 Features Extraídas</h4>
              <p className="text-xs text-muted-foreground">
                Frecuencia de números, patrón de dígitos, recencia, volatilidad y exactitud histórica.
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-950/50 dark:to-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold text-sm mb-2">📊 Pesos del Modelo</h4>
              <p className="text-xs text-muted-foreground">
                Aporte económico (50%), recencia (25%), volatilidad (15%), exactitud histórica (35%).
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-950/50 dark:to-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-sm mb-2">🔄 Actualización</h4>
              <p className="text-xs text-muted-foreground">
                El modelo se entrena automáticamente con nuevas predicciones verificadas diariamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
