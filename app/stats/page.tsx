import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export const metadata = {
  robots: { index: false, follow: false },
}
import { getDailyAccuracy, getAccuracyByType, getUserStats } from "@/lib/ranking"
import { DailyAccuracyChart } from "@/components/charts/daily-accuracy-chart"
import { AccuracyByTypeChart } from "@/components/charts/accuracy-by-type-chart"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, TrendingUp, Target, DollarSign, Zap } from "lucide-react"
import { PageWrapper } from "@/components/layout/page-wrapper"

export default async function StatsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const [dailyAccuracy, accuracyByType, userStats] = await Promise.all([
    getDailyAccuracy(user.id),
    getAccuracyByType(user.id),
    getUserStats(user.id),
  ])

  return (
    <PageWrapper user={{ username: user.username, role: user.role, is_premium: user.is_premium }}>
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Dashboard
              </Link>
            </Button>

            <h1 className="text-3xl font-bold mb-2">Mis Estadísticas</h1>
            <p className="text-muted-foreground">Análisis detallado de tu rendimiento</p>
          </div>

        {userStats && (
          <div className="grid md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Pronósticos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span className="text-3xl font-bold">{userStats.total_predictions}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Aciertos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  <span className="text-3xl font-bold">{userStats.correct_predictions}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Precisión</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-primary">
                    {Number(userStats.accuracy_percentage || 0).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Score Combinaciones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <span className="text-3xl font-bold text-purple-600">
                    {(userStats as any).total_score || 0}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Puntos por combinaciones
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Ganancias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-3xl font-bold">
                    ${(Number(userStats.total_earnings_cents || 0) / 100).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

          <div className="space-y-8">
            <DailyAccuracyChart data={dailyAccuracy} />
            <AccuracyByTypeChart data={accuracyByType} />
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
