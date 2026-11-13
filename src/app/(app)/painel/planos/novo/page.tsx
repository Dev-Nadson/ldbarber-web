import type { Metadata } from "next"

import { BackLink } from "~/components/back-link"
import { PageHeader } from "~/components/page-header"
import { PlanoEditor } from "~/components/plano-editor"

export const metadata: Metadata = {
    title: "Novo plano",
}

export default function NovoPlanoPage() {
    return (
        <>
            <BackLink href="/painel/planos">Planos</BackLink>
            <PageHeader eyebrow="Cadastros" title="Novo plano" />
            <PlanoEditor />
        </>
    )
}
