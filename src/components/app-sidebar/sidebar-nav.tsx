"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { useSession } from "~/hooks/use-session"
import { filterSidebarNavGroups, isSidebarItemActive, sidebarNavGroups } from "~/lib/sidebar"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "~/components/ui/sidebar"
import { useCloseMobileSidebar } from "~/components/app-sidebar/use-close-mobile-sidebar"

/** Item ativo como no design: fundo azul-noite e a borda neon à esquerda. */
const ITEM_CLASSES =
    "h-10 gap-3 rounded-md border-l-2 border-transparent font-display text-[13px] font-medium tracking-[0.14em] uppercase text-muted-foreground [&_svg]:size-4 group-data-[collapsible=icon]:size-10! data-active:border-primary data-active:bg-primary/12 data-active:text-foreground data-active:hover:bg-primary/18"

export function SidebarNav() {
    const pathname = usePathname()
    const closeMobileSidebar = useCloseMobileSidebar()
    const { data: session } = useSession()

    const groups = filterSidebarNavGroups(sidebarNavGroups, session?.role)

    return (
        <>
            {groups.map((group) => (
                <SidebarGroup key={group.label}>
                    <SidebarGroupLabel className="letreiro text-subtle">{group.label}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1">
                            {group.items.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        isActive={isSidebarItemActive(pathname, item)}
                                        tooltip={item.label}
                                        onClick={closeMobileSidebar}
                                        className={ITEM_CLASSES}
                                        render={<Link href={item.href} />}
                                    >
                                        <item.icon />
                                        <span>{item.label}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            ))}
        </>
    )
}
