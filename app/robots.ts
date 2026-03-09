import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lot-iq.com"

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/api/*",
          "/admin/*",
          "/contracts/*",
          "/dashboard/*",
          "/my-payments/*",
          "/notifications/*",
          "/premium/*",
          "/pricing/*",
          "/profile/*",
          "/ranking/*",
          "/selections/*",
          "/stats/*",
          "/tools/*",
          "/users/*",
          "/verify-email/*",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/"],
        disallow: [
          "/api/*",
          "/admin/*",
          "/contracts/*",
          "/dashboard/*",
          "/my-payments/*",
          "/notifications/*",
          "/premium/*",
          "/pricing/*",
          "/profile/*",
          "/ranking/*",
          "/selections/*",
          "/stats/*",
          "/tools/*",
          "/users/*",
          "/verify-email/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
