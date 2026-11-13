import type { Metadata } from "next"

import { PageHeader } from "~/components/page-header"
import { AjustesTabs } from "./ajustes-tabs"

export const metadata: Metadata = {
    title: "Ajustes",
}

export default function AjustesPage() {
    return (
        <>
            <PageHeader eyebrow="Sistema" title="Ajustes" description="Dados da casa, regras da agenda e quem trabalha no painel." />
            <AjustesTabs />
        </>
    )
}
