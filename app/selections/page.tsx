import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export const metadata = {
  robots: { index: false, follow: false },
}
import SelectionManager from "@/components/credits/selection-manager"
import NotificationCenter from "@/components/notifications/notification-center"
import SelectedPredictionsList from "@/components/predictions/selected-predictions-list"
import { PageWrapper } from "@/components/layout/page-wrapper"

export default async function SelectionsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (!user.is_premium) {
    redirect("/pricing")
  }

  return (
    <PageWrapper user={{ username: user.username, role: user.role, is_premium: user.is_premium }}>
      <div className="min-h-screen bg-linear-to-br from-background via-emerald-50/20 dark:via-emerald-950/10 to-background relative">
        <div className="fixed inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 bg-linear-to-br from-emerald-400 to-cyan-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-linear-to-t from-yellow-400 to-orange-500 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto py-8 px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="rounded-2xl border border-emerald-300/40 dark:border-emerald-700/30 bg-white/60 dark:bg-slate-900/30 backdrop-blur-sm p-5">
              <h1 className="text-4xl font-black mb-2 bg-linear-to-r from-emerald-700 via-cyan-700 to-blue-700 dark:from-emerald-300 dark:via-cyan-300 dark:to-blue-300 bg-clip-text text-transparent">Mis Selecciones Premium</h1>
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
      </div>
    </PageWrapper>
  )
}
