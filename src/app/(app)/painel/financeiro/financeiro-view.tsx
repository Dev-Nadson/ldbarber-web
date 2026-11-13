"use client"

import { useQuery } from "@tanstack/react-query"

import { FormaPagamentoLabels, PAGE_SIZE, PeriodoCaixaLabels, PeriodosCaixa, type FormaPagamento, type PeriodoCaixa } from "~/lib/constants"
import { resumoCaixa } from "~/lib/caixa"
import { QUERIES } from "~/lib/queries"
import { addDays, formatCurrency, formatTimestamp, pluralize, today } from "~/lib/utils"
import { listCaixa } from "~/services/caixa"
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
import { Selo } from "~/components/badges"
import { StatCard } from "~/components/detail-section"
import { Segmentado } from "~/components/segmentado"
import { useFinanceiro } from "./financeiro-store"

function intervalo(periodo: PeriodoCaixa) {
    const hoje = today()

    if (periodo === PeriodosCaixa.SETE_DIAS) return { de: addDays(hoje, -6), ate: hoje }
    if (periodo === PeriodosCaixa.MES) return { de: `${hoje.slice(0, 7)}-01`, ate: hoje }
    if (periodo === PeriodosCaixa.TRINTA_DIAS) return { de: addDays(hoje, -29), ate: hoje }

    return { de: hoje, ate: hoje }
}

const PERIODO_OPTIONS = Object.values(PeriodosCaixa).map((periodo) => ({ value: periodo, label: PeriodoCaixaLabels[periodo] }))

export function FinanceiroView() {
    const { periodo, page, setPeriodo, setPage } = useFinanceiro()
    const { de, ate } = intervalo(periodo)

    const { data: lancamentos, isPending } = useQuery({
        queryKey: [QUERIES.LIST_CAIXA, { de, ate }],
        queryFn: () => listCaixa({ de, ate }),
    })

    const resumo = resumoCaixa(lancamentos ?? [])
    const formas = (Object.entries(resumo.porForma) as [FormaPagamento, number][]).sort((a, b) => b[1] - a[1])
    const totalPaginas = Math.max(1, Math.ceil((lancamentos?.length ?? 0) / PAGE_SIZE))
    const pagina = (lancamentos ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    return (
        <>
            <div className="scrollbar-none -mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
                <Segmentado aria-label="Período" value={periodo} onChange={setPeriodo} options={PERIODO_OPTIONS} />
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="Recebido" value={formatCurrency(resumo.total)} />
                <StatCard label="Atendimentos" value={formatCurrency(resumo.valorAtendimentos)} hint={pluralize(resumo.atendimentos, "atendimento", "atendimentos")} />
                <StatCard label="Planos" value={formatCurrency(resumo.valorMensalidades)} hint={pluralize(resumo.mensalidades, "pagamento", "pagamentos")} />
                <StatCard label="No plano" value={resumo.inclusos} hint="atendimentos sem cobrança" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <ListRoot>
                    <ListTable>
                        <ListHeader>
                            <ListRow className="hover:bg-transparent">
                                <ListHead className="letreiro">Forma de pagamento</ListHead>
                                <ListHead className="letreiro text-right">Valor</ListHead>
                                <ListHead className="letreiro text-right">Parte</ListHead>
                            </ListRow>
                        </ListHeader>
                        <ListBody>
                            {!formas.length && <ListEmpty cols={3}>Nada recebido no período.</ListEmpty>}
                            {formas.map(([forma, valor]) => (
                                <ListRow key={forma}>
                                    <ListCell>{FormaPagamentoLabels[forma]}</ListCell>
                                    <ListCell className="text-right tabular-nums">{formatCurrency(valor)}</ListCell>
                                    <ListCell className="text-right text-muted-foreground tabular-nums">
                                        {resumo.total > 0 ? `${Math.round((valor / resumo.total) * 100)}%` : "—"}
                                    </ListCell>
                                </ListRow>
                            ))}
                        </ListBody>
                    </ListTable>
                </ListRoot>

                <ListRoot>
                    <ListTable>
                        <ListHeader>
                            <ListRow className="hover:bg-transparent">
                                <ListHead className="letreiro">Barbeiro</ListHead>
                                <ListHead className="letreiro text-right">Atendimentos</ListHead>
                                <ListHead className="letreiro text-right">Recebido</ListHead>
                            </ListRow>
                        </ListHeader>
                        <ListBody>
                            {!resumo.porBarbeiro.length && <ListEmpty cols={3}>Nenhum atendimento concluído no período.</ListEmpty>}
                            {resumo.porBarbeiro.map((barbeiro) => (
                                <ListRow key={barbeiro.barbeiroId}>
                                    <ListCell className="font-medium">{barbeiro.nome}</ListCell>
                                    <ListCell className="text-right tabular-nums">
                                        {barbeiro.atendimentos}
                                        {barbeiro.inclusos > 0 && <span className="block text-xs text-muted-foreground">{barbeiro.inclusos} no plano</span>}
                                    </ListCell>
                                    <ListCell className="text-right tabular-nums">{formatCurrency(barbeiro.valor)}</ListCell>
                                </ListRow>
                            ))}
                        </ListBody>
                    </ListTable>
                </ListRoot>
            </div>

            <section className="flex flex-col gap-3">
                <h2 className="font-display text-base font-semibold tracking-wide uppercase">Lançamentos</h2>
                <ListRoot>
                    <ListTable>
                        <ListHeader>
                            <ListRow className="hover:bg-transparent">
                                <ListHead className="letreiro">Quando</ListHead>
                                <ListHead className="letreiro">Cliente</ListHead>
                                <ListHead className="letreiro hidden md:table-cell">Descrição</ListHead>
                                <ListHead className="letreiro hidden sm:table-cell">Forma</ListHead>
                                <ListHead className="letreiro text-right">Valor</ListHead>
                            </ListRow>
                        </ListHeader>
                        <ListBody>
                            {isPending && <ListSkeletonRows cols={5} rows={5} />}
                            {!isPending && !lancamentos?.length && <ListEmpty cols={5}>Nenhum lançamento no período.</ListEmpty>}
                            {pagina.map((lancamento) => (
                                <ListRow key={`${lancamento.tipo}-${lancamento.id}`}>
                                    <ListCell className="text-muted-foreground tabular-nums">{formatTimestamp(lancamento.momento)}</ListCell>
                                    <ListCell>
                                        <span className="block max-w-44 truncate font-medium">{lancamento.cliente_nome}</span>
                                        <span className="block text-xs text-muted-foreground md:hidden">{lancamento.descricao}</span>
                                    </ListCell>
                                    <ListCell className="hidden md:table-cell">
                                        {lancamento.descricao}
                                        {lancamento.barbeiro_nome && <span className="text-muted-foreground"> · {lancamento.barbeiro_nome}</span>}
                                        {lancamento.tipo === "mensalidade" && <Selo variant="default" className="ml-2">Plano</Selo>}
                                    </ListCell>
                                    <ListCell className="hidden text-muted-foreground sm:table-cell">
                                        {lancamento.forma_pagamento ? FormaPagamentoLabels[lancamento.forma_pagamento] : lancamento.incluso_plano ? "No plano" : "—"}
                                    </ListCell>
                                    <ListCell className="text-right font-medium tabular-nums">{formatCurrency(lancamento.valor)}</ListCell>
                                </ListRow>
                            ))}
                        </ListBody>
                    </ListTable>
                    <ListFooter total={lancamentos?.length} page={page} pages={totalPaginas} onPageChange={setPage} />
                </ListRoot>
            </section>
        </>
    )
}
