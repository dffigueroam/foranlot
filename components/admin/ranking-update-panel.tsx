"use client"

import { useState, useEffect, useMemo } from "react"
import { updateRankingManually, getRankingUpdateStats } from "@/app/actions/admin/ranking"
import { Button } from "@/components/ui/button"
import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, CheckCircle, AlertCircle, TrendingUp, Users, Clock, AlertTriangle } from "lucide-react"

const RankingUpdatePanel = React.memo(function RankingUpdatePanel() {
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(true)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)

  // Cargar estadísticas al montar
  useEffect(() => {
    loadStats()
  }, [])

  // Memo para stats
  const statsMemo = useMemo(() => stats, [stats])

  async function loadStats() {
    setStatsLoading(true)
    const res = await getRankingUpdateStats()
    if (res.success && res.stats) {
      setStats(res.stats)
    }
    setStatsLoading(false)
  }

  async function handleUpdateRanking() {
    setLoading(true)
    setError(null)
    setResult(null)

    const res = await updateRankingManually()

    if (res.error) {
      setError(res.error)
    } else {
      setResult(res)
      // Recargar estadísticas después de actualizar
      await loadStats()
    }

    setLoading(false)
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "Nunca"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Actualización Manual del Ranking
        </CardTitle>
        <CardDescription>
          Forzar recálculo del ranking fuera del horario automático (10 PM diario)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estadísticas actuales */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                Última actualización
              </div>
              <p className="text-sm font-medium">
                {formatDate(stats.lastUpdate)}
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                Usuarios en ranking
              </div>
              <p className="text-2xl font-bold">{stats.usersInRanking}</p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4" />
                Usuarios activos
              </div>
              <p className="text-2xl font-bold">{stats.totalActiveUsers}</p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <AlertTriangle className="w-4 h-4" />
                Pendientes verificar
              </div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.pendingVerifications}
              </p>
            </div>
          </div>
        )}

        {/* Skeletons para estadísticas */}
        {statsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {/* Alertas de resultado */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>{result.message}</strong>
              <div className="mt-2 text-sm space-y-1">
                <p>✓ Usuarios procesados: {result.usersProcessed}</p>
                <p>✓ Timestamp: {formatDate(result.timestamp)}</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Información del proceso */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
            ℹ️ Proceso de actualización
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Actualiza estadísticas básicas de user_stats</li>
            <li>• Calcula scores ponderados (50% aporte + 30% recurrencia + 20% consistencia)</li>
            <li>• Guarda histórico en user_ranking_scores con fecha actual</li>
            <li>• Revalida caché de páginas de ranking</li>
          </ul>
        </div>

        {/* Botón de acción */}
        <div className="flex gap-3">
          <Button
            onClick={handleUpdateRanking}
            disabled={loading}
            size="lg"
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Actualizando ranking...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Actualizar Ranking Ahora
              </>
            )}
          </Button>

          <Button
            onClick={loadStats}
            disabled={statsLoading}
            variant="outline"
            size="lg"
          >
            {statsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Refrescar Stats"
            )}
          </Button>
        </div>

        {/* Nota sobre cron automático */}
        <div className="text-xs text-muted-foreground border-t pt-4">
          <p>
            <strong>Nota:</strong> El ranking se actualiza automáticamente cada día a las 10 PM
            mediante un cron job. Usa esta opción solo cuando necesites actualizar manualmente
            (ej: después de cargar resultados fuera de horario).
          </p>
        </div>
      </CardContent>
    </Card>
  )
})

export default RankingUpdatePanel;
