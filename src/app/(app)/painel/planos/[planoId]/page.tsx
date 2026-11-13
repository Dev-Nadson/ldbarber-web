import type { Metadata } from "next"

import { BackLink } from "~/components/back-link"
import { EditarPlano } from "./editar-plano"

export const metadata: Metadata = {
    title: "Plano",
}

type PlanoPageProps = {
    params: Promise<{ planoId: string }>
}

export default async function PlanoPage({ params }: PlanoPageProps) {
    const { planoId } = await params

    return (
        <>
            <BackLink href="/painel/planos">Planos</BackLink>
            <EditarPlano planoId={planoId} />
        </>
    )
}
