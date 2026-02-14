"use client"

import { useEffect, useState } from "react"
import { getLastCombinationsAction } from "@/app/actions/lottery-combinations"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Clock } from "lucide-react"

interface LotteryCombination {
  id: number
  lottery_names: string[]
  digit_type: string
  created_at: string
}

interface QuickSelectCombinationsProps {
  onSelect: (lotteryNames: string[], digitType: string) => void
}

export function QuickSelectCombinations({ onSelect }: QuickSelectCombinationsProps) {
  const [combinations, setCombinations] = useState<LotteryCombination[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCombinations()
  }, [])

  async function loadCombinations() {
    try {
      setLoading(true)
      const result = await getLastCombinationsAction()
      if (result.combinations) {
        setCombinations(result.combinations)
      }
    } catch (error) {
      console.error("[QuickSelectCombinations] Error loading combinations:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Cargando combinaciones...</span>
        </CardContent>
      </Card>
    )
  }

  if (combinations.length === 0) {
    return null
  }

  const getDigitsLabel = (digitType: string) => {
    const num = digitType.split("_")[0]
    return `${num} cifras`
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("es-CO", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  return (
    <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Últimas Combinaciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {combinations.map((combo) => (
          <Button
            key={combo.id}
            variant="outline"
            onClick={() => onSelect(combo.lottery_names, combo.digit_type)}
            className="w-full justify-between h-auto py-2"
          >
            <div className="flex items-center gap-2">
              {combo.lottery_names.map((name) => (
                <Badge key={name} variant="secondary">
                  {name}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{getDigitsLabel(combo.digit_type)}</span>
              <span>•</span>
              <span>{formatDate(combo.created_at)}</span>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
