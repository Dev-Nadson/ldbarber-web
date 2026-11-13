import type { Metadata } from "next"

import { PageHeader } from "~/components/page-header"
import { FinanceiroView } from "./financeiro-view"

export const metadata: Metadata = {
    title: "Financeiro",
}

export default function FinanceiroPage() {
    return (
        <>
            <PageHeader
                eyebrow="Caixa"
                title="Financeiro"
                description="O que entrou: atendimentos concluídos (com a forma de pagamento) e mensalidades de plano."
            />
            <FinanceiroView />
        </>
    )
}
