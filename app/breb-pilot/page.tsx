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
      <div className="min-h-screen bg-linear-to-br from-background via-emerald-50/20 dark:via-emerald-950/10 to-background relative">
        <div className="fixed inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
          <div className="absolute top-20 left-10 w-80 h-80 bg-linear-to-br from-cyan-400 to-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-linear-to-br from-emerald-400 to-teal-500 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 rounded-2xl border border-cyan-300/40 dark:border-cyan-700/30 bg-white/60 dark:bg-slate-900/30 backdrop-blur-sm p-5">
            <h1 className="text-3xl font-black bg-linear-to-r from-emerald-700 via-cyan-700 to-blue-700 dark:from-emerald-300 dark:via-cyan-300 dark:to-blue-300 bg-clip-text text-transparent">Prueba de QR y datos Bre-B</h1>
            <p className="text-muted-foreground mt-1">
              Version separada para pruebas. Cuando quede validada, se integra a la pagina de pricing.
            </p>
          </div>

          <BancolombiaQrClient username={user.username} defaultBusinessKey={businessCode} />
        </div>
      </div>
    </PageWrapper>
  )
}
