import { getCurrentUser } from "@/lib/auth"

export const metadata = {
  robots: { index: false, follow: false },
}
import { EditProfileForm } from "@/components/profile/edit-profile-form"

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) return <div className="text-red-500">No autenticado</div>

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>
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
          acceptsMarketingEmails: user.accepts_marketing_emails || false
        }}
      />
    </div>
  )
}
