import type { Metadata, Viewport } from "next"

import "~/index.css"

import { APP_DESCRIPTION, APP_NAME } from "~/lib/constants"

/**
 * A marca é fixa (só LD Barber), então a metadata é estática: título, descrição e a prévia
 * do link (`opengraph-image.tsx`) saem no HTML sem ler o banco.
 */
export const metadata: Metadata = {
    metadataBase: process.env.APP_URL ? new URL(process.env.APP_URL) : undefined,
    title: {
        default: `${APP_NAME} · Studio`,
        template: `%s · ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
    openGraph: {
        type: "website",
        locale: "pt_BR",
        siteName: APP_NAME,
        title: `${APP_NAME} · Studio`,
        description: APP_DESCRIPTION,
    },
}

export const viewport: Viewport = {
    themeColor: "#0a0a0b",
    colorScheme: "dark",
}

type RootLayoutProps = {
    children: React.ReactNode
}

/** Só tema escuro: o `dark` no `<html>` liga as variantes `dark:` dos primitivos do shadcn. */
export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="pt-BR" className="dark">
            <body>{children}</body>
        </html>
    )
}
