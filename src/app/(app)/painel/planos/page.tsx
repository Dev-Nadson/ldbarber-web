import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "~/components/ui/button"
import { PageHeader } from "~/components/page-header"
import { PlanosList } from "./planos-list"
import { PlanosSolicitacoes } from "./planos-solicitacoes"

export const metadata: Metadata = {
    title: "Planos",
}

export default function PlanosPage() {
    return (
        <>
            <PageHeader
                eyebrow="Assinatura"
                title="Planos"
                description="O pagamento é na casa. O cliente pede pelo site; o plano vale quando o primeiro pagamento é registrado."
                action={
                    <Button variant="chrome" size="lg" render={<Link href="/painel/planos/novo" />}>
                        <Plus />
                        Novo plano
                    </Button>
                }
            />
            <PlanosSolicitacoes />
            <PlanosList />
        </>
    )
}
