"use client"
import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AdminDashboardSummary() {
  const [stats, setStats] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/dashboard-stats")
      const data = await res.json()
      setStats(data)
    } catch {
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  // Cargar al montar
  React.useEffect(() => { fetchStats() }, [])

  return (
    <div className="mb-6">
      <Button onClick={fetchStats} disabled={loading} className="mb-4">
        {loading ? "Actualizando..." : "Actualizar dashboard"}
      </Button>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {stats && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Usuarios Premium</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.premiumUsers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Usuarios Gratis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.freeUsers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Última Fecha de Resultados Oficiales por País</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {stats.lastResultsByCountry.map((r: any) => (
                    <li key={r.country}><b>{r.country}:</b> {typeof r.last_date === "object" && r.last_date !== null ? new Date(r.last_date).toISOString().slice(0, 10) : r.last_date}</li>
                  ))}
                </ul>
                <Card>
                  <CardHeader>
                    <CardTitle>Peso de tablas (MB)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.tableSizes && stats.tableSizes.map((t: any) => (
                        <div key={t.table} className="mb-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">{t.table}</span>
                            <span className={t.size_mb > 100 ? "text-red-600 font-bold" : "text-muted-foreground"}>{t.size_mb} MB</span>
                          </div>
                          <div className="w-full h-3 bg-muted rounded overflow-hidden mt-1">
                            <div
                              className={t.size_mb > 100 ? "bg-red-500 h-3 rounded" : "bg-blue-500 h-3 rounded"}
                              style={{ width: `${Math.min(t.size_mb, 200) / 2}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Usuarios que Postearon Pronósticos Hoy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.usersPostedToday}</div>
                <div className="text-xs mt-2">Última hora: {stats.usersPostedLastHour}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Uso de Herramientas (Gratis/Premium)</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {stats.toolUsage.map((t: any) => (
                    <li key={t.method}>
                      <b>{t.method}:</b> Gratis: {t.free} / Premium: {t.premium}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
