import { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lot-iq.com"
  const currentDate = new Date()

  const publicRoutes: Array<{
    path: string
    changeFrequency: "daily" | "weekly" | "monthly"
    priority: number
  }> = [
    { path: "/", changeFrequency: "daily", priority: 1 },
    { path: "/results", changeFrequency: "daily", priority: 0.9 },
    { path: "/info/guia-usos", changeFrequency: "monthly", priority: 0.6 },
    { path: "/info/consideraciones-usos", changeFrequency: "monthly", priority: 0.6 },
    { path: "/info/vinculacion-cuentas", changeFrequency: "monthly", priority: 0.6 },
  ]

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: currentDate,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
