import type { Metadata } from "next"

import { BackLink } from "~/components/back-link"
import { BarbeiroEditor } from "~/components/barbeiro-editor"
import { PageHeader } from "~/components/page-header"

export const metadata: Metadata = {
    title: "Novo barbeiro",
}

export default function NovoBarbeiroPage() {
    return (
        <>
            <BackLink href="/painel/barbeiros">Barbeiros</BackLink>
            <PageHeader eyebrow="Cadastros" title="Novo barbeiro" />
            <BarbeiroEditor />
        </>
    )
}
