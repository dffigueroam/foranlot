"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Users, Sparkles, Calendar, TrendingUp } from "lucide-react"
import {
  generateSyntheticsAction,
  getSyntheticUsersAction,
  getPendingSyntheticUpdatesAction,
  approveSyntheticUpdateAction,
  rejectSyntheticUpdateAction,
} from "@/app/actions/admin/synthetics"

interface SyntheticUser {
  id: number
  username: string
  createdAt: string
  totalPredictions: number
  correctPredictions: number
  accuracy: number
  syntheticType?: string | null
  specialization?: string | null
  isPending?: boolean
}

interface PendingUpdate {
  update_id: number
  synthetic_user_id: number
  proposed_name: string
  synthetic_type: string
  specialization: string
  created_at: string
  current_username: string
}

export function SyntheticUsersPanel() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<SyntheticUser[]>([])
  const [pendingUpdates, setPendingUpdates] = useState<PendingUpdate[]>([])
  const [nameEdits, setNameEdits] = useState<Record<number, string>>({})

  useEffect(() => {
    loadUsers()
    loadPending()
  }, [])

  async function loadUsers() {
    setIsLoading(true)
    const result = await getSyntheticUsersAction()
    
    if (result.error) {
      setError(result.error)
    } else {
      setUsers(result.users!)
    }
    
    setIsLoading(false)
  }

  async function loadPending() {
    const result = await getPendingSyntheticUpdatesAction()
    if (result.error) {
      setError(result.error)
    } else {
      setPendingUpdates(result.updates || [])
    }
  }

  async function handleApprove(updateId: number) {
    const finalName = nameEdits[updateId]
    const result = await approveSyntheticUpdateAction(updateId, finalName)

    if (result.error) {
      setError(result.error)
      return
    }

    setMessage("✅ Sintético aprobado y actualizado")
    await loadPending()
    await loadUsers()
  }

  async function handleReject(updateId: number) {
    const result = await rejectSyntheticUpdateAction(updateId)

    if (result.error) {
      setError(result.error)
      return
    }

    setMessage("Solicitud rechazada")
    await loadPending()
  }

  async function handleGenerate() {
    if (!confirm("¿Generar usuarios sintéticos ahora? Esto creará usuarios AI basados en los mejores pronosticadores.")) {
      return
    }

    setIsGenerating(true)
    setError(null)
    setMessage(null)

    const result = await generateSyntheticsAction()

    if (result.error) {
      setError(result.error)
    } else {
      setMessage(`✅ ${result.message} (${result.dayBest} por día, ${result.lotBest} por lotería)`)
      await loadUsers()
    }

    setIsGenerating(false)
  }

  const getUserType = (user: SyntheticUser) => {
    const username = user.username.toLowerCase()
    const type = user.syntheticType || ""

    if (type === "daybest" || username.includes("daybest")) {
      return { type: "Día", color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" }
    }

    return { type: "Lotería", color: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Usuarios Sintéticos (Especialistas)
        </CardTitle>
        <CardDescription>
          Perfiles especializados por día o lotería. Requieren aprobación antes de activarse.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Información del sistema */}
        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            <strong>Generación automática:</strong> Día 15 de cada mes. Las propuestas quedan pendientes
            hasta que el admin las apruebe.
          </AlertDescription>
        </Alert>

        {/* Botón de generación manual */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
          <div>
            <h3 className="font-semibold">Generación Manual</h3>
            <p className="text-sm text-muted-foreground">
              Generar propuestas ahora (normalmente automático día 15)
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generar Propuestas
              </>
            )}
          </Button>
        </div>

        {/* Mensajes */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* Pendientes de aprobación */}
        {pendingUpdates.length > 0 && (
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Pendientes de aprobación</h3>
              <Badge variant="destructive">{pendingUpdates.length}</Badge>
            </div>

            <div className="space-y-3">
              {pendingUpdates.map((pending) => (
                <div key={pending.update_id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{pending.proposed_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Tipo: {pending.synthetic_type} • Especializacion: {pending.specialization}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Creado: {new Date(pending.created_at).toLocaleDateString("es-CO")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Nombre final (opcional)"
                        value={nameEdits[pending.update_id] || ""}
                        onChange={(e) =>
                          setNameEdits((prev) => ({
                            ...prev,
                            [pending.update_id]: e.target.value,
                          }))
                        }
                        className="h-8"
                      />
                      <Button size="sm" onClick={() => handleApprove(pending.update_id)}>
                        Aprobar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(pending.update_id)}>
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estadísticas rápidas */}
        {!isLoading && (
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Sintéticos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {users.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Por Día de Semana</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {users.filter(u => getUserType(u).type === "Día").length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Por Lotería</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {users.filter(u => getUserType(u).type === "Lotería").length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de usuarios sintéticos */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Usuarios Generados</h3>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground">
                No hay usuarios sintéticos generados aún
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-center">Predicciones</TableHead>
                    <TableHead className="text-center">Aciertos</TableHead>
                    <TableHead className="text-center">Precisión</TableHead>
                    <TableHead>Creado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const userType = getUserType(user)
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={userType.color}>
                            {userType.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{user.totalPredictions}</TableCell>
                        <TableCell className="text-center">{user.correctPredictions}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {user.accuracy.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString("es-CO")}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
