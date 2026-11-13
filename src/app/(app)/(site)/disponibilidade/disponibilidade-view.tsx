"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { useAgendaPublica } from "~/hooks/use-agenda-publica"
import { useAgora } from "~/hooks/use-agora"
import { DIAS_SEMANA_CURTOS, StatusDiaLabels, StatusDias } from "~/lib/constants"
import { diasDoCalendario, disponibilidadeDoDia, funcionamentoDoDia, resumoDoDia } from "~/lib/agenda"
import { addDays, cn, formatDayMonth, minutesToTime, monthName, today, weekdayName } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import { STATUS_DIA_DOT, StatusDiaBadge } from "~/components/badges"
import { Iniciais } from "~/components/iniciais"
import { useDisponibilidade } from "./disponibilidade-store"

export function DisponibilidadeView() {
    const { mes, dia: diaEscolhido, escolhido, shiftMonth, setDia } = useDisponibilidade()
    const agora = useAgora()
    const hoje = today()
    const dias = useMemo(() => diasDoCalendario(mes), [mes])
    const { configuracao, barbeiros, expedientes, ocupacoes, isPending } = useAgendaPublica(dias[0], dias.at(-1)!)

    const limite = addDays(hoje, configuracao?.antecedencia_assinante_dias ?? 30)
    const limiteAvulso = addDays(hoje, configuracao?.antecedencia_avulso_dias ?? 15)
    const intervalo = configuracao?.intervalo_min ?? 30
    const barbeiroIds = barbeiros.map((barbeiro) => barbeiro.id)

    const porDia = useMemo(() => {
        if (isPending || !agora) return new Map<string, ReturnType<typeof resumoDoDia>>()

        return new Map(
            dias.map((d) => [
                d,
                resumoDoDia(
                    disponibilidadeDoDia({ dia: d, barbeiroIds, expedientes, ocupacoes, duracaoMin: intervalo, intervaloMin: intervalo, agora })
                ),
            ])
        )
    }, [agora, barbeiroIds, dias, expedientes, intervalo, isPending, ocupacoes])

    // Sem escolha do cliente, o dia do store sem vaga (hoje à noite) dá lugar ao primeiro com vaga.
    const dia =
        escolhido || (porDia.get(diaEscolhido)?.livres ?? 0) > 0
            ? diaEscolhido
            : (dias.find((d) => d >= hoje && d <= limite && (porDia.get(d)?.livres ?? 0) > 0) ?? diaEscolhido)

    const doDia = useMemo(
        () =>
            isPending || !agora
                ? []
                : disponibilidadeDoDia({ dia, barbeiroIds, expedientes, ocupacoes, duracaoMin: intervalo, intervaloMin: intervalo, agora }),
        [agora, barbeiroIds, dia, expedientes, intervalo, isPending, ocupacoes]
    )
    const resumo = resumoDoDia(doDia)
    const funcionamento = funcionamentoDoDia(expedientes, dia)
    const podeMarcar = dia >= hoje && dia <= limite && resumo.livres > 0
    const diaPassado = dia < hoje

    return (
        <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
            <section>
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <p className="letreiro text-muted-foreground">Dias disponíveis</p>
                        <h1 className="mt-1 font-marca text-4xl">{monthName(mes)}</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon-lg"
                            aria-label="Mês anterior"
                            disabled={mes.slice(0, 7) <= hoje.slice(0, 7)}
                            onClick={() => shiftMonth(-1)}
                        >
                            <ChevronLeft />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon-lg"
                            aria-label="Próximo mês"
                            disabled={mes.slice(0, 7) >= limite.slice(0, 7)}
                            onClick={() => shiftMonth(1)}
                        >
                            <ChevronRight />
                        </Button>
                    </div>
                </div>

                <div className="mt-5 rounded-lg border bg-card p-2 sm:p-4">
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                        {DIAS_SEMANA_CURTOS.map((nome) => (
                            <span key={nome} className="letreiro py-1 text-center text-subtle">
                                {nome}
                            </span>
                        ))}

                        {dias.map((d) => {
                            const doMes = d.slice(0, 7) === mes.slice(0, 7)
                            const resumoDia = porDia.get(d)
                            const fora = d < hoje || d > limite
                            const fechado = resumoDia?.status === StatusDias.FECHADO
                            const ativo = d === dia

                            return (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => setDia(d)}
                                    disabled={!doMes}
                                    aria-pressed={ativo}
                                    aria-label={`${formatDayMonth(d)}${resumoDia ? `: ${StatusDiaLabels[resumoDia.status]}` : ""}`}
                                    className={cn(
                                        "flex aspect-[5/4] flex-col items-center justify-center gap-1 rounded-md font-display text-base transition-colors sm:text-lg",
                                        !doMes && "invisible",
                                        doMes && !fora && !fechado && "border bg-surface-2 hover:border-line-strong",
                                        (fora || fechado) && "text-subtle line-through decoration-1",
                                        d === hoje && !ativo && "border-line-strong",
                                        ativo && "brilho bg-primary text-primary-foreground no-underline"
                                    )}
                                >
                                    {Number(d.slice(8))}
                                    {doMes && !fora && resumoDia && !fechado && (
                                        <span className={cn("size-1.5 rounded-full", ativo ? "bg-white" : STATUS_DIA_DOT[resumoDia.status])} />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    {[StatusDias.VAGAS, StatusDias.POUCOS, StatusDias.LOTADO, StatusDias.FECHADO].map((status) => (
                        <li key={status} className="flex items-center gap-2">
                            <span className={cn("size-2 rounded-full", STATUS_DIA_DOT[status])} />
                            {StatusDiaLabels[status]}
                        </li>
                    ))}
                </ul>
            </section>

            <section className="flex flex-col gap-3">
                <div className="rounded-lg border bg-card p-5">
                    <p className="letreiro text-muted-foreground">{weekdayName(dia)}</p>
                    <h2 className="mt-1 font-display text-4xl font-medium">{formatDayMonth(dia)}</h2>

                    {isPending ? (
                        <Skeleton className="mt-5 h-40 w-full" />
                    ) : (
                        <>
                            <div className="mt-4 flex gap-10">
                                <div>
                                    <p className="font-display text-3xl tabular-nums">{diaPassado ? "—" : resumo.livres}</p>
                                    <p className="text-sm text-muted-foreground">horários livres</p>
                                </div>
                                <div>
                                    <p className="font-display text-3xl tabular-nums">
                                        {funcionamento
                                            ? `${minutesToTime(funcionamento.abre).replace(":00", "")}–${minutesToTime(funcionamento.fecha).replace(":00", "")}h`
                                            : "Fechado"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">funcionamento</p>
                                </div>
                            </div>

                            <ul className="mt-5 flex flex-col gap-2">
                                {barbeiros.map((barbeiro) => {
                                    const disponivel = doDia.find((item) => item.barbeiroId === barbeiro.id)

                                    return (
                                        <li key={barbeiro.id} className="flex items-center gap-3 rounded-md border bg-surface-2 px-3 py-2.5">
                                            <Iniciais nome={barbeiro.nome} />
                                            <span className="flex-1 font-medium">{barbeiro.nome}</span>
                                            {disponivel && !diaPassado && <StatusDiaBadge status={disponivel.status} livres={disponivel.livres} />}
                                        </li>
                                    )
                                })}
                            </ul>

                            <Button
                                size="xl"
                                className="mt-5 w-full"
                                disabled={!podeMarcar}
                                render={podeMarcar ? <Link href={`/agendar?dia=${dia}`} /> : undefined}
                            >
                                {diaPassado ? "Dia que já passou" : podeMarcar ? "Marcar neste dia" : "Sem horário neste dia"}
                            </Button>
                        </>
                    )}
                </div>

                {configuracao && (
                    <p className="text-sm text-muted-foreground">
                        Assinantes marcam com até {configuracao.antecedencia_assinante_dias} dias de antecedência; os demais, até{" "}
                        {configuracao.antecedencia_avulso_dias}.
                        {dia > limiteAvulso && dia <= limite && " Este dia está aberto só para assinantes."}
                    </p>
                )}
            </section>
        </div>
    )
}
