"use client"
import dynamic from "next/dynamic"

const Tabs = dynamic(() => import("@/components/ui/tabs").then(mod => mod.Tabs), { ssr: false })
const TabsList = dynamic(() => import("@/components/ui/tabs").then(mod => mod.TabsList), { ssr: false })
const TabsTrigger = dynamic(() => import("@/components/ui/tabs").then(mod => mod.TabsTrigger), { ssr: false })
const TabsContent = dynamic(() => import("@/components/ui/tabs").then(mod => mod.TabsContent), { ssr: false })

// Accept children and render them inside Tabs
export default function AdminTabsPanel({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
