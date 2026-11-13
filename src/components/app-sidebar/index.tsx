"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarSeparator,
} from "~/components/ui/sidebar"
import { SidebarBrand } from "~/components/app-sidebar/sidebar-brand"
import { SidebarFooterActions } from "~/components/app-sidebar/sidebar-footer-actions"
import { SidebarNav } from "~/components/app-sidebar/sidebar-nav"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="py-6">
                <SidebarBrand />
            </SidebarHeader>

            <SidebarContent>
                <SidebarNav />
            </SidebarContent>

            <SidebarSeparator className="mx-3" />

            <SidebarFooter className="pb-4">
                <SidebarFooterActions />
            </SidebarFooter>
        </Sidebar>
    )
}
