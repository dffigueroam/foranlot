"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Calendar, Hash, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PredictionRow {
  id: number
  predicted_number: string
  draw_time: string | null
  confidence_level: number
  notes: string | null
  username: string
}

interface PredictionGroup {
  lotteryName: string
  country: string | null
  lotteryType: string
  totalPredictions: number
  predictions: PredictionRow[]
}

export default function PostedPredictionsPanel() {
  const [drawDate, setDrawDate] = useState(() => new Date().toISOString().split("T")[0])
  const [country, setCountry] = useState("all")
  const [lotteryType, setLotteryType] = useState("all")
  const [username, setUsername] = useState("")
  const [groups, setGroups] = useState<PredictionGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ drawDate })
        if (country !== "all") params.set("country", country)
        if (lotteryType !== "all") params.set("lotteryType", lotteryType)
        if (username.trim()) params.set("username", username.trim())

        const response = await fetch(`/api/admin/posted-predictions?${params.toString()}`)
        const result = await response.json()
        if (result.success) {
          setGroups(result.groups || [])
        } else {
          setGroups([])
        }
      } catch {
        setGroups([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [country, drawDate, lotteryType, username])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pronósticos publicados por lotería</CardTitle>
        <CardDescription>
          Vista administrativa de los números posteados por usuarios agrupados por lotería y fecha de sorteo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Fecha del sorteo
            </label>
            <Input type="date" value={drawDate} onChange={(e) => setDrawDate(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              País
            </label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Colombia">Colombia</SelectItem>
                <SelectItem value="España">España</SelectItem>
                <SelectItem value="USA">USA</SelectItem>
                <SelectItem value="Estados Unidos">Estados Unidos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2">Tipo de cifra</label>
            <Select value={lotteryType} onValueChange={setLotteryType}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="2_digits">2 cifras</SelectItem>
                <SelectItem value="3_digits">3 cifras</SelectItem>
                <SelectItem value="4_digits">4 cifras</SelectItem>
                <SelectItem value="5_digits">5 cifras</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2">Usuario</label>
            <Input
              type="text"
              placeholder="Buscar por username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando pronósticos...
          </div>
        ) : groups.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8">
            No hay pronósticos publicados para esta fecha.
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <Card key={`${group.lotteryName}-${group.lotteryType}`} className="border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{group.lotteryName}</CardTitle>
                      <CardDescription>
                        {(group.country || "Sin país")} • {group.lotteryType.replace("_", " ")}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{group.totalPredictions} pronósticos</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {group.predictions.map((prediction) => (
                      <div key={prediction.id} className="flex items-start justify-between gap-4 rounded-lg border p-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-muted-foreground" />
                            <span className="font-mono text-lg font-semibold">{prediction.predicted_number}</span>
                            <Badge variant="outline">{prediction.username}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Confianza: {prediction.confidence_level}/5
                            {prediction.draw_time ? ` • Hora: ${prediction.draw_time}` : ""}
                          </div>
                          {prediction.notes && (
                            <p className="text-sm text-muted-foreground">{prediction.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}