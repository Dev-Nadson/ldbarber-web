import { CalendarDays, Crown, Landmark, Scissors, Settings, Users, UserRound } from "lucide-react"

import { ADMIN_ROLES, EQUIPE_ROLES, GESTAO_ROLES, isEquipe, type Role } from "~/lib/constants"

export type SidebarIcon = React.ComponentType<{ className?: string }>

export type SidebarNavItem = {
    label: string
    href: string
    icon: SidebarIcon
    /** Mantém o item ativo também nas sub-rotas (ex.: /painel/clientes/42). */
    matchNested?: boolean
    roles?: readonly Role[]
}

export type SidebarNavGroup = {
    label: string
    items: SidebarNavItem[]
}

/** "Gestão" e "Sistema", como no design. O barbeiro vê só a Agenda. */
export const sidebarNavGroups: SidebarNavGroup[] = [
    {
        label: "Gestão",
        items: [
            { label: "Agenda", href: "/painel/agenda", icon: CalendarDays, roles: EQUIPE_ROLES },
            { label: "Clientes", href: "/painel/clientes", icon: Users, matchNested: true, roles: GESTAO_ROLES },
            { label: "Barbeiros", href: "/painel/barbeiros", icon: UserRound, matchNested: true, roles: GESTAO_ROLES },
            { label: "Serviços", href: "/painel/servicos", icon: Scissors, roles: GESTAO_ROLES },
            { label: "Planos", href: "/painel/planos", icon: Crown, matchNested: true, roles: GESTAO_ROLES },
            { label: "Financeiro", href: "/painel/financeiro", icon: Landmark, roles: GESTAO_ROLES },
        ],
    },
    {
        label: "Sistema",
        items: [{ label: "Ajustes", href: "/painel/ajustes", icon: Settings, roles: ADMIN_ROLES }],
    },
]

function normalizePath(path: string) {
    if (path.length > 1 && path.endsWith("/")) {
        return path.slice(0, -1)
    }

    return path
}

export function isSidebarItemActive(pathname: string, item: Pick<SidebarNavItem, "href" | "matchNested">) {
    const current = normalizePath(pathname)
    const href = normalizePath(item.href)

    if (current === href) {
        return true
    }

    if (!item.matchNested) {
        return false
    }

    return current.startsWith(`${href}/`)
}

export function canAccessSidebarItem(item: SidebarNavItem, role: Role | undefined) {
    if (!item.roles) {
        return true
    }

    return role !== undefined && item.roles.includes(role)
}

export function filterSidebarNavGroups(groups: SidebarNavGroup[], role: Role | undefined) {
    return groups
        .map((group) => ({ ...group, items: group.items.filter((item) => canAccessSidebarItem(item, role)) }))
        .filter((group) => group.items.length > 0)
}

/** A equipe começa pela agenda; o cliente, pelo início do site. */
export function getHomePath(role: Role | undefined) {
    return isEquipe(role) ? "/painel/agenda" : "/"
}
