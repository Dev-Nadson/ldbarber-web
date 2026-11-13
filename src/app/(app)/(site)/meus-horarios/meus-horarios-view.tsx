"use client"

import Link from "next/link"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { CircleCheck } from "lucide-react"

import { useAgora } from "~/hooks/use-agora"
import { useConfiguracao } from "~/hooks/use-configuracao"
import { useRealtimeAgendamentos } from "~/hooks/use-realtime-agendamentos"
import { useSession } from "~/hooks/use-session"
import { buildWhatsAppUrl } from "~/lib/mensagem"
import { QUERIES } from "~/lib/queries"
import { cn, dateKeyOf, formatCurrency, formatLongDay, formatShortDay, formatTime } from "~/lib/utils"
import { listMeuHistorico, listMeusProximos, type Agendamento } from "~/services/agendamentos"
import { Button } from "~/components/ui/button"
import { ListFooter } from "~/components/ui/list"
import { Skeleton } from "~/components/ui/skeleton"
import { AgendamentoStatusBadge, Selo } from "~/components/badges"
import { PageHeader } from "~/components/page-header"
import { WhatsAppIcon } from "~/components/whatsapp-icon"
import { CancelarHorarioDialog } from "./cancelar-horario-dialog"
import { useMeusHorarios } from "./meus-horarios-store"

function Valor({ agendamento }: { agendamento: Agendamento }) {
    if (agendamento.incluso_plano) return <Selo variant="default">Plano {agendamento.plano_nome}</Selo>

    return <span className="font-display text-lg tabular-nums">{formatCurrency(agendamento.valor)}</span>
}

type MeusHorariosViewProps = {
    novoId: string | null
}

export function MeusHorariosView({ novoId }: MeusHorariosViewProps) {
    const { data: session } = useSession()
    const { data: configuracao } = useConfiguracao()
    const { page, setPage } = useMeusHorarios()
    const agora = useAgora()

    // A equipe pode cancelar ou remarcar: a tela acompanha sem recarregar.
    useRealtimeAgendamentos()

    const { data: proximos, isPending } = useQuery({
        queryKey: [QUERIES.LIST_MEUS_AGENDAMENTOS, { userId: session?.user_id, tipo: "proximos" }],
        queryFn: () => listMeusProximos(),
    })

    const { data: historico } = useQuery({
        queryKey: [QUERIES.LIST_MEUS_AGENDAMENTOS, { userId: session?.user_id, tipo: "historico", page }],
        queryFn: () => listMeuHistorico({ page }),
        placeholderData: keepPreviousData,
    })

    const janelaMs = (configuracao?.cancelamento_min_horas ?? 2) * 3_600_000
    const novo = proximos?.find((agendamento) => agendamento.id === novoId)

    return (
        <>
            <PageHeader
                eyebrow="Agenda"
                title="Meus horários"
                variant="marca"
                action={
                    <Button render={<Link href="/agendar" />} className="w-full sm:w-auto" size="lg">
                        Marcar horário
                    </Button>
                }
            />

            {novo && (
                <div className="flex items-start gap-3 rounded-lg border border-success/40 bg-success-soft px-4 py-3">
                    <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" />
                    <p className="text-sm">
                        Seu horário com {novo.barbeiro_nome} está confirmado: <b>{formatShortDay(dateKeyOf(novo.inicio))}</b>, às{" "}
                        <b>{formatTime(novo.inicio)}</b>.
                    </p>
                </div>
            )}

            <section className="flex flex-col gap-3">
                <h2 className="letreiro text-muted-foreground">Próximos</h2>

                {isPending && <Skeleton className="h-32 w-full" />}

                {proximos && !proximos.length && (
                    <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                        Nenhum horário marcado.
                    </p>
                )}

                {proximos?.map((agendamento) => {
                    const podeCancelar = agora > 0 && Date.parse(agendamento.inicio) - agora >= janelaMs

                    return (
                        <article
                            key={agendamento.id}
                            className={cn(
                                "flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center",
                                agendamento.id === novoId && "border-primary"
                            )}
                        >
                            <div className="flex flex-1 items-center gap-4">
                                <span className="font-display text-4xl font-medium tabular-nums">{formatTime(agendamento.inicio)}</span>
                                <div className="min-w-0">
                                    <p className="font-medium">{formatLongDay(dateKeyOf(agendamento.inicio))}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {agendamento.servico_nome} com {agendamento.barbeiro_nome}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-3 sm:justify-end">
                                <Valor agendamento={agendamento} />
                                {podeCancelar ? (
                                    <CancelarHorarioDialog agendamento={agendamento} />
                                ) : (
                                    configuracao?.whatsapp && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            render={
                                                <a
                                                    href={buildWhatsAppUrl(configuracao.whatsapp)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                />
                                            }
                                        >
                                            <WhatsAppIcon className="size-4" />
                                            Falar com a casa
                                        </Button>
                                    )
                                )}
                            </div>
                        </article>
                    )
                })}

                {configuracao && Boolean(proximos?.length) && (
                    <p className="text-sm text-muted-foreground">
                        Dá para cancelar por aqui até {configuracao.cancelamento_min_horas}h antes. Depois disso, fale com a barbearia.
                    </p>
                )}
            </section>

            <section className="flex flex-col gap-3">
                <h2 className="letreiro text-muted-foreground">Histórico</h2>
                <div className="overflow-hidden rounded-lg border bg-card">
                    {historico && !historico.data.length && (
                        <p className="px-4 py-8 text-center text-sm text-muted-foreground">Seus horários passados aparecem aqui.</p>
                    )}
                    <ul className="divide-y">
                        {historico?.data.map((agendamento) => (
                            <li key={agendamento.id} className="flex items-center gap-4 px-4 py-3">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium">
                                        {formatShortDay(dateKeyOf(agendamento.inicio))}, {formatTime(agendamento.inicio)}
                                    </p>
                                    <p className="truncate text-sm text-muted-foreground">
                                        {agendamento.servico_nome} com {agendamento.barbeiro_nome}
                                    </p>
                                </div>
                                <AgendamentoStatusBadge status={agendamento.status} />
                            </li>
                        ))}
                    </ul>
                    {historico && historico.total_pages > 1 && (
                        <ListFooter total={historico.total} page={historico.page} pages={historico.total_pages} onPageChange={setPage} />
                    )}
                </div>
            </section>
        </>
    )
}
