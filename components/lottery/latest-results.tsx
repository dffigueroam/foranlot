import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

interface LotteryResult {
  id?: number
  lottery_name?: string
  lottery_type?: string
  winning_number: string
  draw_date: string
  draw_time?: string | null
  verified_at?: string
}

export function LatestResults({ results }: { results: LotteryResult[] }) {
  const getDayName = (dateStr: string) => {
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sab"]
    const date = new Date(dateStr + "T00:00:00")
    return days[date.getDay()]
  }

  // Detectar tipo de lotería según longitud del número ganador
  const inferLotteryType = (winningNumber: string): string => {
    const digits = winningNumber.replace(/\D/g, "").length
    if (digits === 3) return "3_digits"
    if (digits === 4) return "4_digits"
    if (digits === 5) return "5_digits"
    return "4_digits" // Por defecto
  }

  const getLotteryColor = (type?: string): string => {
    const colorMap: Record<string, string> = {
      "3_digits": "bg-linear-to-r from-green-500/20 to-green-600/20 border-green-500/30",
      "4_digits": "bg-linear-to-r from-blue-500/20 to-blue-600/20 border-blue-500/30",
      "5_digits": "bg-linear-to-r from-purple-500/20 to-purple-600/20 border-purple-500/30",
    }
    return colorMap[type || "3_digits"] || "bg-linear-to-r from-indigo-500/20 to-indigo-600/20 border-indigo-500/30"
  }

  const getLotteryBadgeColor = (type?: string): string => {
    const colorMap: Record<string, string> = {
      "3_digits": "text-green-400 border-green-400/50",
      "4_digits": "text-blue-400 border-blue-400/50",
      "5_digits": "text-purple-400 border-purple-400/50",
    }
    return colorMap[type || "3_digits"] || "text-indigo-400 border-indigo-400/50"
  }

  const getTypeName = (type?: string) => {
    const nameMap: Record<string, string> = {
      "3_digits": "3 cifras",
      "4_digits": "4 cifras",
      "5_digits": "5 cifras",
    }
    return nameMap[type || ""] || (type || "Resultado")
  }

  // Filtrar y mostrar solo del último día
  const lastDay = results.length > 0 ? results[0]?.draw_date : null
  const lastDayResults = lastDay 
    ? results.filter(r => r.draw_date === lastDay)
    : []

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString("es-CO", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    })
  }

  return (
    <Card className="bg-card border border-border sticky top-20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          🎰 Resultados del Día
        </CardTitle>
        <CardDescription className="text-xs">
          {lastDay ? `${formatDate(lastDay)}` : "No hay resultados disponibles"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {lastDayResults.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No hay resultados disponibles</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Grid de resultados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {lastDayResults
                .sort((a, b) => (a.lottery_name || "").localeCompare(b.lottery_name || ""))
                .map((result, idx) => {
                  const lotteryType = inferLotteryType(result.winning_number)
                  return (
                    <div
                      key={idx}
                      className={`rounded-lg border p-3 backdrop-blur-sm transition-all hover:shadow-md ${getLotteryColor(lotteryType)}`}
                    >
                      <div className="space-y-2">
                        {/* Nombre de lotería */}
                        <div className="text-xs font-semibold text-muted-foreground truncate">
                          {result.lottery_name}
                        </div>

                        {/* Badge tipo */}
                        <div className="flex items-center justify-between gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs font-semibold border ${getLotteryBadgeColor(lotteryType)}`}
                          >
                            {getTypeName(lotteryType)}
                          </Badge>
                        </div>

                        {/* Número ganador (grande) */}
                        <div className="text-center py-2">
                          <div className="font-mono font-bold text-2xl text-primary">
                            {result.winning_number.padStart(result.winning_number.length, "0")}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border/50 flex items-center justify-center gap-1">
          <Clock size={12} />
          Actualizado automáticamente
        </div>
      </CardContent>
    </Card>
  )
}
