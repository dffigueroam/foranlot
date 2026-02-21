import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: {
    default: "Lot-IQ - Predicciones de Lotería Inteligentes | Gana Dinero Real",
    template: "%s | Lot-IQ",
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
  authors: [{ name: "Lot-IQ Team", url: "https://lot-iq.com" }],
  creator: "Lot-IQ",
  publisher: "Lot-IQ",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://lot-iq.com"),
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
    siteName: "Lot-IQ",
    title: "Lot-IQ - Predicciones de Lotería Inteligentes | Gana Dinero Real",
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
    creator: "@lot_iq",
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
    name: "Lot-IQ",
    description:
      "Plataforma de predicciones de lotería con comunidad de expertos, análisis de patrones y sistema de ganancias transparente",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://lot-iq.com",
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
      name: "Lot-IQ",
      url: process.env.NEXT_PUBLIC_APP_URL || "https://lot-iq.com",
      logo: `${process.env.NEXT_PUBLIC_APP_URL || "https://lot-iq.com"}/logo.png`,
      contactPoint: {
        "@type": "ContactPoint",
        email: "soporte@lot-iq.com",
        contactType: "Customer Service",
        availableLanguage: ["Spanish", "es"],
        areaServed: "CO",
      },
      sameAs: [
        "https://www.facebook.com/lot-iq",
        "https://twitter.com/lot_iq",
        "https://www.instagram.com/lot_iq",
      ],
    },
    featureList: [
      "Predicciones de lotería colaborativas",
      "Ranking de pronosticadores",
      "Análisis de patrones numéricos",
      "Sistema de recompensas transparente",
      "Seguimiento de expertos",
    ],
    screenshot: `${process.env.NEXT_PUBLIC_APP_URL || "https://lot-iq.com"}/screenshot.png`,
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
