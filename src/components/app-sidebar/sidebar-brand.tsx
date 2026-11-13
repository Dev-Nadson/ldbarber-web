"use client"

import Link from "next/link"

import { BrandMark } from "~/components/brand-mark"
import { useCloseMobileSidebar } from "~/components/app-sidebar/use-close-mobile-sidebar"

export function SidebarBrand() {
    const closeMobileSidebar = useCloseMobileSidebar()

    return (
        <Link
            href="/painel/agenda"
            onClick={closeMobileSidebar}
            className="flex justify-center rounded-md outline-none focus-visible:ring-3 focus-visible:ring-sidebar-ring/30"
        >
            <BrandMark size="sm" className="group-data-[collapsible=icon]:hidden" />
            <span className="hidden font-marca text-xl text-chrome group-data-[collapsible=icon]:block">LD</span>
        </Link>
    )
}
