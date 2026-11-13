import type { Metadata } from "next"

import { MeusHorariosView } from "./meus-horarios-view"

export const metadata: Metadata = {
    title: "Meus horários",
}

type MeusHorariosPageProps = {
    searchParams: Promise<{ novo?: string }>
}

/** `?novo=<id>` é a chegada do "Confirmar": destaca o horário que acabou de ser marcado. */
export default async function MeusHorariosPage({ searchParams }: MeusHorariosPageProps) {
    const { novo } = await searchParams

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6 pb-24 md:pb-12 lg:py-10">
            <MeusHorariosView novoId={novo ?? null} />
        </div>
    )
}
