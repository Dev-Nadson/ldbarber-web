import type { Metadata } from "next"
import { cookies } from "next/headers"

import { EQUIPE_ROLES } from "~/lib/constants"
import { RequireRole } from "~/components/require-role"
import { RequireSession } from "~/components/require-session"
import { DashboardLayout } from "~/components/dashboard-layout"

export const metadata: Metadata = {
    robots: { index: false, follow: false },
}

type PainelLayoutProps = {
    children: React.ReactNode
}

/** Barbeiro, gerente e admin. Cliente que cair aqui volta para o site. */
export default async function PainelLayout({ children }: PainelLayoutProps) {
    const cookieStore = await cookies()
    const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false"

    return (
        <RequireSession>
            <RequireRole roles={EQUIPE_ROLES}>
                <DashboardLayout defaultOpen={sidebarOpen}>{children}</DashboardLayout>
            </RequireRole>
        </RequireSession>
    )
}
