import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getRankingWithWaitlist } from "@/lib/ranking"
import { LOTTERIES } from "@/lib/lotteries"
import { RankingPageClient } from "@/components/ranking/ranking-page-client"
import { getGlobalLastRankingUpdate, formatLastUpdate } from "@/lib/ranking-updates"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { RankingTable } from "@/components/ranking/ranking-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
export default async function RankingPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  const { official, waitlist, minAccuracy, minScore } = await getRankingWithWaitlist(50)
  const lastUpdate = await getGlobalLastRankingUpdate()
  const lastUpdateText = formatLastUpdate(lastUpdate)

  // Por defecto Colombia
  const defaultCountry = "Colombia"
  const defaultLottery = LOTTERIES.find(l => l.country === defaultCountry)?.name || LOTTERIES[0].name

  return (
    <PageWrapper user={{ username: user.username, role: user.role, is_premium: user.is_premium }}>
      <div className="min-h-screen bg-gradient-to-br from-background via-purple-50/20 dark:via-purple-950/10 to-background relative">
        {/* Elementos decorativos de fondo */}
        <div className="fixed inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-linear-to-br from-blue-400 to-purple-500 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 right-0 w-96 h-96 bg-linear-to-bl from-cyan-400 to-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-linear-to-t from-purple-400 to-pink-500 rounded-full blur-3xl"></div>
        </div>
        <RankingPageClient 
          user={user}
          official={official}
          waitlist={waitlist}
          minAccuracy={minAccuracy}
          minScore={minScore}
          lastUpdateText={lastUpdateText}
          defaultCountry={defaultCountry}
          defaultLottery={defaultLottery}
        />
      </div>
    </PageWrapper>
  )
}
