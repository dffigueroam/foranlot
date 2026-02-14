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
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* HEADER */}
        <h1 className="text-3xl font-bold mb-6">
          Perfil del pronosticador
        </h1>

        {/* 🔥 ANUNCIO DE CONTRATOS */}
        {subscribersCount > 0 && (
          <Card className="border-green-200 bg-green-50 mb-6">
            <CardContent className="py-4">
              <p className="font-semibold text-green-900">
                🔥 Este pronosticador tiene {subscribersCount} suscriptores activos
              </p>
              <p className="text-sm text-green-700">
                Usuarios Premium están recibiendo sus pronósticos
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
    </PageWrapper>
  )
}