import { redirect } from "next/navigation"
import Link from "next/link"

import { getCurrentUser } from "@/lib/auth"
import { getPredictions } from "@/lib/predictions"
import { getUserCredits } from "@/lib/credits"
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

import { Crown, TrendingUp } from "lucide-react"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  // 🔹 Obtener TODAS las predicciones
  const allPredictions = await getPredictions(user.id)

  // 🔐 LÓGICA PREMIUM
  const predictions = user.is_premium
    ? allPredictions
    : allPredictions.filter(p => p.user_id === user.id)

  const credits = user.is_premium
    ? await getUserCredits(user.id)
    : null

  const payments = (await getUserPaymentRequests(user.id)).map(p => ({
    ...p,
    amountCents: p.amount_cents ?? 0,
  }))

  return (
    <PageWrapper user={{ username: user.username, role: user.role }}>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">

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
              {!user.is_premium && (
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
        <div className="grid lg:grid-cols-2 gap-6">

          {/* COLUMNA IZQUIERDA - Formulario y Contratos */}
          <div className="space-y-6">
            <PredictionForm />

            {/* CONTRATOS */}
            <Card className="bg-card border border-border">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-medium">
                  📄 Contratos de Pronósticos
                </p>

                <p className="text-xs text-muted-foreground">
                  Recibe pronósticos diarios de usuarios del ranking
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Créditos: {credits?.available_credits ?? 0}
                  </span>

                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    disabled={
                      !user.is_premium ||
                      (credits?.available_credits ?? 0) === 0
                    }
                  >
                    <Link href="/contracts">
                      Hacer contrato
                    </Link>
                  </Button>
                </div>

                {!user.is_premium && (
                  <p className="text-xs text-muted-foreground">
                    🔒 Solo para usuarios Premium
                  </p>
                )}

                {user.is_premium && (credits?.available_credits ?? 0) === 0 && (
                  <p className="text-xs text-muted-foreground">
                    ⚠️ Sin créditos disponibles
                  </p>
                )}
              </CardContent>
            </Card>

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
          </div>

          {/* COLUMNA DERECHA - Pronósticos Recientes */}
          <div>
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle>Pronósticos Recientes</CardTitle>
                <CardDescription>
                  {user.is_premium
                    ? "Todos los pronósticos de la comunidad"
                    : "Solo tus pronósticos (hazte Premium para ver más)"}
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[calc(100vh-12rem)] overflow-y-auto space-y-6">
                <PredictionList
                  predictions={predictions}
                  isPremium={user.is_premium}
                />
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
    </PageWrapper>
  )
}
