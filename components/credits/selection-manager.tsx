"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  createSelectionAction,
  getSelectionsAction,
  cancelSelectionAction,
  getCreditsAction,
} from "@/app/actions/credits"
import { AlertCircle, Sparkles, User, Hash, X, Calendar } from "lucide-react"

export default function SelectionManager() {
  const [credits, setCredits] = useState<any>(null)
  const [selections, setSelections] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedNumber, setSelectedNumber] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<number>()
  const [lotteryType, setLotteryType] = useState("3_digits")
  const [message, setMessage] = useState("")

  useEffect(() => {
    loadData()
  }, [])

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

  const handleCreateNumberSelection = async () => {
    if (!selectedNumber) {
      setMessage("Por favor ingresa un número")
      return
    }

    setLoading(true)
    const result = await createSelectionAction("number", lotteryType, selectedNumber)
    setLoading(false)

    if (result.error) {
      setMessage(result.error)
    } else {
      setMessage("Selección creada exitosamente")
      setSelectedNumber("")
      loadData()
    }
  }

  const handleCreateUserSelection = async () => {
    if (!selectedUserId) {
      setMessage("Por favor selecciona un usuario")
      return
    }

    setLoading(true)
    const result = await createSelectionAction("user", lotteryType, undefined, selectedUserId)
    setLoading(false)

    if (result.error) {
      setMessage(result.error)
    } else {
      setMessage("Selección creada exitosamente")
      setSelectedUserId(undefined)
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

      {/* Create Selections */}
      <Card>
        <CardHeader>
          <CardTitle>Crear Nueva Selección</CardTitle>
          <CardDescription>Selecciona números del ranking o sigue usuarios específicos</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="number">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="number">
                <Hash className="h-4 w-4 mr-2" />
                Por Número
              </TabsTrigger>
              <TabsTrigger value="user">
                <User className="h-4 w-4 mr-2" />
                Por Usuario
              </TabsTrigger>
            </TabsList>

            <TabsContent value="number" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lottery-type-number">Tipo de Lotería</Label>
                <Select value={lotteryType} onValueChange={setLotteryType}>
                  <SelectTrigger id="lottery-type-number">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2_digits">2 Cifras (00-99)</SelectItem>
                    <SelectItem value="3_digits">3 Cifras (000-999)</SelectItem>
                    <SelectItem value="4_digits">4 Cifras (0000-9999)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="selected-number">Número</Label>
                <Input
                  id="selected-number"
                  type="text"
                  placeholder={lotteryType === "2_digits" ? "00" : lotteryType === "3_digits" ? "000" : "0000"}
                  value={selectedNumber}
                  onChange={(e) => setSelectedNumber(e.target.value)}
                  maxLength={lotteryType === "2_digits" ? 2 : lotteryType === "3_digits" ? 3 : 4}
                />
                <p className="text-xs text-muted-foreground">
                  Verás todos los pronósticos de cualquier usuario que publique este número
                </p>
              </div>

              <Button onClick={handleCreateNumberSelection} disabled={loading} className="w-full">
                {loading ? "Creando..." : "Crear Selección por Número"}
              </Button>
            </TabsContent>

            <TabsContent value="user" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lottery-type-user">Tipo de Lotería</Label>
                <Select value={lotteryType} onValueChange={setLotteryType}>
                  <SelectTrigger id="lottery-type-user">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2_digits">2 Cifras (00-99)</SelectItem>
                    <SelectItem value="3_digits">3 Cifras (000-999)</SelectItem>
                    <SelectItem value="4_digits">4 Cifras (0000-9999)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="selected-user">ID de Usuario</Label>
                <Input
                  id="selected-user"
                  type="number"
                  placeholder="Ingresa el ID del usuario"
                  value={selectedUserId || ""}
                  onChange={(e) => setSelectedUserId(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">Verás todos los pronósticos de este usuario específico</p>
              </div>

              <Button onClick={handleCreateUserSelection} disabled={loading} className="w-full">
                {loading ? "Creando..." : "Seguir Usuario"}
              </Button>
            </TabsContent>
          </Tabs>

          {message && (
            <div className="mt-4 flex items-center gap-2 text-sm">
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
                      {selection.selection_type === "number" ? (
                        <>
                          <Hash className="h-4 w-4 text-primary" />
                          <span className="font-mono font-bold text-lg">{selection.selected_number}</span>
                        </>
                      ) : (
                        <>
                          <User className="h-4 w-4 text-primary" />
                          <span className="font-semibold">
                            {selection.selected_username || `Usuario #${selection.selected_user_id}`}
                          </span>
                        </>
                      )}
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
