"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Lock } from "lucide-react"
import Link from "next/link"

interface ToolCardProps {
  tool: {
    id: number
    name: string
    description: string
    tool_type: string
    category: string
    is_premium: boolean
    credits_cost: number
  }
  isFreeTool?: boolean
  onUse: (toolId: number) => void
  userIsPremium?: boolean
  accessInfo?: {
    canAccess: boolean
    requiresPremium: boolean
    creditsCost: number
    userCredits: number
    userIsPremium: boolean
  }
  isLimitReached?: boolean
}

export function ToolCard({ tool, isFreeTool, onUse, userIsPremium, accessInfo, isLimitReached }: ToolCardProps) {
  const canUse = accessInfo ? accessInfo.canAccess : !tool.is_premium || userIsPremium || isFreeTool
  const isAccessible = canUse && !isLimitReached
  const needsPremium = accessInfo?.requiresPremium && !accessInfo?.userIsPremium

  return (
    <Card className={`${isFreeTool ? "border-green-500 border-2" : ""}${!isAccessible ? " opacity-60 border-dashed" : ""}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{tool.name}</CardTitle>
            <CardDescription>{tool.description}</CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {isFreeTool && (
              <Badge className="bg-green-500">
                <Sparkles className="w-3 h-3 mr-1" />
                Gratis
              </Badge>
            )}
            {(accessInfo?.creditsCost ?? 0) > 0 && !isFreeTool && (
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">
                {accessInfo?.creditsCost || tool.credits_cost} créditos
              </Badge>
            )}
            {tool.is_premium && accessInfo?.userIsPremium && (
              <Badge className="bg-purple-600">Premium</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex gap-2">
            {!isFreeTool && <Badge variant="outline">{tool.tool_type}</Badge>}
          </div>

          {!isAccessible ? (
            <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded border border-amber-200 dark:border-amber-800 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                <Lock className="w-4 h-4" />
                {isLimitReached
                  ? "Límite diario alcanzado"
                  : needsPremium
                    ? "Requiere Premium"
                    : "Créditos insuficientes"}
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {isLimitReached
                  ? "Has alcanzado el límite de herramientas por hoy. Vuelve mañana."
                  : needsPremium
                    ? "Suscríbete a Premium para usar esta herramienta"
                    : `Necesitas ${(accessInfo?.creditsCost ?? 0) - (accessInfo?.userCredits ?? 0)} créditos más`}
              </p>
              {!isLimitReached && (
                <Link href="/pricing" className="block" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="w-full">
                    {needsPremium ? "Ir a Premium" : "Comprar Créditos"}
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <Button
              onClick={() => onUse(tool.id)}
              className="w-full"
              variant={tool.credits_cost === 0 || isFreeTool ? "default" : "secondary"}
            >
              {isFreeTool ? "Usar Gratis" : tool.credits_cost > 0 ? `Usar (${tool.credits_cost} créditos)` : "Usar"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
