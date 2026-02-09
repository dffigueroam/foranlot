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
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString("es-CO", {
      weekday: "short",
      month: "2-digit",
      day: "2-digit",
    })
  }

  const getDayName = (dateStr: string) => {
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sab"]
    const date = new Date(dateStr + "T00:00:00")
    return days[date.getDay()]
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

  // Agrupar por fecha, últimos 2-3 días
  const sortedByDate = [...results]
    .sort((a, b) => new Date(b.draw_date).getTime() - new Date(a.draw_date).getTime())
    .slice(0, 30)

  const resultsByDate = sortedByDate.reduce(
    (acc, result) => {
      const date = result.draw_date
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(result)
      return acc
    },
    {} as Record<string, LotteryResult[]>
  )

  const sortedDates = Object.keys(resultsByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  ).slice(0, 2)

  return (
    <Card className="bg-card border border-border sticky top-20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          🎰 Últimos Resultados
        </CardTitle>
        <CardDescription className="text-xs">Resultados oficiales (últimas 24 horas)</CardDescription>
      </CardHeader>

      <CardContent className="max-h-[calc(100vh-12rem)] overflow-y-auto space-y-4">
        {sortedDates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No hay resultados disponibles</p>
          </div>
        ) : (
          sortedDates.map((date) => (
            <div key={date} className="space-y-3 pb-4 border-b border-border/50 last:border-0 last:pb-0">
              {/* Encabezado de fecha */}
              <div className="flex items-center gap-2 px-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {getDayName(date)} • {formatDate(date)}
                </div>
              </div>

              {/* Grid de resultados por fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {resultsByDate[date]
                  .sort((a, b) => ((a.lottery_type || "") || "").localeCompare(b.lottery_type || ""))
                  .map((result, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border p-3 backdrop-blur-sm transition-all hover:shadow-md ${getLotteryColor(result.lottery_type)}`}
                    >
                      <div className="space-y-2">
                        {/* Badge tipo */}
                        <div className="flex items-center justify-between gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs font-semibold border ${getLotteryBadgeColor(result.lottery_type)}`}
                          >
                            {getTypeName(result.lottery_type)}
                          </Badge>
                        </div>

                        {/* Número ganador (grande) */}
                        <div className="text-center py-2">
                          <div className="font-mono font-bold text-2xl text-primary">
                            {result.winning_number.padStart(5, "0")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))
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
