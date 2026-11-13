import { SiteAviso } from "~/components/site/site-aviso"
import { SiteBottomNav } from "~/components/site/site-bottom-nav"
import { SiteFooter } from "~/components/site/site-footer"
import { SiteHeader } from "~/components/site/site-header"

type SiteLayoutProps = {
    children: React.ReactNode
}

/** O site do cliente: início, disponibilidade, agendar, planos, meus horários e perfil. */
export default function SiteLayout({ children }: SiteLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col">
            <SiteAviso />
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <SiteBottomNav />
        </div>
    )
}
