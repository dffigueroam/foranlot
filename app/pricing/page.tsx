import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { MEMBERSHIP_PRODUCTS } from "@/lib/products"
import { calculateOptimalMembershipPrice } from "@/lib/black-scholes"
import { formatCOP } from "@/lib/pricingutils"
import { getPaymentMethods } from "@/lib/payment-methods"
import { PricingCard } from "@/components/pricing/pricing-card"
import { Check } from "lucide-react"
import { ManualPaymentForm } from "@/components/payments/manual-payment-form"
import { PageWrapper } from "@/components/layout/page-wrapper"

export default async function PricingPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const monthlyProduct = MEMBERSHIP_PRODUCTS.find((p) => p.id.includes("monthly"))
  const yearlyProduct = MEMBERSHIP_PRODUCTS.find((p) => p.id.includes("yearly"))
  const monthlyPrice = monthlyProduct?.price ?? 0
  const yearlyPrice = yearlyProduct?.price ?? 0

  const pricingAnalysis = calculateOptimalMembershipPrice(monthlyPrice, yearlyPrice)
  const nextReview = pricingAnalysis.nextReviewDate.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  // Obtener métodos de pago desencriptados en el servidor
  const paymentMethods = getPaymentMethods()
  console.log("[v0] PricingPage: paymentMethods =", paymentMethods.length, "methods")

  return (
    <PageWrapper user={{ username: user.username, role: user.role, is_premium: user.is_premium }}>
      <div className="min-h-screen bg-gradient-to-br from-background via-yellow-50/20 dark:via-yellow-950/10 to-background relative">
        {/* Elementos decorativos de fondo */}
        <div className="fixed inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-br from-yellow-400 to-orange-500 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 left-0 w-96 h-96 bg-linear-to-br from-pink-400 to-red-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-linear-to-t from-orange-400 to-yellow-500 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-balance bg-linear-to-r from-yellow-600 via-orange-600 to-red-600 dark:from-yellow-400 dark:via-orange-400 dark:to-red-400 bg-clip-text text-transparent">Elige tu Plan Premium</h1>
          <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
            Accede a todos los pronósticos y apoya a los usuarios que comparten sus predicciones
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {MEMBERSHIP_PRODUCTS.map((product) => (
            <PricingCard key={product.id} product={product} userIsPremium={user.is_premium} />
          ))}
        </div>

        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Por ahora solo tenemos pagos por transferencias</h2>
            <p className="text-muted-foreground">
              Completa el formulario con los datos de tu transferencia y te activaremos los créditos
            </p>
          </div>

          <ManualPaymentForm paymentMethods={paymentMethods} username={user.username} />
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-linear-to-br from-orange-50/40 to-yellow-50/40 dark:from-orange-900/10 dark:to-yellow-900/10 rounded-lg shadow-sm p-8 border-2 border-orange-300/40 dark:border-orange-500/30 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-4 bg-linear-to-r from-orange-700 to-yellow-700 dark:from-orange-300 dark:to-yellow-300 bg-clip-text text-transparent">¿Cómo funcionan las membresías?</h2>
            <div className="space-y-4 text-muted-foreground">
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <p>El 80% de tu membresía va al mantenimiento y desarrollo de la plataforma</p>
              </div>
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <p>
                  El 20% se distribuye entre los usuarios que publican pronósticos acertados, proporcionalmente a sus
                  aciertos
                </p>
              </div>
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <p>Cancela en cualquier momento desde tu panel de control</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto mt-12">
          <div className="bg-linear-to-br from-red-50/40 to-pink-50/40 dark:from-red-900/10 dark:to-pink-900/10 rounded-lg shadow-sm p-8 border-t-4 border-t-red-400 dark:border-t-red-500 border border-red-300/40 dark:border-red-500/30 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-4 bg-linear-to-r from-red-700 to-pink-700 dark:from-red-300 dark:to-pink-300 bg-clip-text text-transparent">Transparencia de precios (Black-Scholes)</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Este análisis es informativo. No garantiza resultados ni cambios automáticos de precio.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-lg bg-gradient-to-br from-yellow-100/40 to-orange-100/40 dark:from-yellow-900/20 dark:to-orange-900/20 border border-dashed border-yellow-400/50 dark:border-yellow-500/30 p-4">
                <p className="text-xs text-muted-foreground">Precio actual mensual</p>
                <p className="text-xl font-bold">${formatCOP(monthlyPrice)} COP</p>
                <p className="text-xs text-muted-foreground mt-2">Recomendado</p>
                <p className="text-lg font-semibold text-orange-700 dark:text-orange-300">
                  ${formatCOP(pricingAnalysis.optimalMonthlyPrice)} COP
                </p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-red-100/40 to-pink-100/40 dark:from-red-900/20 dark:to-pink-900/20 border border-dashed border-red-400/50 dark:border-red-500/30 p-4">
                <p className="text-xs text-muted-foreground">Precio actual anual</p>
                <p className="text-xl font-bold">${formatCOP(yearlyPrice)} COP</p>
                <p className="text-xs text-muted-foreground mt-2">Recomendado</p>
                <p className="text-lg font-semibold text-red-700 dark:text-red-300">
                  ${formatCOP(pricingAnalysis.optimalAnnualPrice)} COP
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-gradient-to-r from-yellow-100/30 to-orange-100/30 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-400/30 dark:border-yellow-500/20 p-4">
              <p className="text-sm">
                <span className="font-semibold">Recomendación:</span> {pricingAnalysis.priceAdjustment}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Próxima revisión estimada: {nextReview}
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </PageWrapper>
  )
}
