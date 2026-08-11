import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/store";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  const productUrls = products.map((p) => ({
    url: `${SITE_URL}/producto/${p.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1
    },
    ...productUrls,
    {
      url: `${SITE_URL}/admin`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.1
    }
  ];
}
