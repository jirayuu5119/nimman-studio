import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/booking", "/booking/info", "/privacy"],
      disallow: [
        "/admin",
        "/api",
        "/login",
        "/booking/status",
        "/booking/summary",
        "/booking/payment",
        "/booking/upload-slip",
        "/booking/success",
      ],
    },
    sitemap: `${getPublicSiteUrl()}/sitemap.xml`,
  };
}
