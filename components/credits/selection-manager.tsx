"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  createSelectionAction,
  getSelectionsAction,
  cancelSelectionAction,
  getCreditsAction,
  getRankingUsersAction,
} from "@/app/actions/credits"
import { AlertCircle, Sparkles, User, X, Calendar, Search, Trophy, Users } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface RankingUser {
  user_id: number
  username: string
  total_predictions: number
  correct_predictions: number
  accuracy_percentage: number
  total_score: number
  rank_position: number
  subscribers_count?: number
}

export default function SelectionManager() {
  const [credits, setCredits] = useState<any>(null)
  const [selections, setSelections] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  
  // Filtros
  const [country, setCountry] = useState<string>("all")
  const [lotteryType, setLotteryType] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  
  // Usuarios del ranking
  const [rankingUsers, setRankingUsers] = useState<RankingUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  // Cargar usuarios del ranking cuando cambian los filtros
  useEffect(() => {
    loadRankingUsers()
  }, [country, lotteryType, searchTerm])

  const loadData = async () => {
    const creditsResult = await getCreditsAction()
    if (creditsResult.credits) {
      setCredits(creditsResult.credits)
    }

    const selectionsResult = await getSelectionsAction()
    if (selectionsResult.selections) {
      setSelections(selectionsResult.selections)
    }
  }

  const loadRankingUsers = async () => {
    setLoadingUsers(true)
    const filters: any = {}
    if (country && country !== "all") filters.country = country
    if (lotteryType && lotteryType !== "all") filters.lotteryType = lotteryType
    if (searchTerm.trim()) filters.searchTerm = searchTerm.trim()

    const result = await getRankingUsersAction(filters)
    if (result.users) {
      setRankingUsers(result.users)
    }
    setLoadingUsers(false)
  }

  const handleCreateUserSelection = async (userId: number, username: string) => {
    if (!lotteryType || lotteryType === "all") {
      setMessage("Por favor selecciona un tipo de lotería específico primero")
      return
    }

    setLoading(true)
    const result = await createSelectionAction("user", lotteryType, undefined, userId)
    setLoading(false)

    if (result.error) {
      setMessage(result.error)
    } else {
      setMessage(`¡Ahora sigues a ${username}!`)
      loadData()
    }
  }

  const handleCancelSelection = async (selectionId: number) => {
    if (!confirm("¿Estás seguro de cancelar esta selección?")) return

    setLoading(true)
    await cancelSelectionAction(selectionId)
    setLoading(false)
    loadData()
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleClearFilters = () => {
    setCountry("all")
    setLotteryType("all")
    setSearchTerm("")
  }

  return (
    <div className="space-y-6">
      {/* Credits Display */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Mis Créditos
          </CardTitle>
          <CardDescription>Los créditos se descuentan diariamente por cada selección activa</CardDescription>
        </CardHeader>
        <CardContent>
          {credits ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{credits.total_credits}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usados</p>
                <p className="text-2xl font-bold text-red-500">{credits.used_credits}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Disponibles</p>
                <p className="text-2xl font-bold text-green-500">{credits.available_credits}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Cargando créditos...</p>
          )}
        </CardContent>
      </Card>

      {/* Seguir Usuarios del Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Seguir Usuarios del Ranking
          </CardTitle>
          <CardDescription>Busca y sigue a los mejores pronosticadores</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>País</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Colombia">🇨🇴 Colombia</SelectItem>
                  <SelectItem value="España">🇪🇸 España</SelectItem>
                  <SelectItem value="USA">🇺🇸 USA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Lotería</Label>
              <Select value={lotteryType} onValueChange={setLotteryType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="3_digits">3 Cifras</SelectItem>
                  <SelectItem value="4_digits">4 Cifras</SelectItem>
                  <SelectItem value="5_digits">5 Cifras</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Buscar por nombre o posición</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Ej: 5 o nombre del usuario"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                {(country !== "all" || lotteryType !== "all" || searchTerm) && (
                  <Button variant="outline" onClick={handleClearFilters}>
                    Limpiar
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Lista de Usuarios */}
          {(!lotteryType || lotteryType === "all") && (
            <div className="text-center py-4 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Selecciona un tipo de lotería para ver los usuarios y poder seguirlos</p>
            </div>
          )}

          {lotteryType && lotteryType !== "all" && (
            <>
              {loadingUsers ? (
                <div className="text-center py-8 text-muted-foreground">Cargando usuarios...</div>
              ) : rankingUsers.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-15">Pos</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead className="text-right">Exactitud</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        <TableHead className="text-right">Seguidores</TableHead>
                        <TableHead className="w-25"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rankingUsers.map((user) => (
                        <TableRow key={user.user_id}>
                          <TableCell>
                            <Badge variant="outline">#{user.rank_position}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell className="text-right">
                            <span className="font-mono">{user.accuracy_percentage.toFixed(1)}%</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{user.total_score || 0} pts</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{user.subscribers_count || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleCreateUserSelection(user.user_id, user.username)}
                              disabled={loading}
                            >
                              Seguir
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron usuarios con estos filtros
                </div>
              )}
            </>
          )}

          {message && (
            <div className="flex items-center gap-2 text-sm p-3 bg-muted rounded-lg">
              <AlertCircle className="h-4 w-4" />
              {message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Selections */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Selecciones Activas</CardTitle>
          <CardDescription>
            Cada selección consume {selections.length > 0 ? selections[0].credits_per_day : 1} crédito por día
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selections.length > 0 ? (
            <div className="space-y-3">
              {selections.map((selection) => (
                <div key={selection.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-semibold">
                        {selection.selected_username || `Usuario #${selection.selected_user_id}`}
                      </span>
                      <Badge variant="outline">{selection.lottery_type.replace("_", " ")}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Vence: {formatDate(selection.expiry_date)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCancelSelection(selection.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No tienes selecciones activas</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
