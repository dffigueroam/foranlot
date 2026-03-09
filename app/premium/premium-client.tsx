"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wrench, TrendingUp, Users } from "lucide-react"
import { ToolsTab } from "@/components/premium/tools-tab"
import { StrategiesTab } from "@/components/premium/strategies-tab"
import { ExpertsTab } from "@/components/premium/experts-tab"
import { LinkedAccountsManager } from "@/components/premium/linked-accounts-manager"
import { OptimizationPatternsPanel } from "@/components/premium/optimization-patterns-panel"

interface PremiumClientProps {
  user: {
    id: number
    username: string
    email: string
    is_premium: boolean
    role: string
    country?: string | null
  }
  activeContracts: any[]
  groupedByDate: Record<string, any[]>
  recentDates: string[]
}

export function PremiumClient({ 
  user, 
  activeContracts, 
  groupedByDate, 
  recentDates 
}: PremiumClientProps) {
  return (
    <Tabs defaultValue="tools" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-8">
        <TabsTrigger value="tools" className="flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          <span className="hidden sm:inline">Herramientas</span>
        </TabsTrigger>
        <TabsTrigger value="strategies" className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          <span className="hidden sm:inline">Estrategias</span>
        </TabsTrigger>
        <TabsTrigger value="experts" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">Expertos</span>
        </TabsTrigger>
        <TabsTrigger value="optimization" className="flex items-center gap-2">
          <span className="w-4 h-4">⚡</span>
          <span className="hidden sm:inline">Optimizacion</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="tools">
        <ToolsTab user={user} />
      </TabsContent>

      <TabsContent value="strategies">
        <StrategiesTab preferredCountry={user.country || ""} />
      </TabsContent>

      <TabsContent value="experts">
        <ExpertsTab 
          activeContracts={activeContracts}
          groupedByDate={groupedByDate}
          recentDates={recentDates}
        />
      </TabsContent>

      <TabsContent value="optimization">
        <OptimizationPatternsPanel />
        <LinkedAccountsManager userId={user.id} />
      </TabsContent>
    </Tabs>
  )
}
