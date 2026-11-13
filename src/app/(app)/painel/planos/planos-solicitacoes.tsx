"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"

import { PeriodicidadeLabels } from "~/lib/constants"
import { buildWhatsAppUrl, whatsAppDoCliente } from "~/lib/mensagem"
import { QUERIES } from "~/lib/queries"
import { formatCurrency, formatTimestamp } from "~/lib/utils"
import { listSolicitacoes } from "~/services/assinaturas"
import { Button } from "~/components/ui/button"
import { Section } from "~/components/detail-section"
import { WhatsAppIcon } from "~/components/whatsapp-icon"

/** Pedidos de plano feitos pelo site, esperando o primeiro pagamento na casa. */
export function PlanosSolicitacoes() {
    const { data: solicitacoes } = useQuery({
        queryKey: [QUERIES.LIST_SOLICITACOES],
        queryFn: () => listSolicitacoes(),
    })

    if (!solicitacoes?.length) return null

    return (
        <Section title={`Aguardando pagamento (${solicitacoes.length})`} description="Registre o primeiro pagamento no cliente para ativar o plano.">
            <ul className="-my-2 divide-y">
                {solicitacoes.map((solicitacao) => (
                    <li key={solicitacao.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                            <p className="font-medium">{solicitacao.cliente?.nome ?? "Cliente"}</p>
                            <p className="text-sm text-muted-foreground">
                                {solicitacao.plano_nome} · {PeriodicidadeLabels[solicitacao.periodicidade]} ·{" "}
                                {formatCurrency(solicitacao.valor_mensal)}/mês · pedido em {formatTimestamp(solicitacao.criado_em)}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {solicitacao.cliente?.telefone && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    render={
                                        <a
                                            href={buildWhatsAppUrl(whatsAppDoCliente(solicitacao.cliente.telefone))}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        />
                                    }
                                >
                                    <WhatsAppIcon className="size-4" />
                                    WhatsApp
                                </Button>
                            )}
                            <Button variant="outline" size="sm" render={<Link href={`/painel/clientes/${solicitacao.cliente_id}`} />}>
                                Abrir cliente
                            </Button>
                        </div>
                    </li>
                ))}
            </ul>
        </Section>
    )
}
