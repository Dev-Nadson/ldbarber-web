"use client"

import { AgendamentoStatuses } from "~/lib/constants"
import { expedienteDoDia, type ExpedienteDia } from "~/lib/agenda"
import { cn, dateKeyOf, formatTime, minutesOfDay, minutesToTime, pluralize, timeToMinutes } from "~/lib/utils"
import type { Agendamento } from "~/services/agendamentos"
import type { Barbeiro } from "~/services/barbeiros"
import type { Bloqueio } from "~/services/bloqueios"
import { Iniciais } from "~/components/iniciais"
import { DeleteBloqueioDialog } from "./delete-bloqueio-dialog"

/** Pixels por minuto: 30 min = 48 px, a altura de uma linha do design. */
const ESCALA = 1.6

type AgendaDiaProps = {
    dia: string
    barbeiros: Barbeiro[]
    expedientes: ExpedienteDia[]
    agendamentos: Agendamento[]
    bloqueios: Bloqueio[]
    agora: number
    onSelect: (agendamentoId: string) => void
}

/**
 * A agenda do dia em colunas, uma por barbeiro (design: Admin 05). Cores da borda:
 * avulso (cromo), assinante (neon), já começou e não foi fechado no caixa (âmbar),
 * concluído (verde) e falta (vermelho). Pausa e bloqueio, hachurados.
 */
export function AgendaDia({ dia, barbeiros, expedientes, agendamentos, bloqueios, agora, onSelect }: AgendaDiaProps) {
    const doDia = barbeiros.map((barbeiro) => expedienteDoDia(expedientes, barbeiro.id, dia))
    const minutos = [
        ...doDia.flatMap((expediente) => (expediente ? [timeToMinutes(expediente.abre), timeToMinutes(expediente.fecha)] : [])),
        ...agendamentos.flatMap((agendamento) => [minutesOfDay(agendamento.inicio), minutesOfDay(agendamento.fim)]),
    ]
    const inicio = Math.floor(Math.min(9 * 60, ...minutos) / 60) * 60
    const fim = Math.ceil(Math.max(19 * 60, ...minutos) / 60) * 60
    const linhas = Array.from({ length: (fim - inicio) / 30 }, (_, index) => inicio + index * 30)
    const altura = (fim - inicio) * ESCALA

    function posicao(de: number, ate: number) {
        return { top: (de - inicio) * ESCALA, height: Math.max((ate - de) * ESCALA, 22) }
    }

    return (
        <div className="overflow-x-auto rounded-lg border bg-card">
            <div className="min-w-[640px]">
                <div className="sticky top-0 z-10 grid border-b bg-card" style={{ gridTemplateColumns: `56px repeat(${barbeiros.length}, minmax(0, 1fr))` }}>
                    <span />
                    {barbeiros.map((barbeiro) => {
                        const total = agendamentos.filter((agendamento) => agendamento.barbeiro_id === barbeiro.id).length

                        return (
                            <div key={barbeiro.id} className="flex items-center gap-3 border-l px-3 py-3">
                                <Iniciais nome={barbeiro.nome} />
                                <div className="min-w-0">
                                    <p className="truncate font-medium">{barbeiro.nome}</p>
                                    <p className="text-xs text-muted-foreground">{pluralize(total, "horário", "horários")}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="grid" style={{ gridTemplateColumns: `56px repeat(${barbeiros.length}, minmax(0, 1fr))` }}>
                    <div className="relative" style={{ height: altura }}>
                        {linhas
                            .filter((minuto) => minuto % 60 === 0)
                            .map((minuto) => (
                                <span
                                    key={minuto}
                                    className="absolute left-2 font-display text-xs text-subtle tabular-nums"
                                    style={{ top: (minuto - inicio) * ESCALA + 4 }}
                                >
                                    {minutesToTime(minuto)}
                                </span>
                            ))}
                    </div>

                    {barbeiros.map((barbeiro, indice) => {
                        const expediente = doDia[indice]
                        const pausa =
                            expediente?.pausa_inicio && expediente.pausa_fim
                                ? [timeToMinutes(expediente.pausa_inicio), timeToMinutes(expediente.pausa_fim)]
                                : null

                        return (
                            <div key={barbeiro.id} className="relative border-l" style={{ height: altura }}>
                                {linhas.map((minuto) => (
                                    <div
                                        key={minuto}
                                        className={cn("absolute inset-x-0 border-t", minuto % 60 !== 0 && "border-dashed border-border/50")}
                                        style={{ top: (minuto - inicio) * ESCALA }}
                                    />
                                ))}

                                {/* Fora do expediente: apagado. */}
                                {!expediente ? (
                                    <div className="hachura absolute inset-0 grid place-items-center">
                                        <span className="letreiro text-subtle">Não atende</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="absolute inset-x-0 top-0 bg-background/60" style={{ height: (timeToMinutes(expediente.abre) - inicio) * ESCALA }} />
                                        <div
                                            className="absolute inset-x-0 bottom-0 bg-background/60"
                                            style={{ top: (timeToMinutes(expediente.fecha) - inicio) * ESCALA }}
                                        />
                                    </>
                                )}

                                {pausa && (
                                    <div className="hachura absolute inset-x-1 rounded-sm border-l-2 border-line-strong bg-surface-2/70 px-2 py-1" style={posicao(pausa[0], pausa[1])}>
                                        <p className="text-sm font-medium">Almoço</p>
                                        <p className="text-xs text-muted-foreground">
                                            {minutesToTime(pausa[0])} – {minutesToTime(pausa[1])}
                                        </p>
                                    </div>
                                )}

                                {bloqueios
                                    .filter((bloqueio) => bloqueio.barbeiro_id === barbeiro.id)
                                    .map((bloqueio) => {
                                        // Bloqueio de vários dias (folga, férias) ocupa a coluna inteira nos dias do meio.
                                        const de = dateKeyOf(bloqueio.inicio) < dia ? inicio : Math.max(minutesOfDay(bloqueio.inicio), inicio)
                                        const ate = dateKeyOf(bloqueio.fim) > dia ? fim : Math.min(minutesOfDay(bloqueio.fim), fim)

                                        return (
                                            <div
                                                key={bloqueio.id}
                                                className="hachura group absolute inset-x-1 flex items-start justify-between gap-1 rounded-sm border-l-2 border-subtle bg-surface-2/70 px-2 py-1"
                                                style={posicao(de, ate)}
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">{bloqueio.motivo ?? "Bloqueado"}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatTime(bloqueio.inicio)} – {formatTime(bloqueio.fim)}
                                                    </p>
                                                </div>
                                                <DeleteBloqueioDialog bloqueio={bloqueio} />
                                            </div>
                                        )
                                    })}

                                {agendamentos
                                    .filter((agendamento) => agendamento.barbeiro_id === barbeiro.id)
                                    .map((agendamento) => {
                                        const pendente =
                                            agendamento.status === AgendamentoStatuses.CONFIRMADO && agora > 0 && Date.parse(agendamento.inicio) <= agora

                                        return (
                                            <button
                                                key={agendamento.id}
                                                type="button"
                                                onClick={() => onSelect(agendamento.id)}
                                                className={cn(
                                                    "absolute inset-x-1 overflow-hidden rounded-sm border-l-2 px-2 py-1 text-left transition-colors hover:brightness-125",
                                                    agendamento.incluso_plano ? "border-primary bg-primary/14" : "border-chrome bg-surface-3",
                                                    pendente && "border-warning",
                                                    agendamento.status === AgendamentoStatuses.CONCLUIDO && "border-success opacity-75",
                                                    agendamento.status === AgendamentoStatuses.FALTA && "border-danger opacity-60"
                                                )}
                                                style={posicao(minutesOfDay(agendamento.inicio), minutesOfDay(agendamento.fim))}
                                            >
                                                <p className="truncate text-sm font-medium">{agendamento.cliente_nome}</p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {formatTime(agendamento.inicio)} · {agendamento.servico_nome}
                                                    {agendamento.incluso_plano && ` · ${agendamento.plano_nome}`}
                                                </p>
                                            </button>
                                        )
                                    })}
                            </div>
                        )
                    })}
                </div>
            </div>

            <ul className="flex flex-wrap gap-x-5 gap-y-2 border-t px-4 py-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-chrome" />Avulso</li>
                <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-primary" />Assinante</li>
                <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-warning" />Falta fechar no caixa</li>
                <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-success" />Concluído</li>
                <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-subtle" />Bloqueado</li>
            </ul>
        </div>
    )
}
