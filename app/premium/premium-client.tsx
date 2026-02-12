"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wrench, TrendingUp, Users } from "lucide-react"
import { ToolsTab } from "@/components/premium/tools-tab"
import { StrategiesTab } from "@/components/premium/strategies-tab"
import { ExpertsTab } from "@/components/premium/experts-tab"

interface PremiumClientProps {
  user: {
    id: number
    username: string
    email: string
    is_premium: boolean
    role: string
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
      <TabsList className="grid w-full grid-cols-3 mb-8">
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
      </TabsList>

      <TabsContent value="tools">
        <ToolsTab user={user} />
      </TabsContent>

      <TabsContent value="strategies">
        <StrategiesTab />
      </TabsContent>

      <TabsContent value="experts">
        <ExpertsTab 
          activeContracts={activeContracts}
          groupedByDate={groupedByDate}
          recentDates={recentDates}
        />
      </TabsContent>
    </Tabs>
  )
}
