import type { Metadata } from "next"

import { PageHeader } from "~/components/page-header"
import { ServicoDialog } from "./servico-dialog"
import { ServicosList } from "./servicos-list"

export const metadata: Metadata = {
    title: "Serviços",
}

export default function ServicosPage() {
    return (
        <>
            <PageHeader
                eyebrow="Cadastros"
                title="Serviços"
                description="O que o cliente escolhe ao marcar. Mudar o preço não mexe nos horários já marcados."
                action={<ServicoDialog />}
            />
            <ServicosList />
        </>
    )
}
