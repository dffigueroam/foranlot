import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { BancolombiaQrClient } from "@/components/payments/bancolombia/bancolombia-qr-client"

export const metadata = {
  title: "Piloto Bre-B",
  robots: { index: false, follow: false },
}

export default async function BrebPilotPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const businessCode = process.env.NEXT_PUBLIC_PAYMENT_BREB_CODE || "0091765912"

  return (
    <PageWrapper user={{ username: user.username, role: user.role, is_premium: user.is_premium }}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Laboratorio Bre-B</h1>
          <p className="text-muted-foreground mt-1">
            Version separada para pruebas. Cuando quede validada, se integra a la pagina de pricing.
          </p>
        </div>

        <BancolombiaQrClient username={user.username} defaultBusinessKey={businessCode} />
      </div>
    </PageWrapper>
  )
}
