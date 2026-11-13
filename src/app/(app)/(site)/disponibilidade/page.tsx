import type { Metadata } from "next"

import { DisponibilidadeView } from "./disponibilidade-view"

export const metadata: Metadata = {
    title: "Disponibilidade",
    description: "Veja os dias com horário livre na LD Barber e marque o seu.",
}

export default function DisponibilidadePage() {
    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:pb-10 lg:px-8 lg:py-10">
            <DisponibilidadeView />
        </div>
    )
}
