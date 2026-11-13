import type { MetadataRoute } from "next"

/** Só as páginas públicas, que não dependem do banco. */
export default function sitemap(): MetadataRoute.Sitemap {
    const base = process.env.APP_URL?.replace(/\/$/, "")

    if (!base) return []

    return [
        { url: base, changeFrequency: "weekly", priority: 1 },
        { url: `${base}/planos`, changeFrequency: "monthly", priority: 0.8 },
        { url: `${base}/disponibilidade`, changeFrequency: "daily", priority: 0.7 },
    ]
}
