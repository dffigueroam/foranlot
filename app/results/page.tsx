import type { Metadata } from "next"
import Link from "next/link"
import { getLastDayResultsByCountry } from "@/lib/verification"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { getCurrentUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lot-iq.com"

export const metadata: Metadata = {
  title: "Resultados de Loterias de Hoy | Colombia, Espana y USA",
  description:
    "Consulta resultados recientes de loterias por pais, numero ganador y fecha de sorteo. Informacion publica para seguimiento y analisis.",
  alternates: {
    canonical: "/results",
    languages: {
      "es-CO": "/results",
      "es": "/results",
    },
  },
  openGraph: {
    title: "Resultados de Loterias de Hoy | ForanLot",
    description:
      "Verifica resultados recientes de loterias en Colombia, Espana y USA con fecha y numero ganador.",
    url: "/results",
    siteName: "ForanLot",
    locale: "es_CO",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ForanLot - Resultados de Loterias",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Resultados de Loterias de Hoy | ForanLot",
    description:
      "Consulta los ultimos resultados de loterias por pais y fecha de sorteo.",
    images: ["/twitter-image.png"],
  },
}

export default async function ResultsPage() {
  const user = await getCurrentUser()
  const resultsByCountry = await getLastDayResultsByCountry()

  // Color de fondo para cada país (colores de banderas)
  const getCountryBgColor = (country: string): string => {
    const colorMap: Record<string, string> = {
      "Colombia": "bg-linear-to-b from-yellow-100 to-blue-50 dark:from-yellow-900/20 dark:to-blue-900/20",
      "España": "bg-linear-to-b from-red-100 via-yellow-100 to-red-100 dark:from-red-900/20 dark:via-yellow-900/20 dark:to-red-900/20",
      "USA": "bg-linear-to-b from-blue-100 to-red-50 dark:from-blue-900/20 dark:to-red-900/20",
    }
    return colorMap[country] || "bg-slate-50 dark:bg-slate-900"
  }

  // La fecha corta y si es reciente ya vienen del backend
  const getShortDate = (date: string) => date
  const isRecentResult = (result: any) => result.isRecent

  const lastDay = resultsByCountry.length > 0 && resultsByCountry[0]?.lotteries.length > 0 
    ? resultsByCountry[0].lotteries[0]?.draw_date 
    : null

  const totalResults = resultsByCountry.reduce((sum, group) => sum + group.lotteries.length, 0)

  const recentItems = resultsByCountry
    .flatMap((group) =>
      group.lotteries.slice(0, 5).map((item: any) => ({
        "@type": "ListItem",
        position: 1,
        name: `${item.lottery_name} ${item.winning_number}`,
        url: `${appUrl}/results`,
      }))
    )
    .slice(0, 12)
    .map((entry, index) => ({ ...entry, position: index + 1 }))

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Resultados recientes de loterias",
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: recentItems.length,
    itemListElement: recentItems,
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: appUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Resultados",
        item: `${appUrl}/results`,
      },
    ],
  }

  const countryColumns = ["Colombia", "España", "USA"]
  const resultsByCountryMap = new Map(resultsByCountry.map(group => [group.country, group]))

  return (
    <PageWrapper user={user ? { username: user.username, role: user.role, is_premium: user.is_premium } : null}>
      <div className="min-h-screen bg-background">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 space-y-4">
            <Button variant="ghost" asChild className="mb-4 group">
              <Link href="/" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                Volver al inicio
              </Link>
            </Button>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Resultados Recientes
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Consulta los ultimos resultados de loterias por pais.
              </p>
            </div>
          </div>
          {/* Tabla de resultados por país */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {countryColumns.map((country) => {
              const countryGroup = resultsByCountryMap.get(country)
              const lotteries = countryGroup?.lotteries || []
              const flag = countryGroup?.flag || "🎰"
              return (
                <div key={country} className={`p-6 rounded-lg border ${getCountryBgColor(country)} border-gray-300 dark:border-gray-700`}>
                  {/* Header del país */}
                  <div className="flex items-center gap-3 pb-4 border-b-2 border-border/50 mb-4">
                    <span className="text-3xl">{flag}</span>
                    <h2 className="text-xl font-bold text-foreground">
                      {country}
                    </h2>
                    <span className="ml-auto text-xs text-muted-foreground font-semibold">
                      {lotteries.length} {lotteries.length === 1 ? "resultado" : "resultados"}
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">
                            <span className="mr-2">{flag}</span>Loteria
                          </th>
                          <th className="px-3 py-2 text-center font-semibold">Numero</th>
                          <th className="px-3 py-2 text-right font-semibold">Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lotteries.map((result, idx) => {
                          const isRecent = isRecentResult(result)
                          return (
                            <tr key={idx} className={`border-t border-slate-200 dark:border-slate-700 ${
                              isRecent 
                                ? "" 
                                : "opacity-70 text-amber-600 dark:text-amber-400"
                            }`}>
                              <td className="px-3 py-2">
                                {result.lottery_name}
                              </td>
                              <td className="px-3 py-2 text-center font-mono font-semibold text-cyan-600 dark:text-cyan-300">
                                {result.winning_number.padStart(result.winning_number.length, "0")}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {result.draw_date_formatted
                                  ? result.draw_date_formatted
                                  : result.draw_date && (() => {
                                      const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
                                      let y, m, d;
                                      if (typeof result.draw_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(result.draw_date)) {
                                        [y, m, d] = result.draw_date.split("-");
                                      } else if (result.draw_date instanceof Date) {
                                        const iso = result.draw_date.toISOString().split("T")[0];
                                        [y, m, d] = iso.split("-");
                                      } else {
                                        return result.draw_date;
                                      }
                                      const monthIdx = parseInt(m, 10) - 1;
                                      return `${months[monthIdx]}-${d}-${y}`;
                                    })()}
                                {result.draw_time_formatted
                                  ? (
                                      <span className="block text-xs text-muted-foreground">{result.draw_time_formatted}h</span>
                                    )
                                  : result.draw_time
                                    ? (
                                        <span className="block text-xs text-muted-foreground">{result.draw_time}h</span>
                                      )
                                    : null}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Total */}
          {totalResults > 0 && (
            <div className="mt-8 p-4 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground">
                Total de resultados cargados: <span className="font-bold text-foreground">{totalResults}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
