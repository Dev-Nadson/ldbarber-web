import type { MetadataRoute } from "next"

/** Início, disponibilidade e planos vão para buscadores; painel, conta e acesso, não. */
export default function robots(): MetadataRoute.Robots {
    const base = process.env.APP_URL?.replace(/\/$/, "")

    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/painel", "/agendar", "/meus-horarios", "/perfil", "/entrar", "/cadastrar", "/recuperar-senha", "/redefinir-senha"],
        },
        sitemap: base ? `${base}/sitemap.xml` : undefined,
    }
}
