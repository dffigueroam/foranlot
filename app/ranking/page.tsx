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
    <PageWrapper user={{ username: user.username, role: user.role }}>
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-black">
        <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Link>
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Ranking Global</h1>
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
