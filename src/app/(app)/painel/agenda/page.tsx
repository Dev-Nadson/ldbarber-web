import type { Metadata } from "next"

import { AgendaView } from "./agenda-view"

export const metadata: Metadata = {
    title: "Agenda",
}

type AgendaPageProps = {
    searchParams: Promise<{ dia?: string }>
}

/** `?dia=` vem do aviso de horário novo e da volta do encaixe. */
export default async function AgendaPage({ searchParams }: AgendaPageProps) {
    const { dia } = await searchParams

    return <AgendaView diaInicial={dia && /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : null} />
}
