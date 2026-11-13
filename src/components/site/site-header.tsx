"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "~/lib/utils"
import { BrandMark } from "~/components/brand-mark"
import { UserMenu } from "~/components/site/user-menu"

const NAV = [
    { label: "Agendar", href: "/agendar" },
    { label: "Disponibilidade", href: "/disponibilidade" },
    { label: "Planos", href: "/planos" },
    { label: "Meus horários", href: "/meus-horarios" },
]

/** O topo do site (design: Cliente 02–04). No celular, só a marca e a conta; o menu vai embaixo. */
export function SiteHeader() {
    const pathname = usePathname()

    return (
        <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-md">
            <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-8 px-4 lg:px-8">
                <Link href="/" aria-label="Início" className="shrink-0">
                    <BrandMark size="sm" />
                </Link>

                <nav className="hidden h-full items-stretch gap-6 md:flex">
                    {NAV.map((item) => {
                        const ativo = pathname === item.href

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={ativo ? "page" : undefined}
                                className={cn(
                                    "relative flex items-center font-display text-[13px] font-medium tracking-[0.14em] uppercase transition-colors",
                                    ativo ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {item.label}
                                {ativo && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary shadow-[0_0_8px_rgb(47_84_255/0.9)]" />}
                            </Link>
                        )
                    })}
                </nav>

                <div className="ml-auto">
                    <UserMenu />
                </div>
            </div>
        </header>
    )
}
