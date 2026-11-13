"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, ExternalLink, LoaderCircle, LogOut } from "lucide-react"

import { useSession } from "~/hooks/use-session"
import { RoleLabels } from "~/lib/constants"
import { QUERIES } from "~/lib/queries"
import { deleteSession } from "~/services/sessions"
import { Button } from "~/components/ui/button"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "~/components/ui/sidebar"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "~/components/ui/tooltip"
import { Iniciais } from "~/components/iniciais"

const BUTTON_CLASSES = "text-muted-foreground group-data-[collapsible=icon]:size-10!"

export function SidebarFooterActions() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const { data: session } = useSession()
    const { isMobile, state, toggleSidebar } = useSidebar()

    const isCollapsed = !isMobile && state === "collapsed"
    const collapseLabel = isCollapsed ? "Expandir" : "Recolher"

    const { mutate: signOut, isPending: isSigningOut } = useMutation({
        mutationFn: deleteSession,
        onError: (error: unknown) => {
            console.error("Falha ao encerrar a sessão:", error)
        },
        onSettled: () => {
            queryClient.clear()
            queryClient.setQueryData([QUERIES.GET_SESSION], null)
            router.replace("/")
        },
    })

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip="Ver o site" className={BUTTON_CLASSES} render={<Link href="/" target="_blank" rel="noopener" />}>
                    <ExternalLink />
                    <span>Ver o site</span>
                </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="hidden md:block">
                <SidebarMenuButton tooltip={collapseLabel} onClick={toggleSidebar} className={BUTTON_CLASSES}>
                    {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
                    <span>{collapseLabel}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>

            {session && (
                <SidebarMenuItem className="mt-2 flex items-center gap-3 border-t pt-4 group-data-[collapsible=icon]:hidden">
                    <Iniciais nome={session.nome} />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{session.nome}</p>
                        <p className="truncate text-xs text-muted-foreground">{RoleLabels[session.role]}</p>
                    </div>
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label="Sair"
                                    disabled={isSigningOut}
                                    onClick={() => signOut()}
                                    className="text-muted-foreground"
                                />
                            }
                        >
                            {isSigningOut ? <LoaderCircle className="animate-spin" /> : <LogOut />}
                        </TooltipTrigger>
                        <TooltipContent>Sair</TooltipContent>
                    </Tooltip>
                </SidebarMenuItem>
            )}

            <SidebarMenuItem className="hidden group-data-[collapsible=icon]:block">
                <SidebarMenuButton tooltip="Sair" onClick={() => signOut()} disabled={isSigningOut} className={BUTTON_CLASSES}>
                    <LogOut />
                    <span>Sair</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
