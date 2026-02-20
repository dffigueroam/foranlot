"use client"
import React, { useState, useEffect, useMemo, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

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
        {!stats && loading && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Usuarios Premium</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Usuarios Gratis</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Última Fecha de Resultados Oficiales por País</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full mt-2" />
              </CardContent>
            </Card>
          </>
        )}
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
                  {stats.lastResultsByCountry.slice(0, 5).map((r: any) => (
                    <li key={r.country}><b>{r.country}:</b> {typeof r.last_date === "object" && r.last_date !== null ? new Date(r.last_date).toISOString().slice(0, 10) : r.last_date}</li>
                  ))}
                </ul>
                <Suspense fallback={<Skeleton className="h-24 w-full" />}>
                  <TableSizesCard />
                </Suspense>
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
            <Suspense fallback={<Skeleton className="h-24 w-full" />}>
              <ToolUsageCard />
            </Suspense>
          </>
        )}
      </div>
    </div>
  )
}

const AdminDashboardSummary = React.memo(function AdminDashboardSummary() {
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
        {!stats && loading && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Usuarios Premium</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Usuarios Gratis</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Última Fecha de Resultados Oficiales por País</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full mt-2" />
              </CardContent>
            </Card>
          </>
        )}
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
                  {stats.lastResultsByCountry.slice(0, 5).map((r: any) => (
                    <li key={r.country}><b>{r.country}:</b> {typeof r.last_date === "object" && r.last_date !== null ? new Date(r.last_date).toISOString().slice(0, 10) : r.last_date}</li>
                  ))}
                </ul>
                <Suspense fallback={<Skeleton className="h-24 w-full" />}>
                  <TableSizesCard />
                </Suspense>
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
            <Suspense fallback={<Skeleton className="h-24 w-full" />}>
              <ToolUsageCard />
            </Suspense>
          </>
        )}
      </div>
    </div>
  )
})

export default AdminDashboardSummary;
