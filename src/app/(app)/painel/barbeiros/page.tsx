import type { Metadata } from "next"
import Link from "next/link"
import { UserPlus } from "lucide-react"

import { Button } from "~/components/ui/button"
import { PageHeader } from "~/components/page-header"
import { BarbeirosList } from "./barbeiros-list"

export const metadata: Metadata = {
    title: "Barbeiros",
}

export default function BarbeirosPage() {
    return (
        <>
            <PageHeader
                eyebrow="Cadastros"
                title="Barbeiros"
                description="Cada barbeiro é uma agenda, com o expediente da semana. Desativado, sai do site e da agenda."
                action={
                    <Button variant="chrome" size="lg" render={<Link href="/painel/barbeiros/novo" />}>
                        <UserPlus />
                        Novo barbeiro
                    </Button>
                }
            />
            <BarbeirosList />
        </>
    )
}
