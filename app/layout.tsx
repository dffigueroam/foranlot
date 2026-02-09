import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: {
    default: "Lotiq - Predicciones de Lotería Inteligentes | Gana Dinero Real",
    template: "%s | Lotiq",
  },
  description:
    "Únete a la comunidad de pronósticos de lotería más grande de Colombia. Predice números, sigue expertos, analiza patrones y gana dinero por tus aciertos. Sin comisiones ocultas. 100% transparente.",
  keywords: [
    "lotería Colombia",
    "predicciones lotería",
    "pronósticos chance",
    "números ganadores",
    "comunidad lotería",
    "ganar dinero lotería",
    "análisis números",
    "expertos lotería",
    "Baloto",
    "Chance",
    "ranking lotería",
    "estadísticas lotería",
    "patrones números",
    "lotería online Colombia"
  ],
  authors: [{ name: "Lotiq Team", url: "https://lotiq.com" }],
  creator: "Lotiq",
  publisher: "Lotiq",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://lotiq.com"),
  alternates: {
    canonical: "/",
    languages: {
      "es-CO": "/",
      "es": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "/",
    siteName: "Lotiq",
    title: "Lotiq - Predicciones de Lotería Inteligentes | Gana Dinero Real",
    description:
      "Comunidad de pronósticos de lotería en Colombia. Predice números, sigue expertos y gana dinero por tus aciertos. Sin comisiones ocultas.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lotiq - Predicciones de Lotería Inteligentes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lotiq - Predicciones de Lotería Inteligentes | Gana Dinero Real",
    description:
      "Comunidad de pronósticos de lotería en Colombia. Predice, sigue expertos y gana dinero real.",
    images: ["/twitter-image.png"],
    creator: "@lotiq",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "verification_token_here", // Reemplazar con token real de Google Search Console
  },
  category: "Finance",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "format-detection": "telephone=no",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Lotiq",
    description:
      "Plataforma de predicciones de lotería con comunidad de expertos, análisis de patrones y sistema de ganancias transparente",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://lotiq.com",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "9.99",
      priceCurrency: "USD",
      description: "Membresía Premium Mensual",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "15234",
      bestRating: "5",
      worstRating: "1",
    },
    provider: {
      "@type": "Organization",
      name: "Lotiq",
      url: process.env.NEXT_PUBLIC_APP_URL || "https://lotiq.com",
      logo: `${process.env.NEXT_PUBLIC_APP_URL || "https://lotiq.com"}/logo.png`,
      contactPoint: {
        "@type": "ContactPoint",
        email: "soporte@lotiq.com",
        contactType: "Customer Service",
        availableLanguage: ["Spanish", "es"],
        areaServed: "CO",
      },
      sameAs: [
        "https://www.facebook.com/lotiq",
        "https://twitter.com/lotiq",
        "https://www.instagram.com/lotiq",
      ],
    },
    featureList: [
      "Predicciones de lotería colaborativas",
      "Ranking de pronosticadores",
      "Análisis de patrones numéricos",
      "Sistema de recompensas transparente",
      "Seguimiento de expertos",
    ],
    screenshot: `${process.env.NEXT_PUBLIC_APP_URL || "https://lotiq.com"}/screenshot.png`,
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
