import type { Metadata } from "next"

import { BackLink } from "~/components/back-link"
import { PageHeader } from "~/components/page-header"
import { EncaixeView } from "./encaixe-view"

export const metadata: Metadata = {
    title: "Encaixe",
}

type EncaixePageProps = {
    searchParams: Promise<{ dia?: string; cliente?: string }>
}

/** `?dia=` vem da agenda; `?cliente=` vem do detalhe do cliente ("Marcar horário"). */
export default async function EncaixePage({ searchParams }: EncaixePageProps) {
    const { dia, cliente } = await searchParams

    return (
        <>
            <BackLink href="/painel/agenda">Agenda</BackLink>
            <PageHeader
                eyebrow="Agenda"
                title="Encaixe"
                description="Marque um horário para um cliente com conta. Na agenda da equipe, vale qualquer hora; só não pode bater com outro horário."
            />
            <EncaixeView
                diaInicial={dia && /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : null}
                clienteInicial={cliente ?? null}
            />
        </>
    )
}
