import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AvatarSelector } from "@/components/avatars/avatar-selector"
import { getUserAvatar } from "@/lib/avatars.server"

export const metadata = {
  robots: { index: false, follow: false },
}
import { EditProfileForm } from "@/components/profile/edit-profile-form"

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  const currentAvatar = await getUserAvatar(user.id)

  return (
    <PageWrapper user={{ username: user.username, role: user.role, is_premium: user.is_premium }}>
      <div className="min-h-screen bg-linear-to-br from-background via-emerald-50/20 dark:via-emerald-950/10 to-background relative">
        <div className="fixed inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
          <div className="absolute top-20 left-20 w-80 h-80 bg-linear-to-br from-emerald-400 to-cyan-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-linear-to-br from-sky-400 to-blue-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-xl mx-auto py-10 px-4">
          <div className="rounded-2xl border border-emerald-300/40 dark:border-emerald-700/30 bg-white/60 dark:bg-slate-900/30 backdrop-blur-sm p-5 mb-6">
            <h1 className="text-2xl font-black bg-linear-to-r from-emerald-700 via-cyan-700 to-blue-700 dark:from-emerald-300 dark:via-cyan-300 dark:to-blue-300 bg-clip-text text-transparent">Mi Perfil</h1>
          </div>

          <Card className="mb-6 border-emerald-200/60 dark:border-emerald-800/50">
            <CardHeader>
              <CardTitle>Avatar del pronosticador</CardTitle>
            </CardHeader>
            <CardContent>
              <AvatarSelector
                currentAvatarId={(currentAvatar as any)?.avatar_id || undefined}
                currentAvatarType={(currentAvatar as any)?.avatar_type || undefined}
              />
            </CardContent>
          </Card>

          <EditProfileForm
            initialData={{
              fullName: user.full_name || "",
              email: user.email || "",
              username: user.username || "",
              country: user.country || "",
              city: user.city || "",
              company: user.company || "",
              profession: user.profession || "",
              estrato: user.estrato || "",
              gender: user.gender || "",
              acceptsMarketingEmails: user.accepts_marketing_emails || false,
            }}
          />
        </div>
      </div>
    </PageWrapper>
  )
}
