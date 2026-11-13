"use client"

import { DIAS_SEMANA_CURTOS } from "~/lib/constants"
import { addDays, cn, dateKeyOf, firstName, formatTime, today } from "~/lib/utils"
import type { Agendamento } from "~/services/agendamentos"
import type { Barbeiro } from "~/services/barbeiros"
import { Segmentado } from "~/components/segmentado"
import { TODOS_BARBEIROS, useAgenda } from "./agenda-store"

type AgendaSemanaProps = {
    inicioSemana: string
    barbeiros: Barbeiro[]
    agendamentos: Agendamento[]
    onSelect: (agendamentoId: string) => void
    onDia: (dia: string) => void
}

/** A semana, de domingo a sábado: os horários de cada dia em lista. Tocar no dia abre a visão do dia. */
export function AgendaSemana({ inicioSemana, barbeiros, agendamentos, onSelect, onDia }: AgendaSemanaProps) {
    const { barbeiroFiltro, setBarbeiroFiltro } = useAgenda()
    const filtro = barbeiros.some((barbeiro) => barbeiro.id === barbeiroFiltro) ? barbeiroFiltro : TODOS_BARBEIROS
    const dias = Array.from({ length: 7 }, (_, index) => addDays(inicioSemana, index))
    const hoje = today()

    return (
        <div className="flex flex-col gap-4">
            {barbeiros.length > 1 && (
                <Segmentado
                    aria-label="Barbeiro"
                    size="sm"
                    value={filtro}
                    onChange={setBarbeiroFiltro}
                    options={[
                        { value: TODOS_BARBEIROS, label: "Todos" },
                        ...barbeiros.map((barbeiro) => ({ value: barbeiro.id, label: firstName(barbeiro.nome) })),
                    ]}
                />
            )}

            <div className="grid gap-3 md:grid-cols-7">
                {dias.map((dia, index) => {
                    const doDia = agendamentos.filter(
                        (agendamento) =>
                            dateKeyOf(agendamento.inicio) === dia && (filtro === TODOS_BARBEIROS || agendamento.barbeiro_id === filtro)
                    )

                    return (
                        <section key={dia} className={cn("flex flex-col rounded-lg border bg-card", dia === hoje && "border-primary")}>
                            <button type="button" onClick={() => onDia(dia)} className="flex items-baseline justify-between border-b px-3 py-2 text-left">
                                <span className="letreiro text-muted-foreground">{DIAS_SEMANA_CURTOS[index]}</span>
                                <span className="font-display text-xl">{Number(dia.slice(8))}</span>
                            </button>
                            <ul className="flex flex-col gap-1 p-1.5">
                                {doDia.map((agendamento) => (
                                    <li key={agendamento.id}>
                                        <button
                                            type="button"
                                            onClick={() => onSelect(agendamento.id)}
                                            className={cn(
                                                "w-full rounded-sm border-l-2 px-2 py-1 text-left hover:brightness-125",
                                                agendamento.incluso_plano ? "border-primary bg-primary/14" : "border-chrome bg-surface-3",
                                                agendamento.status === "concluido" && "border-success opacity-75",
                                                agendamento.status === "falta" && "border-danger opacity-60"
                                            )}
                                        >
                                            <span className="block font-display text-sm tabular-nums">{formatTime(agendamento.inicio)}</span>
                                            <span className="block truncate text-xs">{agendamento.cliente_nome}</span>
                                            <span className="block truncate text-xs text-muted-foreground">{firstName(agendamento.barbeiro_nome)}</span>
                                        </button>
                                    </li>
                                ))}
                                {!doDia.length && <li className="px-2 py-3 text-center text-xs text-subtle">—</li>}
                            </ul>
                        </section>
                    )
                })}
            </div>
        </div>
    )
}
