import type { Metadata } from "next"

import { BackLink } from "~/components/back-link"
import { EditarBarbeiro } from "./editar-barbeiro"

export const metadata: Metadata = {
    title: "Barbeiro",
}

type BarbeiroPageProps = {
    params: Promise<{ barbeiroId: string }>
}

export default async function BarbeiroPage({ params }: BarbeiroPageProps) {
    const { barbeiroId } = await params

    return (
        <>
            <BackLink href="/painel/barbeiros">Barbeiros</BackLink>
            <EditarBarbeiro barbeiroId={barbeiroId} />
        </>
    )
}
