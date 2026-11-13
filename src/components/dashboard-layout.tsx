"use client"

import {
    SidebarInset,
    SidebarProvider,
} from "~/components/ui/sidebar"
import { TooltipProvider } from "~/components/ui/tooltip"
import { AgendamentosNotifier } from "~/components/agendamentos-notifier"
import { AppSidebar } from "~/components/app-sidebar"
import { PainelBottomNav } from "~/components/painel-bottom-nav"

type DashboardLayoutProps = {
    /** Lido do cookie `sidebar_state` no servidor, para não piscar ao carregar. */
    defaultOpen: boolean
    children: React.ReactNode
}

/** No computador, a lateral do design; no celular, a barra de baixo (a lateral vira gaveta). */
export function DashboardLayout({ defaultOpen, children }: DashboardLayoutProps) {
    return (
        <TooltipProvider>
            <AgendamentosNotifier />
            <SidebarProvider
                defaultOpen={defaultOpen}
                style={{ "--sidebar-width-icon": "3.5rem" } as React.CSSProperties}
            >
                <AppSidebar />
                <SidebarInset className="bg-background">
                    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pt-5 pb-24 md:pb-8 lg:px-8 lg:pt-8">
                        {children}
                    </div>
                </SidebarInset>
                <PainelBottomNav />
            </SidebarProvider>
        </TooltipProvider>
    )
}
