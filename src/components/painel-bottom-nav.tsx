"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, Landmark, Menu, Plus, Users } from "lucide-react"

import { useSession } from "~/hooks/use-session"
import { isGestao } from "~/lib/constants"
import { isSidebarItemActive } from "~/lib/sidebar"
import { cn } from "~/lib/utils"
import { useSidebar } from "~/components/ui/sidebar"

type ItemProps = {
    label: string
    icon: React.ComponentType<{ className?: string }>
    active?: boolean
    href?: string
    onClick?: () => void
}

function Item({ label, icon: Icon, active = false, href, onClick }: ItemProps) {
    const classes = cn(
        "relative flex flex-1 flex-col items-center gap-1 pt-2.5 pb-2 font-display text-[10px] font-medium tracking-[0.14em] uppercase",
        active ? "text-foreground" : "text-subtle"
    )
    const conteudo = (
        <>
            {active && <span className="absolute top-0 h-0.5 w-8 bg-primary shadow-[0_0_8px_rgb(47_84_255/0.9)]" />}
            <Icon className="size-5" />
            {label}
        </>
    )

    if (href) {
        return (
            <Link href={href} className={classes} aria-current={active ? "page" : undefined}>
                {conteudo}
            </Link>
        )
    }

    return (
        <button type="button" className={classes} onClick={onClick}>
            {conteudo}
        </button>
    )
}

/**
 * A barra de baixo do painel no celular (design: Admin 05/06). "Novo" abre o encaixe; "Menu"
 * abre a lateral com o resto (barbeiros, serviços, planos, ajustes, sair). O barbeiro vê só
 * Agenda, Novo e Menu.
 */
export function PainelBottomNav() {
    const pathname = usePathname()
    const { data: session } = useSession()
    const { setOpenMobile } = useSidebar()
    const gestao = isGestao(session?.role)

    return (
        <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
            <Item label="Agenda" icon={CalendarDays} href="/painel/agenda" active={pathname === "/painel/agenda"} />
            {gestao && (
                <Item
                    label="Clientes"
                    icon={Users}
                    href="/painel/clientes"
                    active={isSidebarItemActive(pathname, { href: "/painel/clientes", matchNested: true })}
                />
            )}
            <Item label="Novo" icon={Plus} href="/painel/agenda/novo" active={pathname === "/painel/agenda/novo"} />
            {gestao && <Item label="Caixa" icon={Landmark} href="/painel/financeiro" active={pathname === "/painel/financeiro"} />}
            <Item label="Menu" icon={Menu} onClick={() => setOpenMobile(true)} />
        </nav>
    )
}
