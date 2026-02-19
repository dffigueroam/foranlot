import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { ToolsClient } from "./tools-client"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { getDailyFreeToolAction } from "@/app/actions/prediction-tools"

export default async function ToolsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }
  const dailyFreeToolRes = await getDailyFreeToolAction()
  const dailyFreeTool = dailyFreeToolRes.success && dailyFreeToolRes.freeTool && !dailyFreeToolRes.freeTool.is_used ? dailyFreeToolRes.freeTool : null

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
      {/* Anuncio al final absoluto de la página */}
      {dailyFreeTool && (
        <div className="w-full mt-16 mb-8">
          <div className="max-w-4xl mx-auto bg-green-50 dark:bg-green-950 border border-green-500 rounded-lg px-4 py-3 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-xs shadow-lg">
            <svg className="w-5 h-5 text-green-600 shrink-0 mb-2 sm:mb-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07-7.07l-1.41 1.41M6.34 17.66l-1.41 1.41m12.02 0l-1.41-1.41M6.34 6.34L4.93 4.93" /></svg>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-green-800 dark:text-green-200">Herramienta Gratis del Día</div>
              <div className="truncate">
                Hoy puedes usar <span className="font-bold">{dailyFreeTool.tool_name}</span> gratis para {dailyFreeTool.lottery_type.replace("_", " ")}
              </div>
            </div>
            <a href="#tools-section" className="inline-block bg-green-600 hover:bg-green-700 h-7 px-3 text-xs text-white rounded transition-colors">Usar Ahora</a>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
