import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { ToolsClient } from "./tools-client"

export default async function ToolsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Herramientas de Predicción</h1>
        <p className="text-muted-foreground">
          Utiliza herramientas estadísticas avanzadas para mejorar tus pronósticos
        </p>
      </div>

      <Suspense fallback={<div>Cargando herramientas...</div>}>
        <ToolsClient user={user} />
      </Suspense>
    </div>
  )
}
