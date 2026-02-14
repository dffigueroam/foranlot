import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { ToolsClient } from "./tools-client"
import { PageWrapper } from "@/components/layout/page-wrapper"

export default async function ToolsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <PageWrapper user={{ username: user.username, role: user.role, is_premium: user.is_premium }}>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Herramientas de Predicción</h1>
          <p className="text-muted-foreground">
            {user.is_premium 
              ? "Acceso completo a todas las herramientas avanzadas para optimizar tus pronósticos"
              : "Usa herramientas gratuitas básicas para analizar números. Actualiza a premium para acceso ilimitado a análisis avanzados"
            }
          </p>
        </div>

        <Suspense fallback={<div>Cargando herramientas...</div>}>
          <ToolsClient user={user} />
        </Suspense>
      </div>
    </PageWrapper>
  )
}
