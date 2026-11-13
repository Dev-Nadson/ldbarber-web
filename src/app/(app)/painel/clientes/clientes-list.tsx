"use client"

import Link from "next/link"
import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { buildWhatsAppUrl, whatsAppDoCliente } from "~/lib/mensagem"
import { QUERIES } from "~/lib/queries"
import { formatDaysAgo, formatPhone } from "~/lib/utils"
import { listClientes } from "~/services/clientes"
import { Button } from "~/components/ui/button"
import {
    ListBody,
    ListCell,
    ListEmpty,
    ListFooter,
    ListHead,
    ListHeader,
    ListRoot,
    ListRow,
    ListSkeletonRows,
    ListTable,
} from "~/components/ui/list"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "~/components/ui/tooltip"
import { PlanoBadge, SituacaoBadge } from "~/components/badges"
import { Iniciais } from "~/components/iniciais"
import { WhatsAppIcon } from "~/components/whatsapp-icon"
import { useClientes } from "./clientes-store"

const COLUMNS = 6

/** A base de clientes (design: Admin 06). No celular, as colunas viram linhas compactas. */
export function ClientesList() {
    const { page, search, filtro, setPage } = useClientes()

    const { data: clientes, isPending } = useQuery({
        queryKey: [QUERIES.LIST_CLIENTES, { page, search, filtro }],
        queryFn: () => listClientes({ page, search, filtro }),
        placeholderData: keepPreviousData,
    })

    const hasResults = Boolean(clientes?.data.length)

    return (
        <ListRoot>
            <ListTable>
                <ListHeader>
                    <ListRow className="hover:bg-transparent">
                        <ListHead className="letreiro">Cliente</ListHead>
                        <ListHead className="letreiro hidden md:table-cell">Telefone</ListHead>
                        <ListHead className="letreiro">Plano</ListHead>
                        <ListHead className="letreiro hidden md:table-cell">Última visita</ListHead>
                        <ListHead className="letreiro hidden sm:table-cell">Pagamento</ListHead>
                        <ListHead className="w-0" />
                    </ListRow>
                </ListHeader>
                <ListBody>
                    {isPending && <ListSkeletonRows cols={COLUMNS} />}

                    {!isPending && !hasResults && (
                        <ListEmpty cols={COLUMNS}>
                            {search || filtro !== "todos" ? "Nenhum cliente com esses filtros." : "Nenhum cliente ainda. Eles aparecem quando criam a conta no site."}
                        </ListEmpty>
                    )}

                    {!isPending &&
                        clientes?.data.map((cliente) => (
                            <ListRow key={cliente.id}>
                                <ListCell>
                                    <Link href={`/painel/clientes/${cliente.id}`} className="flex items-center gap-3 hover:underline">
                                        <Iniciais nome={cliente.nome} />
                                        <span className="min-w-0">
                                            <span className="block max-w-56 truncate font-medium">
                                                {cliente.nome}
                                                {cliente.apelido && <span className="font-normal text-muted-foreground"> ({cliente.apelido})</span>}
                                            </span>
                                            <span className="block text-xs text-muted-foreground tabular-nums md:hidden">
                                                {formatPhone(cliente.telefone)} · {formatDaysAgo(cliente.ultima_visita)}
                                            </span>
                                        </span>
                                    </Link>
                                </ListCell>
                                <ListCell className="hidden text-muted-foreground tabular-nums md:table-cell">{formatPhone(cliente.telefone)}</ListCell>
                                <ListCell>
                                    <PlanoBadge planoNome={cliente.plano_nome} status={cliente.assinatura_status} />
                                </ListCell>
                                <ListCell className="hidden text-muted-foreground md:table-cell">{formatDaysAgo(cliente.ultima_visita)}</ListCell>
                                <ListCell className="hidden sm:table-cell">
                                    <SituacaoBadge situacao={cliente.assinatura_status === "ativa" ? cliente.situacao : null} />
                                </ListCell>
                                <ListCell>
                                    <div className="flex items-center justify-end gap-1">
                                        {cliente.telefone && (
                                            <Tooltip>
                                                <TooltipTrigger
                                                    render={
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            aria-label={`Conversar com ${cliente.nome} no WhatsApp`}
                                                            render={
                                                                <a
                                                                    href={buildWhatsAppUrl(whatsAppDoCliente(cliente.telefone))}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                />
                                                            }
                                                        >
                                                            <WhatsAppIcon className="size-4" />
                                                        </Button>
                                                    }
                                                />
                                                <TooltipContent>Conversar no WhatsApp</TooltipContent>
                                            </Tooltip>
                                        )}
                                        <Button variant="outline" size="sm" className="hidden sm:inline-flex" render={<Link href={`/painel/clientes/${cliente.id}`} />}>
                                            Abrir
                                        </Button>
                                    </div>
                                </ListCell>
                            </ListRow>
                        ))}
                </ListBody>
            </ListTable>

            <ListFooter total={clientes?.total} page={clientes?.page} pages={clientes?.total_pages} onPageChange={setPage} />
        </ListRoot>
    )
}
