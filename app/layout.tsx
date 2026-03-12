import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lot-iq.com"
const googleVerification = process.env.GOOGLE_SITE_VERIFICATION || process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
const bingVerification = process.env.BING_SITE_VERIFICATION || process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION

export const metadata: Metadata = {
  title: {
    default: "Lot-IQ - Predicciones de Lotería Inteligentes",
    template: "%s | Lot-IQ",
  },
  description:
    "Comunidad de pronósticos de lotería en Colombia. Predice números, sigue expertos y analiza patrones. Información comercial en proceso de consolidación.",
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
  authors: [{ name: "Lot-IQ Team", url: appUrl }],
  creator: "Lot-IQ",
  publisher: "Lot-IQ",
  metadataBase: new URL(appUrl),
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
    title: "Lot-IQ - Predicciones de Lotería Inteligentes",
    description:
      "Comunidad de pronósticos de lotería en Colombia. Predice números, sigue expertos y analiza patrones.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lot-IQ - Predicciones de Lotería Inteligentes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lot-IQ - Predicciones de Lotería Inteligentes",
    description:
      "Comunidad de pronósticos de lotería en Colombia. Predice, sigue expertos y analiza patrones.",
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
    google: googleVerification,
    ...(bingVerification
      ? {
          other: {
            "msvalidate.01": bingVerification,
          },
        }
      : {}),
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
      "Plataforma de predicciones de lotería con comunidad, análisis de patrones y funcionalidades en evolución.",
    url: appUrl,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    provider: {
      "@type": "Organization",
      name: "Lot-IQ",
      url: appUrl,
      logo: `${appUrl}/logo.png`,
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
      "Sistema de beneficios en consolidación",
      "Seguimiento de expertos",
    ],
    screenshot: `${appUrl}/screenshot.png`,
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
