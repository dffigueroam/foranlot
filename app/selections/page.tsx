import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import SelectionManager from "@/components/credits/selection-manager"
import NotificationCenter from "@/components/notifications/notification-center"
import SelectedPredictionsList from "@/components/predictions/selected-predictions-list"

export default async function SelectionsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (!user.is_premium) {
    redirect("/pricing")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Mis Selecciones Premium</h1>
          <p className="text-muted-foreground">Gestiona tus números favoritos y usuarios que sigues</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <SelectedPredictionsList />
            <SelectionManager />
          </div>
          <div>
            <NotificationCenter />
          </div>
        </div>
      </div>
    </div>
  )
}
