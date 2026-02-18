"use client"

import type { RankingUser } from "@/lib/ranking"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Trophy, Medal, Award, UserPlus, TrendingUp, Target, Zap, Link, Users } from "lucide-react"


interface RankingTableProps {
  users: RankingUser[]
  currentUser?: any
  onFollowUser?: (userId: number, username: string) => void
  showDetailedScores?: boolean
  title?: string
  description?: string
  showWaitlistBadge?: boolean
}

export function RankingTable({ users, currentUser, onFollowUser, showDetailedScores = false, title, description, showWaitlistBadge = false }: RankingTableProps) {
  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <span className="text-sm font-semibold text-muted-foreground">#{position}</span>
    }
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 70) return "bg-green-100 text-green-800 border-green-200"
    if (accuracy >= 50) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    if (accuracy >= 30) return "bg-orange-100 text-orange-800 border-orange-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || "Ranking de Pronosticadores"}</CardTitle>
        <CardDescription>
          {description || (showDetailedScores 
            ? "Ranking con scores detallados de compensación (50% aporte, 30% recurrencia, 20% consistencia)"
            : "Los mejores usuarios según precisión y aciertos")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Usuario</TableHead>
                {showDetailedScores && (
                  <>
                    <TableHead className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center justify-center gap-1">
                            <Target className="w-4 h-4" />
                            Aporte
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Score por aporte económico (50% peso)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center justify-center gap-1">
                            <Zap className="w-4 h-4" />
                            Recurrencia
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Score por recurrencia del número (30% peso)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center justify-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            Consistencia
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Score por consistencia histórica (20% peso)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-center">Score Total</TableHead>
                  </>
                )}
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Aciertos</TableHead>
                <TableHead className="text-center">Precisión</TableHead>
                <TableHead className="text-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center justify-center gap-1">
                        <Zap className="w-4 h-4" />
                        Score
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Puntos por combinaciones (4 pts = 4 cifras, 2 pts = 3 cifras)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="text-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center justify-center gap-1">
                        <Users className="w-4 h-4" />
                        Suscriptores
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Número de usuarios que siguen a este pronosticador</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="text-right">Ganado/Perdido</TableHead>
                <TableHead className="text-right">Contrato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => {
                const accuracy = Number(user.accuracy_percentage) || 0
                const earnings = Number(user.total_earnings_cents) || 0
                const position = user.rank_position || index + 1
                const isCurrentUser = currentUser?.id === user.user_id

                return (
                  <TableRow 
                    key={user.user_id}
                    className={isCurrentUser ? "bg-blue-50 dark:bg-blue-950/30 border-l-4 border-l-blue-500" : ""}
                  >
                    <TableCell className="font-medium">{getRankIcon(position)}</TableCell>                  
                    <TableCell className="font-semibold">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/users/${user.user_id}`}
                          className="hover:underline text-primary"
                        >
                          {user.username}
                        </Link>
                        {isCurrentUser && (
                          <Badge variant="secondary" className="bg-blue-500 text-white text-xs">
                            Tú
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    {showDetailedScores && (
                      <>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                            {((user as any).contributionScore * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                            {((user as any).recurrenceScore * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                            {((user as any).consistencyScore * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="default" className="bg-purple-600 text-white" style={{ backgroundImage: 'linear-gradient(to right, rgb(147, 51, 234), rgb(236, 72, 153))' }}>
                            {((user as any).totalScore * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </>
                    )}
                    
                    <TableCell className="text-center">{user.total_predictions}</TableCell>
                    <TableCell className="text-center">{user.correct_predictions}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={getAccuracyColor(accuracy)}>
                        {accuracy.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        {user.total_score || 0} pts
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        <Users className="w-3 h-3 mr-1" />
                        {user.subscribers_count || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span
                        className={
                          earnings > 0
                            ? "text-green-600 dark:text-green-400"
                            : earnings < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-700 dark:text-gray-300"
                        }
                      >
                        ${(earnings / 100).toFixed(2)}
                      </span>
                    </TableCell>
                  <TableCell className="text-right">
                      {isCurrentUser ? (
                        <Button size="sm" disabled>
                          Tú
                        </Button>
                      ) : currentUser?.is_premium ? (
                        <Button size="sm" asChild>
                          <a href={`/contracts?userId=${user.user_id}`}>
                            Contratar
                          </a>
                        </Button>
                      ) : (
                        <Button size="sm" disabled>
                          Contratar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {users.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <p>No hay datos de ranking disponibles</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
