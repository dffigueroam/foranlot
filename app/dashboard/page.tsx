import { redirect } from "next/navigation"
import Link from "next/link"

import { getCurrentUser } from "@/lib/auth"
import { getLatestPostedPredictions, getPredictions } from "@/lib/predictions"
import { fetchVerifiedCorrectPredictions } from "@/app/actions/dashboard"
import { PredictionListWithFilter } from "@/components/dashboard/prediction-list-with-filter"
import { getUserStats } from "@/lib/ranking"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { getLotteriesForDay, LOTTERIES } from "@/lib/lotteries"

import { PredictionForm } from "@/components/predictions/prediction-form"
import { PredictionList } from "@/components/predictions/prediction-list"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Crown, TrendingUp, Target, Percent, Sparkles } from "lucide-react"





export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  // 🔹 Obtener predicciones de los ultimos 3 dias
  const allPredictions = await getPredictions(user.id)
  const latestPosted = await getLatestPostedPredictions(user.id)
  const userStats = await getUserStats(user.id)


  const predictions = user.is_premium
    ? allPredictions
    : allPredictions.filter(p => p.user_id === user.id)

  const latestNumbersText = Array.from(
    new Set(latestPosted.map(p => p.predicted_number))
  ).join("\n")
  const latestSummaryDate = latestPosted[0]?.created_at
    ? new Intl.DateTimeFormat("es-CO", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(latestPosted[0].created_at))
    : null
  const latestDrawDate = latestPosted[0]?.draw_date
    ? new Intl.DateTimeFormat("es-CO", {
        dateStyle: "medium",
      }).format(new Date(latestPosted[0].draw_date))
    : null
  const latestLotteriesText = Array.from(
    new Set(
      latestPosted.map(p =>
        p.lottery_name === "sin_definir" ? "Lotería sin definir" : p.lottery_name
      )
    )
  ).join(" - ")

  // === NUEVO: Resumen de loterías disponibles hoy ===
  // Determinar día actual y país por defecto (Colombia)
  const today = new Date()
  const days = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]
  const todayName = days[today.getDay()]
  const defaultCountry = "Colombia"
  const availableLotteriesToday = getLotteriesForDay(todayName, defaultCountry)

  return (
    <PageWrapper user={{ username: user.username, role: user.role, is_premium: user.is_premium }}>
      <div className="min-h-screen bg-gradient-to-br from-background via-green-50/20 dark:via-green-950/10 to-background">
        {/* Elementos decorativos de fondo */}
        <div className="fixed inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
          <div className="absolute top-20 left-20 w-96 h-96 bg-linear-to-br from-green-400 to-cyan-500 rounded-full blur-3xl"></div>
          <div className="absolute top-96 right-0 w-96 h-96 bg-linear-to-bl from-yellow-400 to-orange-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-linear-to-t from-pink-400 to-red-500 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 py-8">

       {/* PREMIUM */}
            {user.is_premium && (
              <Card className="bg-linear-to-r from-yellow-50 to-orange-50 dark:from-yellow-500/10 dark:to-orange-500/10 border border-yellow-500/30">
                <CardContent className="py-3 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <span className="font-semibold text-yellow-900 dark:text-yellow-400 text-sm">
                    Cuenta Premium Activa
                  </span>
                </CardContent>
              </Card>
            )}  

       
          {/* ===== HEADER ===== */}
   

          <div className="mb-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-linear-to-r from-green-600 to-cyan-600 dark:from-green-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  Publica Pronósticos
                </h1>
                <p className="text-muted-foreground">
                Comparte tus predicciones y gana dinero
              </p>
              </div>

              <div className="flex gap-2">
                {user.is_premium ? (
                  <Button asChild>
                    <Link href="/premium">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Zona Premium
                    </Link>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href="/pricing">
                      <Crown className="w-4 h-4 mr-2" />
                      Hazte Premium
                    </Link>
                  </Button>
                )}

                <Button variant="outline" asChild>
                  <Link href="/ranking">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Ver Ranking
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* ===== LAYOUT ===== */}
          <div className="grid lg:grid-cols-[2fr_1fr] gap-6">

          {/* COLUMNA IZQUIERDA - Formulario */}
          <div className="space-y-6">
            <PredictionForm />
          </div>

          {/* COLUMNA DERECHA - Pronósticos Recientes */}
          <div className="space-y-6">
            {/* Botón y lista de predicciones con filtro de aciertos */}
            <PredictionListWithFilter
              initialPredictions={predictions}
              isPremium={user.is_premium}
              fetchVerifiedCorrectPredictions={fetchVerifiedCorrectPredictions}
            />
            {/* Mostrar "Resultados y exactitud" cuando hay estadísticas */}
            <Card className="bg-linear-to-r from-green-50/40 to-cyan-50/40 dark:from-green-900/15 dark:to-cyan-900/15 border-2 border-green-300/40 dark:border-green-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="bg-linear-to-r from-green-700 to-cyan-700 dark:from-green-300 dark:to-cyan-300 bg-clip-text text-transparent">Resultados y exactitud</CardTitle>
                <CardDescription>
                  Resumen de tus pronósticos y última fecha posteada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Estadísticas - solo si hay verificados */}
                  {userStats && userStats.total_predictions > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">Verificados</p>
                          <p className="text-lg font-semibold">{userStats.total_predictions}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">Aciertos</p>
                          <p className="text-lg font-semibold">{userStats.correct_predictions}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-amber-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">Exactitud</p>
                          <p className="text-lg font-semibold">
                            {Number(userStats.accuracy_percentage || 0).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mensaje si no hay pronósticos */}
                  {userStats && userStats.total_predictions === 0 && (
                    <div className="border-t pt-4">
                      <p className="text-sm text-muted-foreground">
                        Aún no has creado pronósticos.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Mostrar "Resumen de lo último posteado" siempre que haya posts recientes */}
            {latestPosted.length > 0 && (
              <Card className="bg-linear-to-br from-green-50/40 to-emerald-50/40 dark:from-green-900/10 dark:to-emerald-900/10 border-l-4 border-l-green-400 dark:border-l-green-500 border border-green-300/30 dark:border-green-500/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="bg-linear-to-r from-green-700 to-emerald-700 dark:from-green-300 dark:to-emerald-300 bg-clip-text text-transparent">Resumen de lo último posteado</CardTitle>
                  <CardDescription>
                    Pronósticos recientes publicados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {latestSummaryDate && (
                      <p className="text-sm text-muted-foreground">
                        Fecha de registro: {latestSummaryDate}
                      </p>
                    )}
                    {latestDrawDate && (
                      <p className="text-sm text-muted-foreground">
                        Fecha de sorteo: {latestDrawDate}
                      </p>
                    )}
                    <p className="whitespace-pre-line font-mono text-lg">
                      {latestNumbersText}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Loteria: {latestLotteriesText}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-linear-to-r from-cyan-50/40 to-blue-50/40 dark:from-cyan-900/10 dark:to-blue-900/10 border-t-4 border-t-cyan-400 dark:border-t-cyan-500 border border-cyan-300/30 dark:border-cyan-500/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="bg-linear-to-r from-cyan-700 to-blue-700 dark:from-cyan-300 dark:to-blue-300 bg-clip-text text-transparent">Pronósticos Posteados</CardTitle>
                <CardDescription>
                  Ultimos 3 dias de predicciones
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100vh-1.5rem)]">
                <div className="h-full">
                  <PredictionList
                    predictions={predictions}
                    isPremium={user.is_premium}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </PageWrapper>
  )
}