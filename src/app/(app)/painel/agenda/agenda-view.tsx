"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, Lock, Plus } from "lucide-react"

import { useAgora } from "~/hooks/use-agora"
import { useConfiguracao } from "~/hooks/use-configuracao"
import { useSession } from "~/hooks/use-session"
import { AgendamentoStatuses, isGestao } from "~/lib/constants"
import { disponibilidadeDoDia, type Ocupacao } from "~/lib/agenda"
import { QUERIES } from "~/lib/queries"
import { addDays, dateKeyOf, formatCurrency, formatLongDay, formatShortDay, toInstant, weekday } from "~/lib/utils"
import { listAgenda, type Agendamento } from "~/services/agendamentos"
import { listBarbeiros, listExpedientes } from "~/services/barbeiros"
import { listBloqueios } from "~/services/bloqueios"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import { StatCard } from "~/components/detail-section"
import { PageHeader } from "~/components/page-header"
import { Segmentado } from "~/components/segmentado"
import { AgendaDetalhe } from "./agenda-detalhe"
import { AgendaDia } from "./agenda-dia"
import { AgendaLista } from "./agenda-lista"
import { AgendaSemana } from "./agenda-semana"
import { BloquearDialog } from "./bloquear-dialog"
import { VisoesAgenda, useAgenda } from "./agenda-store"

type AgendaViewProps = {
    diaInicial: string | null
}

/**
 * A agenda da casa (design: Admin 05). A gestão vê todos os barbeiros; o barbeiro, a própria
 * coluna (o RLS já só devolve os horários dele). O Realtime do painel (`AgendamentosNotifier`)
 * mantém tudo em dia.
 */
export function AgendaView({ diaInicial }: AgendaViewProps) {
    const { data: session } = useSession()
    const { data: configuracao } = useConfiguracao()
    const { dia, visao, setDia, shift, irParaHoje, setVisao } = useAgenda()
    const agora = useAgora()
    const [selecionadoId, setSelecionadoId] = useState<string | null>(null)
    const gestao = isGestao(session?.role)

    useEffect(() => {
        if (diaInicial) setDia(diaInicial)
    }, [diaInicial, setDia])

    const inicioSemana = addDays(dia, -weekday(dia))
    const de = visao === VisoesAgenda.SEMANA ? inicioSemana : dia
    const ate = visao === VisoesAgenda.SEMANA ? addDays(inicioSemana, 6) : dia
    const periodo = { de: toInstant(de, "00:00"), ate: toInstant(addDays(ate, 1), "00:00") }

    const { data: todos } = useQuery({
        queryKey: [QUERIES.LIST_BARBEIROS, { incluirInativos: false }],
        queryFn: () => listBarbeiros(),
    })
    const { data: expedientes } = useQuery({
        queryKey: [QUERIES.LIST_EXPEDIENTES],
        queryFn: () => listExpedientes(),
    })
    const { data: agendamentos, isPending } = useQuery({
        queryKey: [QUERIES.LIST_AGENDA, periodo],
        queryFn: () => listAgenda(periodo),
    })
    const { data: bloqueios } = useQuery({
        queryKey: [QUERIES.LIST_BLOQUEIOS, periodo],
        queryFn: () => listBloqueios(periodo),
    })

    // O barbeiro vê só a própria coluna, mesmo que a lista pública traga todos.
    const barbeiros = useMemo(
        () => (gestao ? (todos ?? []) : (todos ?? []).filter((barbeiro) => barbeiro.id === session?.barbeiro_id)),
        [gestao, session?.barbeiro_id, todos]
    )

    const doDia = useMemo(
        () => (agendamentos ?? []).filter((agendamento) => dateKeyOf(agendamento.inicio) === dia),
        [agendamentos, dia]
    )

    const kpis = useMemo(() => {
        const ativos = doDia.filter((agendamento) => agendamento.status !== AgendamentoStatuses.FALTA)
        const ocupacoes: Ocupacao[] = [...(agendamentos ?? []), ...(bloqueios ?? [])]
        const intervalo = configuracao?.intervalo_min ?? 30
        const livres =
            agora && expedientes
                ? disponibilidadeDoDia({
                      dia,
                      barbeiroIds: barbeiros.map((barbeiro) => barbeiro.id),
                      expedientes,
                      ocupacoes,
                      duracaoMin: intervalo,
                      intervaloMin: intervalo,
                      agora,
                  }).reduce((total, item) => total + item.livres, 0)
                : null

        return {
            atendimentos: ativos.length,
            assinantes: ativos.filter((agendamento) => agendamento.incluso_plano).length,
            livres,
            previsto: ativos.reduce((total, agendamento) => total + (agendamento.valor_recebido ?? agendamento.valor), 0),
        }
    }, [agendamentos, agora, barbeiros, bloqueios, configuracao?.intervalo_min, dia, doDia, expedientes])

    const selecionado: Agendamento | null = agendamentos?.find((agendamento) => agendamento.id === selecionadoId) ?? null
    const titulo =
        visao === VisoesAgenda.SEMANA ? `${formatShortDay(de)} a ${formatShortDay(ate)}` : formatLongDay(dia)

    return (
        <>
            <PageHeader
                eyebrow="Agenda"
                title={titulo}
                action={
                    <div className="flex flex-wrap items-center gap-2">
                        <Segmentado
                            aria-label="Visão"
                            size="sm"
                            value={visao}
                            onChange={setVisao}
                            options={[
                                { value: VisoesAgenda.DIA, label: "Dia" },
                                { value: VisoesAgenda.SEMANA, label: "Semana" },
                            ]}
                            className="hidden md:inline-flex"
                        />
                        <Button variant="outline" size="icon" aria-label="Anterior" onClick={() => shift(-1)}>
                            <ChevronLeft />
                        </Button>
                        <Button variant="outline" size="default" onClick={irParaHoje}>
                            Hoje
                        </Button>
                        <Button variant="outline" size="icon" aria-label="Próximo" onClick={() => shift(1)}>
                            <ChevronRight />
                        </Button>
                        <BloquearDialog
                            dia={dia}
                            barbeiros={barbeiros}
                            trigger={
                                <Button variant="outline">
                                    <Lock />
                                    Bloquear
                                </Button>
                            }
                        />
                        <Button variant="chrome" className="hidden md:inline-flex" render={<Link href={`/painel/agenda/novo?dia=${dia}`} />}>
                            <Plus />
                            Encaixe
                        </Button>
                    </div>
                }
            />

            {visao === VisoesAgenda.DIA && (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatCard label="Atendimentos" value={kpis.atendimentos} />
                    <StatCard label="Assinantes" value={kpis.assinantes} />
                    <StatCard label="Livres" value={kpis.livres ?? "—"} hint={`horários de ${configuracao?.intervalo_min ?? 30} min`} />
                    <StatCard label="Previsto" value={formatCurrency(kpis.previsto)} />
                </div>
            )}

            {isPending || !expedientes ? (
                <Skeleton className="h-[480px] w-full" />
            ) : !barbeiros.length ? (
                <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                    {gestao
                        ? "Nenhum barbeiro ativo. Cadastre em Barbeiros."
                        : "Sua conta ainda não está ligada a uma agenda. Peça para a gerência ligar em Barbeiros."}
                </p>
            ) : visao === VisoesAgenda.SEMANA ? (
                <AgendaSemana
                    inicioSemana={inicioSemana}
                    barbeiros={barbeiros}
                    agendamentos={agendamentos ?? []}
                    onSelect={setSelecionadoId}
                    onDia={(d) => {
                        setDia(d)
                        setVisao(VisoesAgenda.DIA)
                    }}
                />
            ) : (
                <>
                    <div className="hidden md:block">
                        <AgendaDia
                            dia={dia}
                            barbeiros={barbeiros}
                            expedientes={expedientes}
                            agendamentos={doDia}
                            bloqueios={bloqueios ?? []}
                            agora={agora}
                            onSelect={setSelecionadoId}
                        />
                    </div>
                    <div className="md:hidden">
                        <AgendaLista dia={dia} barbeiros={barbeiros} agendamentos={doDia} bloqueios={bloqueios ?? []} onSelect={setSelecionadoId} />
                    </div>
                </>
            )}

            <AgendaDetalhe agendamento={selecionado} barbeiros={todos ?? []} onClose={() => setSelecionadoId(null)} />
        </>
    )
}
