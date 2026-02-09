"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Clock, Filter, User, Zap } from "lucide-react"

interface Contract {
  id: number
  prediction_id: number
  publisher_username: string
  lottery_name: string
  predicted_number: string
  draw_date: string
  draw_time?: string
  is_verified: boolean
  is_correct?: boolean
  timeRemaining: {
    days: number
    hours: number
    minutes: number
    formatted: string
  }
}

interface ContractsDashboardProps {
  myContracts?: Contract[]
  subscribedContracts?: Contract[]
  userId: number
}

export function ContractsDashboard({
  myContracts = [],
  subscribedContracts = [],
  userId,
}: ContractsDashboardProps) {
  const [filterText, setFilterText] = useState("")
  const [statusFilter, setStatusFilter] = useState<"upcoming" | "all">("upcoming")

  const filteredMyContracts = myContracts.filter((c) => {
    const matchesText = c.lottery_name
      .toLowerCase()
      .includes(filterText.toLowerCase()) ||
      c.predicted_number.includes(filterText) ||
      c.publisher_username.toLowerCase().includes(filterText.toLowerCase())
    const matchesStatus = statusFilter === "all" || c.timeRemaining.days >= 0
    return matchesText && matchesStatus
  })

  const filteredSubscribed = subscribedContracts.filter((c) => {
    const matchesText = c.lottery_name
      .toLowerCase()
      .includes(filterText.toLowerCase()) ||
      c.predicted_number.includes(filterText) ||
      c.publisher_username.toLowerCase().includes(filterText.toLowerCase())
    const matchesStatus = statusFilter === "all" || c.timeRemaining.days >= 0
    return matchesText && matchesStatus
  })

  function getTimeColor(days: number): string {
    if (days <= 0) return "text-red-600 dark:text-red-400"
    if (days === 1) return "text-orange-600 dark:text-orange-400"
    return "text-green-600 dark:text-green-400"
  }

  function getUrgencyBadge(days: number): string {
    if (days <= 0) return "¡INMINENTE!"
    if (days === 1) return "Mañana"
    return `En ${days}d`
  }

  return (
    <div className="space-y-6">
      {/* Contratos publicados por ti */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Números que Publicaste
          </CardTitle>
          <CardDescription>
            Predicciones que ha publicado. Otros usuarios pueden contratarlas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myContracts.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aún no has publicado predicciones. 
            </p>
          ) : (
            <div className="space-y-3">
              {filteredMyContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="border rounded-lg p-4 flex items-start justify-between dark:border-gray-700 dark:bg-gray-950/20 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{contract.lottery_name}</Badge>
                      <Badge variant="secondary" className="font-mono">
                        {contract.predicted_number}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Sorteo: {new Date(contract.draw_date).toLocaleDateString("es-CO")}
                    </p>
                  </div>
                  <div className={`text-right ${getTimeColor(contract.timeRemaining.days)}`}>
                    <div className="text-lg font-bold">
                      {getUrgencyBadge(contract.timeRemaining.days)}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {contract.timeRemaining.formatted}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contratos que contrataste */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Predicciones que Contrataste
          </CardTitle>
          <CardDescription>
            Números publicados por otros usuarios que estás siguiendo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          {subscribedContracts.length > 0 && (
            <div className="space-y-3 pb-4 border-b dark:border-gray-700">
              <Input
                placeholder="Buscar por lotería, número o usuario..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter("upcoming")}
                  className={`px-3 py-1 rounded text-sm ${
                    statusFilter === "upcoming"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  Próximos
                </button>
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1 rounded text-sm ${
                    statusFilter === "all"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  Todos
                </button>
              </div>
            </div>
          )}

          {subscribedContracts.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aún no has contratado predicciones de otros usuarios.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredSubscribed.map((contract) => (
                <div
                  key={contract.id}
                  className="border rounded-lg p-4 dark:border-gray-700 dark:bg-gray-950/20 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{contract.lottery_name}</Badge>
                        <Badge variant="secondary" className="font-mono">
                          {contract.predicted_number}
                        </Badge>
                        {contract.is_verified && (
                          <Badge variant="default" className="bg-blue-600">
                            {contract.is_correct ? "✓ Acertado" : "✗ Fallido"}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>
                          Publicador:{" "}
                          <strong className="text-foreground">
                            {contract.publisher_username}
                          </strong>
                        </span>
                        <span>
                          Sorteo:{" "}
                          <strong>
                            {new Date(contract.draw_date).toLocaleDateString(
                              "es-CO"
                            )}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {!contract.is_verified && (
                      <div
                        className={`text-right flex flex-col items-end gap-1 ${getTimeColor(
                          contract.timeRemaining.days
                        )}`}
                      >
                        <Clock className="w-5 h-5" />
                        <div className="text-lg font-bold">
                          {getUrgencyBadge(contract.timeRemaining.days)}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {contract.timeRemaining.formatted}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
