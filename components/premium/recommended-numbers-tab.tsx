"use client"

import { useState, useTransition } from "react"
import { Sparkles, RefreshCw, Clock, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { generatePremiumRecommendationsAction } from "@/app/actions/recommendations"

interface RecommendedNumber {
  number: string
  score: number
  signals: string[]
  contributorCount: number
  topContributors: Array<{ userId: number; weight: number }>
}

interface LotteryRecommendation {
  lotteryName: string
  lotteryType: string
  generatedAt: string
  totalCandidates: number
  numbers: RecommendedNumber[]
}

interface RecommendedNumbersTabProps {
  initialRecommendations: LotteryRecommendation[]
  initialRunId: number | null
  initialGeneratedAt: string | null
  availableCredits: number
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function RecommendedNumbersTab({
  initialRecommendations,
  initialRunId,
  initialGeneratedAt,
  availableCredits,
}: RecommendedNumbersTabProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [credits, setCredits] = useState(availableCredits)
  const [recommendations, setRecommendations] = useState<LotteryRecommendation[]>(initialRecommendations)
  const [generatedAt, setGeneratedAt] = useState<string | null>(initialGeneratedAt)
  const [isFresh, setIsFresh] = useState(false)

  function handleRecalculate() {
    if (credits < 1) return
    setError("")

    startTransition(async () => {
      const result = await generatePremiumRecommendationsAction()
      if (result.error) {
        setError(result.error)
        return
      }
      setRecommendations(result.recommendations || [])
      setCredits(result.remainingCredits ?? credits - 1)
      setGeneratedAt(new Date().toISOString())
      setIsFresh(true)
    })
  }

  const hasData = recommendations.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-amber-300/70 bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-600" />
                Numeros Recomendados por Loteria
              </CardTitle>
              <CardDescription className="mt-1">
                Analisis consolidado de pronosticos publicados. Se actualiza automaticamente cada dia.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Coins className="h-3.5 w-3.5" />
                {credits} credito{credits !== 1 ? "s" : ""}
              </Badge>
              {generatedAt && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  {isFresh ? "Ahora mismo" : formatDate(generatedAt)}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            {credits >= 1 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecalculate}
                disabled={isPending}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
                {isPending ? "Calculando..." : "Recalcular ahora (1 credito)"}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sin creditos para recalcular. Los resultados se muestran del ultimo analisis diario.
              </p>
            )}
            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {!hasData ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Aun no hay pronosticos futuros registrados.
              <br />
              Los numeros apareceran aqui cuando los pronosticadores publiquen.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {recommendations.map((lottery) => (
            <Card key={`${lottery.lotteryName}-${lottery.lotteryType}`}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-lg">{lottery.lotteryName}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {lottery.totalCandidates} candidatos evaluados
                  </Badge>
                </div>
                <CardDescription>
                  {lottery.lotteryType.replace("_digits", " digitos")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {lottery.numbers.map((item, index) => (
                    <div
                      key={`${lottery.lotteryName}-${item.number}`}
                      className="relative rounded-lg border bg-card p-4"
                    >
                      <span className="absolute right-2 top-2 text-xs font-bold text-muted-foreground">
                        #{index + 1}
                      </span>
                      <p className="text-3xl font-bold tracking-widest text-amber-600 dark:text-amber-400">
                        {item.number}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Score: <span className="font-semibold">{item.score.toFixed(3)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.contributorCount} pronosticador{item.contributorCount !== 1 ? "es" : ""}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.signals.map((signal) => (
                          <Badge
                            key={`${item.number}-${signal}`}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {signal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
