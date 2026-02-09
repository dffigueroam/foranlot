import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { MEMBERSHIP_PRODUCTS } from "@/lib/products"
import { calculateOptimalMembershipPrice } from "@/lib/black-scholes"
import { formatCOP } from "@/lib/pricingutils"
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

  return (
    <PageWrapper user={{ username: user.username, role: user.role }}>
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-balance">Elige tu Plan Premium</h1>
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
            <h2 className="text-2xl font-bold mb-2">¿Prefieres pagar por transferencia?</h2>
            <p className="text-muted-foreground">
              Completa el formulario con los datos de tu transferencia y te activaremos los créditos
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <ManualPaymentForm planType="monthly" />
            <ManualPaymentForm planType="annual" />
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-900/60 dark:border-gray-700 rounded-lg shadow-sm p-8 border">
            <h2 className="text-2xl font-bold mb-4">¿Cómo funcionan las membresías?</h2>
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
          <div className="bg-white dark:bg-gray-900/60 dark:border-gray-700 rounded-lg shadow-sm p-8 border">
            <h2 className="text-2xl font-bold mb-4">Transparencia de precios (Black-Scholes)</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Este análisis es informativo. No garantiza resultados ni cambios automáticos de precio.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4">
                <p className="text-xs text-muted-foreground">Precio actual mensual</p>
                <p className="text-xl font-bold">${formatCOP(monthlyPrice)} COP</p>
                <p className="text-xs text-muted-foreground mt-2">Recomendado</p>
                <p className="text-lg font-semibold">
                  ${formatCOP(pricingAnalysis.optimalMonthlyPrice)} COP
                </p>
              </div>
              <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4">
                <p className="text-xs text-muted-foreground">Precio actual anual</p>
                <p className="text-xl font-bold">${formatCOP(yearlyPrice)} COP</p>
                <p className="text-xs text-muted-foreground mt-2">Recomendado</p>
                <p className="text-lg font-semibold">
                  ${formatCOP(pricingAnalysis.optimalAnnualPrice)} COP
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800 p-4">
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
    </PageWrapper>
  )
}
