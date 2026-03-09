import type { Metadata } from "next"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FAQSection } from "@/components/landing/faq-section"
import { ContactSection } from "@/components/landing/contact-section"
import { BarChart3, Crown, TrendingUp, Users, Sparkles, Target, Zap, Trophy } from "lucide-react"

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lot-iq.com"

export const metadata: Metadata = {
  title: "Predicciones de Loteria en Colombia | Resultados y Comunidad",
  description:
    "ForanLot es una comunidad de pronosticos de loteria en Colombia: publica predicciones, consulta resultados recientes y sigue a los pronosticadores con mejor desempeño.",
  alternates: {
    canonical: "/",
    languages: {
      "es-CO": "/",
      "es": "/",
    },
  },
  openGraph: {
    title: "ForanLot | Predicciones de Loteria en Colombia",
    description:
      "Comunidad de pronosticos de loteria en Colombia con resultados, estadisticas y seguimiento de pronosticadores.",
    url: "/",
    siteName: "ForanLot",
    locale: "es_CO",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ForanLot - Predicciones de Loteria",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ForanLot | Predicciones de Loteria en Colombia",
    description:
      "Publica predicciones, consulta resultados y sigue a los mejores pronosticadores de la comunidad.",
    images: ["/twitter-image.png"],
  },
}

export default async function HomePage() {
  const user = await getCurrentUser()
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ForanLot",
    url: appUrl,
    inLanguage: "es-CO",
    potentialAction: {
      "@type": "SearchAction",
      target: `${appUrl}/results?query={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ForanLot",
    url: appUrl,
    logo: `${appUrl}/logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "soporte@foranlot.com",
      availableLanguage: ["es"],
      areaServed: "CO",
    },
  }

  return (
    <PageWrapper user={user ? { username: user.username, role: user.role, is_premium: user.is_premium } : null}>
      <div className="min-h-screen bg-white dark:bg-linear-to-br dark:from-slate-950 dark:via-purple-950 dark:to-slate-950 text-foreground dark:text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        
        {/* Hero Section Mejorado */}
        <div className="relative overflow-hidden">
          {/* Fondo decorativo con patrón de números */}
          <div className="absolute inset-0 -z-10 opacity-5 dark:opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-linear-to-br from-green-400 to-cyan-500 rounded-full blur-3xl"></div>
            <div className="absolute top-40 right-0 w-96 h-96 bg-linear-to-bl from-yellow-400 to-orange-500 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-linear-to-t from-pink-400 to-red-500 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 py-24 md:py-32">
            <div className="text-center max-w-5xl mx-auto relative z-10">
              <div className="space-y-4 mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-linear-to-r from-green-100 to-cyan-100 dark:from-green-900/40 dark:to-cyan-900/40 border border-green-400/50 dark:border-green-500/50 backdrop-blur">
                  <span className="text-2xl">�</span>
                  <span className="font-medium text-green-900 dark:text-green-200">Pronósticos Inteligentes. Dinero Real. Comunidad Confiable.</span>
                </div>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-8 text-balance leading-tight">
                <span className="bg-linear-to-r from-green-600 via-cyan-500 to-blue-600 dark:from-green-300 dark:via-cyan-300 dark:to-blue-300 bg-clip-text text-transparent">
                  Pronósticos Inteligentes
                </span>
                <br />
                <span className="bg-linear-to-r from-yellow-500 via-orange-500 to-red-500 dark:from-yellow-300 dark:via-orange-300 dark:to-red-300 bg-clip-text text-transparent">
                  Dinero Real
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 mb-12 text-balance leading-relaxed max-w-3xl mx-auto">
                Comparte tus predicciones de lotería con una comunidad de expertos. Sigue a los mejores pronosticadores, entiende patrones, y gana dinero por cada acierto. Sin comisiones ocultas. <span className="font-bold text-green-600 dark:text-green-400">100% transparente</span>.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap mb-16">
                <Button size="lg" className="bg-linear-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-white font-bold px-8 shadow-lg hover:shadow-xl transition-all text-base" asChild>
                  <Link href="/register">
                    Comenzar Gratis Ahora
                    <span className="ml-2 text-xl">🚀</span>
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-2 border-purple-400 text-purple-900 dark:text-purple-300 dark:border-purple-400 dark:hover:bg-purple-900/50 hover:bg-purple-50 font-semibold px-8" asChild>
                  <Link href="/login">Entrar a Mi Cuenta</Link>
                </Button>
              </div>

              {/* Stats - Mejorado */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 border-t border-gray-300 dark:border-purple-700/50">
                <div className="group">
                  <div className="text-4xl font-black bg-linear-to-r from-green-600 to-cyan-600 dark:from-green-400 dark:to-cyan-400 bg-clip-text text-transparent">15K+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Pronosticadores Activos</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Mejorando cada día</div>
                </div>
                <div className="group">
                  <div className="text-4xl font-black bg-linear-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent">$2.3M</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Distribuido a Usuarios</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">En 2025</div>
                </div>
                <div className="group">
                  <div className="text-4xl font-black bg-linear-to-r from-pink-600 to-red-600 dark:from-pink-400 dark:to-red-400 bg-clip-text text-transparent">98.2%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Tasa de Precisión</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Sistema auditado</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filosofía de Meritocracia y Calificación */}
        <div className="relative py-16 bg-linear-to-b from-transparent via-green-50/40 dark:via-green-900/20 to-transparent">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-black mb-4 text-green-900 dark:text-green-200">
                Solo los mejores pronosticadores se mantienen
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 font-medium mb-4">
                En Lot-IQ, la comunidad califica y sigue a quienes demuestran resultados consistentes. El sistema de ranking premia la precisión, la recurrencia y la constancia, no los golpes de suerte. Así, la comunidad se beneficia de los verdaderos expertos y se filtran los "chispazos" de casualidad.
              </p>
              <p className="text-base text-gray-600 dark:text-gray-400">
                Si eres bueno, tu historial lo demostrará y ganarás seguidores y recompensas reales. Si no, la comunidad lo notará. Aquí, la meritocracia es real y transparente.
              </p>
            </div>
          </div>
        </div>
        <div className="relative py-20 bg-linear-to-b from-transparent via-purple-50/30 dark:via-purple-900/20 to-transparent">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="text-4xl sm:text-5xl font-black mb-4 text-gray-900 dark:text-white">
                Por qué <span className="bg-linear-to-r from-green-600 to-cyan-600 dark:from-green-400 dark:to-cyan-400 bg-clip-text text-transparent">Lot-IQ</span> es diferente
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg">Características diseñadas para maximizar tus ganancias</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: "👥",
                  title: "Comunidad de Expertos",
                  desc: "Conecta con miles de pronosticadores verificados en tiempo real",
                  color: "from-blue-500 to-cyan-500"
                },
                {
                  icon: "📊",
                  title: "Ranking Inteligente",
                  desc: "Posiciónate según precisión, frecuencia y consistencia",
                  color: "from-purple-500 to-pink-500"
                },
                {
                  icon: "🎯",
                  title: "Análisis de Patrones",
                  desc: "Herramientas para detectar números calientes y tendencias",
                  color: "from-green-500 to-emerald-500"
                },
                {
                  icon: "💰",
                  title: "Gana Dinero Real",
                  desc: "Recibe el 20% de membresías y 25% de premios verificados",
                  color: "from-yellow-500 to-orange-500"
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className={
                    `relative group bg-white dark:bg-gray-800/50 dark:backdrop-blur border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-purple-500/10 transition-all duration-300`
                  }
                >
                  {/* Always render the gradient background for hydration consistency */}
                  <div
                    className="absolute inset-0 bg-linear-to-br rounded-xl transition-opacity duration-300"
                    aria-hidden="true"
                  ></div>
                  {/* Color overlay for client only (avoids hydration mismatch) */}
                  <div
                    className={`absolute inset-0 ${feature.color} opacity-0 group-hover:opacity-10 dark:opacity-0 dark:group-hover:opacity-20 rounded-xl transition-opacity duration-300`}
                    aria-hidden="true"
                  ></div>
                  <div className="relative z-10">
                    <div className="text-5xl mb-4">{feature.icon}</div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How it works - Mejorado */}
        <div className="py-24 bg-linear-to-b from-transparent via-blue-50/30 dark:via-blue-900/10 to-transparent">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl sm:text-5xl font-black mb-4 text-gray-900 dark:text-white">
                  Comienza en 4 Pasos Simples
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg">Desde cero a ganancias reales en minutos</p>
              </div>

              <div className="relative">
                {/* Línea conectora (solo desktop) */}
                <div className="hidden lg:block absolute top-24 left-12 right-12 h-1 bg-linear-to-r from-green-400 via-cyan-400 to-blue-400 rounded-full opacity-30"></div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { num: 1, title: "Regístrate", desc: "Crea tu cuenta en segundos con Gmail o email", icon: "🎯", color: "from-green-500 to-cyan-500" },
                    { num: 2, title: "Predice Números", desc: "Publica tus pronósticos de 3, 4 o 5 cifras", icon: "🎲", color: "from-cyan-500 to-blue-500" },
                    { num: 3, title: "Sube en Ranking", desc: "Compite por posición según tus aciertos", icon: "📈", color: "from-blue-500 to-purple-500" },
                    { num: 4, title: "Recibe Dinero", desc: "Gana por aciertos, membresías y seguidores", icon: "💰", color: "from-purple-500 to-pink-500" },
                  ].map((step) => (
                    <div key={step.num} className="relative group">
                      {/* Card Gradient Background */}
                      <div className={`absolute inset-0 bg-linear-to-br ${step.color} rounded-2xl opacity-0 group-hover:opacity-20 dark:group-hover:opacity-30 transition-opacity duration-300 blur-xl`}></div>
                      
                      {/* Card */}
                      <div className="relative bg-white dark:bg-gray-800/60 dark:backdrop-blur border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center hover:shadow-xl dark:hover:shadow-purple-500/20 transition-all duration-300 h-full flex flex-col">
                        
                        {/* Step Number Circle */}
                        <div className={`w-16 h-16 rounded-full bg-linear-to-br ${step.color} flex items-center justify-center text-white font-black text-2xl mx-auto mb-5 shadow-lg`}>
                          {step.num}
                        </div>

                        {/* Icon */}
                        <div className="text-5xl mb-4">{step.icon}</div>

                        {/* Title */}
                        <h3 className="font-black text-lg text-gray-900 dark:text-white mb-3">{step.title}</h3>

                        {/* Description */}
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed flex-1">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Mejorado */}
        <div className="py-20">
          <div className="container mx-auto px-4">
            <div className="relative max-w-4xl mx-auto">
              {/* Background gradient orbs */}
              <div className="absolute inset-0 bg-linear-to-r from-green-400/20 via-cyan-400/20 to-blue-400/20 dark:from-green-900/30 dark:via-cyan-900/30 dark:to-blue-900/30 rounded-3xl blur-3xl -z-10"></div>

              <div className="bg-linear-to-br from-green-50 to-cyan-50 dark:from-gray-800/50 dark:to-gray-900/50 dark:backdrop-blur dark:border dark:border-green-500/30 rounded-3xl p-12 md:p-16 text-center border border-gray-200">
                <h3 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">
                  🚀 ¿Listo para Cambiar tu Vida?
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-10 max-w-2xl mx-auto text-lg leading-relaxed">
                  Miles de usuarios ya están ganando dinero con sus predicciones en Lot-IQ. <span className="font-bold text-green-600 dark:text-green-400">Sin comisiones ocultas</span>, sin promesas falsas. Solo predicciones inteligentes y dinero real.
                </p>
                <Button size="lg" className="bg-linear-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-white font-bold px-12 shadow-lg hover:shadow-xl transition-all text-base" asChild>
                  <Link href="/register">
                    Abre Tu Cuenta Gratis Ahora
                    <span className="ml-2">→</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <FAQSection />

        {/* Contact Section */}
        <ContactSection />
      </div>
    </PageWrapper>
  )
}
