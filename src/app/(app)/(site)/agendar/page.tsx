import type { Metadata } from "next"

import { AgendarView } from "./agendar-view"

export const metadata: Metadata = {
    title: "Marcar horário",
}

type AgendarPageProps = {
    searchParams: Promise<{ dia?: string }>
}

/** `?dia=` vem do "Marcar neste dia" da disponibilidade. */
export default async function AgendarPage({ searchParams }: AgendarPageProps) {
    const { dia } = await searchParams

    return <AgendarView diaInicial={dia && /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : null} />
}
