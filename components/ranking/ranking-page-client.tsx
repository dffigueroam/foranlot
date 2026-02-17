"use client";
import { LoteriaRankingSection } from "./loteria-ranking-section";
import { RankingTable } from "@/components/ranking/ranking-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Crown, Clock } from "lucide-react";

export function RankingPageClient({ user, official, waitlist, minAccuracy, minScore, lastUpdateText, defaultCountry, defaultLottery }) {
  return (
    <div className="container mx-auto px-4 py-8 relative z-10">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Link>
        </Button>

        {/* Ranking por Lotería (interactivo) */}
        <LoteriaRankingSection 
          currentUser={user}
          initialRanking={[]}
          initialCountry={defaultCountry}
          initialLottery={defaultLottery}
        />

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
  );
}
