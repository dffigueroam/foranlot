import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lotiq.com"

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/register", "/login", "/pricing", "/ranking"],
        disallow: [
          "/api/*",
          "/dashboard/*",
          "/admin/*",
          "/my-payments/*",
          "/selections/*",
          "/stats/*",
          "/tools/*",
          "/contracts/*",
          "/users/*",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/register", "/login", "/pricing", "/ranking"],
        disallow: ["/api/*", "/dashboard/*", "/admin/*"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
