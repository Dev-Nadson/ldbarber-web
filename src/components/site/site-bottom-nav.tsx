"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, Clock, Crown, House, UserRound } from "lucide-react"

import { cn } from "~/lib/utils"

const ITENS = [
    { label: "Início", href: "/", icon: House },
    { label: "Agenda", href: "/meus-horarios", icon: CalendarDays },
    { label: "Dias", href: "/disponibilidade", icon: Clock },
    { label: "Planos", href: "/planos", icon: Crown },
    { label: "Perfil", href: "/perfil", icon: UserRound },
]

/** A barra de baixo do site no celular (design: Cliente 02 e 04). */
export function SiteBottomNav() {
    const pathname = usePathname()

    return (
        <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
            {ITENS.map((item) => {
                const ativo = pathname === item.href

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        aria-current={ativo ? "page" : undefined}
                        className={cn(
                            "relative flex flex-1 flex-col items-center gap-1 pt-2.5 pb-2 font-display text-[10px] font-medium tracking-[0.14em] uppercase",
                            ativo ? "text-foreground" : "text-subtle"
                        )}
                    >
                        {ativo && <span className="absolute top-0 h-0.5 w-8 bg-primary shadow-[0_0_8px_rgb(47_84_255/0.9)]" />}
                        <item.icon className="size-5" />
                        {item.label}
                    </Link>
                )
            })}
        </nav>
    )
}
