import { redirect } from "next/navigation"
import Link from "next/link"

import { getCurrentUser } from "@/lib/auth"
import { getPredictions } from "@/lib/predictions"
import { getUserStats } from "@/lib/ranking"
import { getUserPaymentRequests } from "@/lib/manual-payments"
import { PageWrapper } from "@/components/layout/page-wrapper"

import { PredictionForm } from "@/components/predictions/prediction-form"
import { PredictionList } from "@/components/predictions/prediction-list"
import { PaymentStatusAlert } from "@/components/dashboard/payment-status-alert"

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

  // 🔹 Obtener TODAS las predicciones (hasta 100 registros)
  const allPredictions = await getPredictions(user.id, 100)

  // 🔐 LÓGICA PREMIUM
  const predictions = user.is_premium
    ? allPredictions
    : allPredictions.filter(p => p.user_id === user.id)

  const userStats = await getUserStats(user.id)
  const payments = (await getUserPaymentRequests(user.id)).map(p => ({
    ...p,
    amountCents: p.amount_cents ?? 0,
  }))

  return (
    <PageWrapper user={{ username: user.username, role: user.role }}>
      <div className="min-h-screen bg-background">
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
                <h1 className="text-3xl font-bold">
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

          <PaymentStatusAlert payments={payments} />
        </div>

        {/* ===== LAYOUT ===== */}
        <div className="grid lg:grid-cols-[2fr_1fr] gap-6">

          {/* COLUMNA IZQUIERDA - Formulario */}
          <div className="space-y-6">
            <PredictionForm />
          </div>

          {/* COLUMNA DERECHA - Pronósticos Recientes */}
          <div className="space-y-6">
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle>Resultados y exactitud</CardTitle>
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

            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle>Pronósticos Posteados</CardTitle>
                <CardDescription>
                  Hasta 100 pronósticos históricos con filtros por estado
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100vh-10rem)]">
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
