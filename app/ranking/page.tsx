import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getRankingWithWaitlist } from "@/lib/ranking"
import { getGlobalLastRankingUpdate, formatLastUpdate } from "@/lib/ranking-updates"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { RankingTable } from "@/components/ranking/ranking-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Crown, Clock } from "lucide-react"

export default async function RankingPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const { official, waitlist, minAccuracy, minScore } = await getRankingWithWaitlist(50)
  const lastUpdate = await getGlobalLastRankingUpdate()
  const lastUpdateText = formatLastUpdate(lastUpdate)

  return (
    <PageWrapper user={{ username: user.username, role: user.role, is_premium: user.is_premium }}>
      <div className="min-h-screen bg-gradient-to-br from-background via-purple-50/20 dark:via-purple-950/10 to-background relative">
        {/* Elementos decorativos de fondo */}
        <div className="fixed inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-linear-to-br from-blue-400 to-purple-500 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 right-0 w-96 h-96 bg-linear-to-bl from-cyan-400 to-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-linear-to-t from-purple-400 to-pink-500 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Link>
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 bg-linear-to-r from-purple-600 via-blue-600 to-cyan-600 dark:from-purple-400 dark:via-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">Ranking Global</h1>
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground">
                  Los mejores pronosticadores de la comunidad según precisión y aciertos
                </p>
                <Badge variant="outline" className="ml-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {lastUpdateText}
                </Badge>
              </div>
            </div>
            {user.is_premium && (
              <Button asChild>
                <Link href="/selections">
                  <Crown className="w-4 h-4 mr-2" />
                  Mis Selecciones
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Ranking Oficial */}
        <div className="mb-8">
          <RankingTable 
            users={official} 
            currentUser={user}
            title="🏆 Ranking Oficial"
            description={`Usuarios con ${minAccuracy}% de exactitud o ${minScore} puntos de combinaciones`}
          />
        </div>

        {/* Lista de Espera */}
        {waitlist.length > 0 && (
          <div>
            <RankingTable 
              users={waitlist} 
              currentUser={user}
              title="⏳ En Lista de Espera"
              description={`Alcanza ${minAccuracy}% de exactitud o ${minScore} puntos para ingresar al ranking oficial. ¡Sigue pronosticando!`}
              showWaitlistBadge={true}
            />
          </div>
        )}
      </div>
    </div>
    </PageWrapper>
  )
}
