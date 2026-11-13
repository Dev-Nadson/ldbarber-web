import type { Metadata } from "next"

import { BackLink } from "~/components/back-link"
import { ClienteFicha } from "./cliente-ficha"
import { ClienteHistorico } from "./cliente-historico"
import { ClienteHeader } from "./cliente-header"
import { ClientePlano } from "./cliente-plano"

export const metadata: Metadata = {
    title: "Cliente",
}

type ClientePageProps = {
    params: Promise<{ clienteId: string }>
}

export default async function ClientePage({ params }: ClientePageProps) {
    const { clienteId } = await params

    return (
        <>
            <BackLink href="/painel/clientes">Clientes</BackLink>
            <ClienteHeader clienteId={clienteId} />
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                <ClientePlano clienteId={clienteId} />
                <ClienteFicha clienteId={clienteId} />
            </div>
            <ClienteHistorico clienteId={clienteId} />
        </>
    )
}
