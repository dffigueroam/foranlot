"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RefreshCw, TrendingUp, TrendingDown, Users } from "lucide-react"

interface PnGRow {
  userId: number
  username: string
  totalPredictions: number
  totalInvestment: number
  totalWon: number
  totalPnG: number
  isEligible: boolean
}

interface PnGAuditResponse {
  success: boolean
  totals: {
    totalUsers: number
    eligibleUsers: number
    totalPredictions: number
    totalInvestment: number
    totalWon: number
    totalPnG: number
  }
  rows: PnGRow[]
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO").format(value)
}

export const PnGAuditPanel = React.memo(function PnGAuditPanel() {
  const [loading, setLoading] = useState(true)
  const [onlyPositive, setOnlyPositive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PnGAuditResponse | null>(null)

  async function loadData(positive = onlyPositive) {
    setLoading(true)
    setError(null)

    try {
      const query = positive ? "?onlyPositive=true&limit=200" : "?limit=200"
      const res = await fetch(`/api/admin/pyg-audit${query}`, { cache: "no-store" })
      const payload = await res.json()

      if (!res.ok) {
        setError(payload?.error || "No se pudo cargar el reporte de P&G")
        setData(null)
      } else {
        setData(payload)
      }
    } catch (e) {
      setError("Error de red cargando reporte de P&G")
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(false)
  }, [])

  const totals = data?.totals

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Control de P&amp;G acumulado
        </CardTitle>
        <CardDescription>
          Auditoría histórica por usuario: inversión, ganado y P&amp;G total (valor ganado - inversión).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={onlyPositive ? "default" : "outline"}
            onClick={() => {
              setOnlyPositive(true)
              loadData(true)
            }}
            disabled={loading}
          >
            Solo P&amp;G positivo
          </Button>
          <Button
            variant={!onlyPositive ? "default" : "outline"}
            onClick={() => {
              setOnlyPositive(false)
              loadData(false)
            }}
            disabled={loading}
          >
            Todos
          </Button>
          <Button variant="ghost" onClick={() => loadData(onlyPositive)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        ) : (
          <>
            {totals && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Usuarios auditados</p>
                  <p className="text-xl font-bold">{totals.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Elegibles: {totals.eligibleUsers}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Inversión total</p>
                  <p className="text-xl font-bold">{formatCurrency(totals.totalInvestment)}</p>
                  <p className="text-xs text-muted-foreground">Ganado: {formatCurrency(totals.totalWon)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">P&amp;G total</p>
                  <p className={`text-xl font-bold ${totals.totalPnG >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {formatCurrency(totals.totalPnG)}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-lg border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="text-right">Pronósticos</TableHead>
                    <TableHead className="text-right">Inversión</TableHead>
                    <TableHead className="text-right">Ganado</TableHead>
                    <TableHead className="text-right">P&amp;G</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.rows || []).map((row) => (
                    <TableRow key={row.userId}>
                      <TableCell className="font-medium">{row.username}</TableCell>
                      <TableCell className="text-right">{row.totalPredictions}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.totalInvestment)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.totalWon)}</TableCell>
                      <TableCell className={`text-right font-semibold ${row.totalPnG >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {row.totalPnG >= 0 ? <TrendingUp className="h-3 w-3 inline mr-1" /> : <TrendingDown className="h-3 w-3 inline mr-1" />}
                        {formatCurrency(row.totalPnG)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={row.isEligible ? "default" : "outline"}>
                          {row.isEligible ? "Elegible" : "No elegible"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
})

export default PnGAuditPanel
