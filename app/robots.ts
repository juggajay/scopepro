import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/create", "/scope/", "/account", "/s/"],
    },
    sitemap: "https://scopepro.com.au/sitemap.xml",
  };
}
