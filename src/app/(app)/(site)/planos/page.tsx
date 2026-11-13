import type { Metadata } from "next"

import { PlanosView } from "./planos-view"

export const metadata: Metadata = {
    title: "Planos",
    description: "Assinatura mensal da LD Barber: corte sempre em dia, sem pensar no valor. Cancele quando quiser.",
}

export default function PlanosPage() {
    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:pb-12 lg:px-8 lg:py-10">
            <PlanosView />
        </div>
    )
}
