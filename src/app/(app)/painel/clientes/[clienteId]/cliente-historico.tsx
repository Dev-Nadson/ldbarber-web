"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { FormaPagamentoLabels } from "~/lib/constants"
import { QUERIES } from "~/lib/queries"
import { dateKeyOf, formatCurrency, formatShortDay, formatTime } from "~/lib/utils"
import { listAgendamentosCliente } from "~/services/agendamentos"
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
import { AgendamentoStatusBadge } from "~/components/badges"
import { useCliente } from "./cliente-store"

const COLUMNS = 5

export function ClienteHistorico({ clienteId }: { clienteId: string }) {
    const { page, setPage } = useCliente()

    const { data, isPending } = useQuery({
        queryKey: [QUERIES.LIST_AGENDAMENTOS_CLIENTE, { clienteId, page }],
        queryFn: () => listAgendamentosCliente({ clienteId, page }),
        placeholderData: keepPreviousData,
    })

    return (
        <section className="flex flex-col gap-3">
            <h2 className="font-display text-base font-semibold tracking-wide uppercase">Histórico de horários</h2>
            <ListRoot>
                <ListTable>
                    <ListHeader>
                        <ListRow className="hover:bg-transparent">
                            <ListHead className="letreiro">Quando</ListHead>
                            <ListHead className="letreiro">Serviço</ListHead>
                            <ListHead className="letreiro hidden sm:table-cell">Barbeiro</ListHead>
                            <ListHead className="letreiro text-right">Valor</ListHead>
                            <ListHead className="letreiro">Status</ListHead>
                        </ListRow>
                    </ListHeader>
                    <ListBody>
                        {isPending && <ListSkeletonRows cols={COLUMNS} rows={4} />}
                        {!isPending && !data?.data.length && <ListEmpty cols={COLUMNS}>Nenhum horário ainda.</ListEmpty>}
                        {data?.data.map((agendamento) => (
                            <ListRow key={agendamento.id}>
                                <ListCell className="tabular-nums">
                                    {formatShortDay(dateKeyOf(agendamento.inicio))}, {formatTime(agendamento.inicio)}
                                </ListCell>
                                <ListCell>{agendamento.servico_nome}</ListCell>
                                <ListCell className="hidden text-muted-foreground sm:table-cell">{agendamento.barbeiro_nome}</ListCell>
                                <ListCell className="text-right tabular-nums">
                                    {agendamento.incluso_plano ? (
                                        <span className="text-neon-text">Plano {agendamento.plano_nome}</span>
                                    ) : (
                                        formatCurrency(agendamento.valor_recebido ?? agendamento.valor)
                                    )}
                                    {agendamento.forma_pagamento && (
                                        <span className="block text-xs text-muted-foreground">{FormaPagamentoLabels[agendamento.forma_pagamento]}</span>
                                    )}
                                </ListCell>
                                <ListCell>
                                    <AgendamentoStatusBadge status={agendamento.status} />
                                </ListCell>
                            </ListRow>
                        ))}
                    </ListBody>
                </ListTable>
                <ListFooter total={data?.total} page={data?.page} pages={data?.total_pages} onPageChange={setPage} />
            </ListRoot>
        </section>
    )
}
