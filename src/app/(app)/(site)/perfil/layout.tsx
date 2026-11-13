import type { Metadata } from "next"

import { RequireSession } from "~/components/require-session"

export const metadata: Metadata = {
    robots: { index: false, follow: false },
}

type SessaoLayoutProps = {
    children: React.ReactNode
}

/** O `proxy.ts` já barra quem chega sem login; isto cobre a sessão que expira com a tela aberta. */
export default function SessaoLayout({ children }: SessaoLayoutProps) {
    return <RequireSession>{children}</RequireSession>
}
