"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, TrendingUp, Crown, Info } from "lucide-react"

interface ExpertsTabProps {
  activeContracts: any[]
  groupedByDate: Record<string, any[]>
  recentDates: string[]
}

export function ExpertsTab({ activeContracts, groupedByDate, recentDates }: ExpertsTabProps) {
  const contractUserIds = new Set(activeContracts.map(contract => contract.selected_user_id))
  const recentDate = recentDates[0]
  const recentPredictions = recentDate ? groupedByDate[recentDate] || [] : []
  const contractPredictions = recentPredictions.filter(p => contractUserIds.has(p.user_id))
  const summaryNumbers = Array.from(new Set(contractPredictions.map(p => p.predicted_number)))
  const summaryLotteries = Array.from(new Set(contractPredictions.map(p => p.lottery_name)))
  const summaryExperts = new Set(contractPredictions.map(p => p.user_id)).size

  return (
    <div className="space-y-6">
      <Card className="bg-linear-to-r from-green-50 to-teal-50 dark:from-green-500/10 dark:to-teal-500/10 border-green-200 dark:border-green-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            Recomendaciones de Expertos
          </CardTitle>
          <CardDescription>
            Pronósticos de los mejores predictores que sigues mediante contratos
          </CardDescription>
        </CardHeader>
      </Card>

      {activeContracts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-500/20 dark:to-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  No tienes contratos activos
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crea contratos con los mejores predictores para recibir sus recomendaciones diarias
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link href="/ranking">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Ver Ranking de Expertos
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/selections">
                    <Crown className="w-4 h-4 mr-2" />
                    Gestionar Contratos
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Contratos activos: {activeContracts.length}</strong>
              <br />
              Cada contrato gasta 1 crédito por día. Aquí ves los últimos pronósticos de cada experto.
            </AlertDescription>
          </Alert>

          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-base">Resumen del último posteo</CardTitle>
              <CardDescription>
                {recentDate ? (
                  <>Fecha: {new Date(recentDate).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}</>
                ) : (
                  <>Sin fecha reciente</>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentDate && contractPredictions.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground">
                    Expertos con publicaciones: {summaryExperts}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Números:</p>
                    <div className="flex flex-wrap gap-2">
                      {summaryNumbers.map((num, idx) => (
                        <span key={idx} className="font-mono text-sm font-semibold bg-muted px-2 py-1 rounded">
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Loterías:</span> {summaryLotteries.join(" • ")}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aún no hay pronósticos recientes de tus expertos.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {activeContracts.map(contract => {
              const contractUsername = contract.selected_username || 'Usuario'
              
              return (
                <Card key={contract.id} className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="w-8 h-8 bg-linear-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {contractUsername.charAt(0).toUpperCase()}
                        </div>
                        {contractUsername}
                      </CardTitle>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/users/${contract.selected_user_id}`}>
                          Ver perfil
                        </Link>
                      </Button>
                    </div>
                    <CardDescription>
                      Gasta 1 crédito/día • Última fecha posteada
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentDates.length > 0 ? (
                      <div className="space-y-3">
                        {recentDates.map(date => {
                          const datePredictions = groupedByDate[date]
                          
                          // Filtrar solo pronósticos de este usuario específico
                          const userPredictions = datePredictions.filter(p => 
                            p.user_id === contract.selected_user_id
                          )
                          
                          // Si este usuario no tiene pronósticos en esta fecha, no mostrar
                          if (userPredictions.length === 0) {
                            return (
                              <p key={date} className="text-sm text-muted-foreground text-center py-2">
                                Sin pronósticos recientes
                              </p>
                            )
                          }
                          
                          const uniqueNumbers = Array.from(new Set(userPredictions.map(p => p.predicted_number)))
                          const uniqueLotteries = Array.from(new Set(userPredictions.map(p => p.lottery_name)))
                          const recommendations = userPredictions
                            .map(p => p.notes)
                            .filter(n => n && n.trim())
                          
                          return (
                            <div key={date} className="space-y-3">
                              <p className="text-xs text-muted-foreground font-medium">
                                📅 {new Date(date).toLocaleDateString('es-CO', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </p>
                              
                              <div className="border-l-2 border-blue-500 pl-3 space-y-2">
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">Números:</p>
                                  {uniqueNumbers.map((num, idx) => (
                                    <p key={idx} className="font-mono text-sm font-semibold">
                                      {num}
                                    </p>
                                  ))}
                                </div>
                                
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium">Loterías:</span> {uniqueLotteries.join(' • ')}
                                </p>
                                
                                {recommendations.length > 0 && (
                                  <div className="pt-2 border-t border-border">
                                    <p className="text-xs font-medium text-foreground mb-1">Recomendaciones:</p>
                                    {recommendations.map((rec, idx) => (
                                      <p key={idx} className="text-xs text-muted-foreground italic">
                                        "{rec}"
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        Sin pronósticos disponibles
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">¿Quieres seguir a más expertos?</p>
                  <p className="text-sm text-muted-foreground">
                    Explora el ranking y crea nuevos contratos
                  </p>
                </div>
                <Button asChild>
                  <Link href="/ranking">
                    Explorar Ranking
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
