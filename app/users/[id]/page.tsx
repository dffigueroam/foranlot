import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getUserPredictions } from "@/lib/predictions"
import { getActiveSubscribersCount } from "@/lib/credits"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageWrapper } from "@/components/layout/page-wrapper"

interface ProfilePageProps {
  params: {
    id: string
  }
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const profileUserId = Number(params.id)
  if (Number.isNaN(profileUserId)) redirect("/ranking")

  const currentUser = await getCurrentUser()

  const predictions = await getUserPredictions(profileUserId)
  const subscribersCount = await getActiveSubscribersCount(profileUserId)

  return (
    <PageWrapper user={currentUser ? { username: currentUser.username, role: currentUser.role, is_premium: currentUser.is_premium } : null}>
      <div className="min-h-screen bg-linear-to-br from-background via-emerald-50/20 dark:via-emerald-950/10 to-background relative">
        <div className="fixed inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
          <div className="absolute top-20 right-16 w-80 h-80 bg-linear-to-br from-emerald-400 to-cyan-500 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* HEADER */}
          <h1 className="text-3xl font-black mb-6 bg-linear-to-r from-emerald-700 via-cyan-700 to-blue-700 dark:from-emerald-300 dark:via-cyan-300 dark:to-blue-300 bg-clip-text text-transparent">
            Perfil del pronosticador
          </h1>

        {/* Indicador de seguimiento */}
        {subscribersCount > 0 && (
          <Card className="border-green-200 bg-green-50 mb-6">
            <CardContent className="py-4">
              <p className="font-semibold text-green-900">
                🔥 Este pronosticador tiene {subscribersCount} seguidores activos
              </p>
              <p className="text-sm text-green-700">
                Usuarios premium están viendo sus pronósticos del día
              </p>
            </CardContent>
          </Card>
        )}

        {/* PRONÓSTICOS (solo texto / placeholder por ahora) */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {predictions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Este usuario aún no tiene pronósticos publicados
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Pronósticos privados (solo visibles para suscriptores)
              </p>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </PageWrapper>
  )
}