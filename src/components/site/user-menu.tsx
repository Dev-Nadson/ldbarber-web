"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarClock, LayoutDashboard, LogOut, UserRound } from "lucide-react"

import { useSession } from "~/hooks/use-session"
import { isEquipe } from "~/lib/constants"
import { QUERIES } from "~/lib/queries"
import { deleteSession } from "~/services/sessions"
import { Button } from "~/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { Iniciais } from "~/components/iniciais"

/** As iniciais com o contorno neon (logado) ou o "Entrar" (sem login). */
export function UserMenu() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const { data: session, isPending } = useSession()

    const { mutate: signOut } = useMutation({
        mutationFn: deleteSession,
        onSettled: () => {
            queryClient.clear()
            queryClient.setQueryData([QUERIES.GET_SESSION], null)
            router.replace("/")
        },
    })

    if (isPending) return <span className="size-8" />

    if (!session) {
        return (
            <Button variant="outline" size="sm" render={<Link href="/entrar" />}>
                Entrar
            </Button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label="Minha conta"
                className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <Iniciais nome={session.nome} destaque className="size-9 shadow-[0_0_12px_-2px_rgb(47_84_255/0.7)]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                    <span className="block truncate text-sm font-semibold text-foreground">{session.nome}</span>
                    <span className="block truncate text-xs font-normal">{session.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/meus-horarios" />}>
                    <CalendarClock />
                    Meus horários
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/perfil" />}>
                    <UserRound />
                    Perfil
                </DropdownMenuItem>
                {isEquipe(session.role) && (
                    <DropdownMenuItem render={<Link href="/painel/agenda" />}>
                        <LayoutDashboard />
                        Painel da casa
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut />
                    Sair
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
