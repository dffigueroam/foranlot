export const metadata = {
  robots: { index: false, follow: false },
}

import { redirect } from "next/navigation"
import Link from "next/link"

import { getCurrentUser } from "@/lib/auth"
import { getLatestPostedPredictions, getPredictions } from "@/lib/predictions"
import { fetchVerifiedCorrectPredictions } from "@/app/actions/dashboard"
import { PredictionListWithFilter } from "@/components/dashboard/prediction-list-with-filter"
import { getUserStats } from "@/lib/ranking"
import { PageWrapper } from "@/components/layout/page-wrapper"


import PredictionFormClient from "@/components/predictions/prediction-form-client"
import { PredictionList } from "@/components/predictions/prediction-list"

import LinkRequestsPanelWrapper from "@/components/dashboard/LinkRequestsPanelWrapper"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Crown, TrendingUp, Target, Percent, Sparkles, Zap, Trophy, CalendarDays } from "lucide-react"





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
  // TODO: Reemplazar con versión async que consulta loterías desde la base de datos
  const availableLotteriesToday = []

  const accuracy = Number(userStats?.accuracy_percentage || 0).toFixed(1)

  return (
    <PageWrapper user={{ username: user.username, role: user.role, is_premium: user.is_premium }}>
      <div className="min-h-screen bg-linear-to-br from-background via-green-50/20 dark:via-green-950/10 to-background">
        {/* Elementos decorativos de fondo */}
        <div className="fixed inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
          <div className="absolute top-20 left-20 w-96 h-96 bg-linear-to-br from-green-400 to-cyan-500 rounded-full blur-3xl"></div>
          <div className="absolute top-96 right-0 w-96 h-96 bg-linear-to-bl from-yellow-400 to-orange-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-linear-to-t from-pink-400 to-red-500 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 py-8 space-y-6">

          <section className="relative overflow-hidden rounded-2xl border border-emerald-300/40 dark:border-emerald-500/30 bg-linear-to-r from-emerald-50 via-cyan-50 to-sky-50 dark:from-emerald-950/30 dark:via-cyan-950/25 dark:to-sky-950/20 p-5 md:p-7 shadow-sm">
            <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-cyan-300/30 blur-3xl dark:bg-cyan-500/20" />
            <div className="absolute -left-8 -bottom-10 h-36 w-36 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-500/20" />

            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-sm backdrop-blur dark:border-emerald-500/40 dark:bg-slate-900/70 dark:text-emerald-200">
                  <Zap className="h-3.5 w-3.5" />
                  Panel de publicación activo
                </div>
                <h2 className="mt-3 text-2xl md:text-3xl font-black tracking-tight bg-linear-to-r from-emerald-700 via-cyan-700 to-blue-700 dark:from-emerald-300 dark:via-cyan-300 dark:to-blue-300 bg-clip-text text-transparent">
                  Tu centro de pronósticos
                </h2>
                <p className="mt-1 text-sm md:text-base text-slate-700 dark:text-slate-300">
                  Publica hoy, escala en ranking y convierte tu precisión en resultados reales.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:min-w-92.5">
                <div className="rounded-xl border border-emerald-300/40 bg-white/85 p-3 dark:border-emerald-500/30 dark:bg-slate-900/70">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Verificados</p>
                  <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">{userStats?.total_predictions || 0}</p>
                </div>
                <div className="rounded-xl border border-cyan-300/40 bg-white/85 p-3 dark:border-cyan-500/30 dark:bg-slate-900/70">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Aciertos</p>
                  <p className="text-xl font-black text-cyan-700 dark:text-cyan-300">{userStats?.correct_predictions || 0}</p>
                </div>
                <div className="rounded-xl border border-amber-300/40 bg-white/85 p-3 dark:border-amber-500/30 dark:bg-slate-900/70">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Exactitud</p>
                  <p className="text-xl font-black text-amber-700 dark:text-amber-300">{accuracy}%</p>
                </div>
              </div>
            </div>
          </section>

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
   

          <div className="space-y-4">
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
                    <Trophy className="w-4 h-4 mr-2" />
                    Ver Ranking
                  </Link>
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/50 dark:border-emerald-600/50 bg-white/70 dark:bg-slate-900/70 px-3 py-1 text-xs text-emerald-800 dark:text-emerald-200">
                <CalendarDays className="h-3.5 w-3.5" />
                Fecha de trabajo: {new Intl.DateTimeFormat("es-CO", { dateStyle: "full" }).format(new Date())}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/50 dark:border-cyan-600/50 bg-white/70 dark:bg-slate-900/70 px-3 py-1 text-xs text-cyan-800 dark:text-cyan-200">
                <Target className="h-3.5 w-3.5" />
                Modo: Publicación de pronósticos
              </div>
            </div>
          </div>

          {/* ===== LAYOUT ===== */}
          <div className="grid lg:grid-cols-[2fr_1fr] gap-6">

          {/* COLUMNA IZQUIERDA - Formulario y solicitudes */}
          <div className="space-y-6 rounded-2xl border border-emerald-200/40 dark:border-emerald-700/30 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm p-3 md:p-4">
            <PredictionFormClient preferredCountry={user.country || ""} />
            {/* Panel de solicitudes de vinculación (solo usuario gratis, al final de la columna izquierda) */}
            {!user.is_premium && (
              <div className="mt-6">
                {/* Panel de solicitudes de vinculación */}
                <div className="border rounded bg-yellow-50 dark:bg-yellow-900/10 p-4">
                  <h3 className="font-bold text-yellow-700 dark:text-yellow-300 mb-2">Solicitudes de vinculación</h3>
                  {/* Panel funcional */}
                  {/* Importación dinámica del wrapper server component */}
                  {/* @ts-expect-error Server Component */}
                  <LinkRequestsPanelWrapper />
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA - Pronósticos Recientes */}
          <div className="space-y-6 rounded-2xl border border-cyan-200/40 dark:border-cyan-700/30 bg-white/45 dark:bg-slate-900/30 backdrop-blur-sm p-3 md:p-4">
            {/* Resultados y exactitud */}
            <Card className="bg-linear-to-r from-green-50/40 to-cyan-50/40 dark:from-green-900/15 dark:to-cyan-900/15 border-2 border-green-300/40 dark:border-green-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="bg-linear-to-r from-green-700 to-cyan-700 dark:from-green-300 dark:to-cyan-300 bg-clip-text text-transparent">Resultados y exactitud</CardTitle>
                <CardDescription>
                  Resumen de tus pronósticos y última fecha posteada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
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
            {/* Resumen de lo último posteado (única instancia) */}
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
            {/* Filtro de aciertos al final */}
            <PredictionListWithFilter
              initialPredictions={predictions}
              isPremium={user.is_premium}
              fetchVerifiedCorrectPredictions={fetchVerifiedCorrectPredictions}
            />
          </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}