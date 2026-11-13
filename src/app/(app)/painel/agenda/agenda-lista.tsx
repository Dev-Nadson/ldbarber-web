"use client"

import { DIAS_SEMANA_CURTOS } from "~/lib/constants"
import { addDays, cn, firstName, formatTime, weekday } from "~/lib/utils"
import type { Agendamento } from "~/services/agendamentos"
import type { Barbeiro } from "~/services/barbeiros"
import type { Bloqueio } from "~/services/bloqueios"
import { AgendamentoStatusBadge, Selo } from "~/components/badges"
import { Segmentado } from "~/components/segmentado"
import { TODOS_BARBEIROS, useAgenda } from "./agenda-store"

type AgendaListaProps = {
    dia: string
    barbeiros: Barbeiro[]
    agendamentos: Agendamento[]
    bloqueios: Bloqueio[]
    onSelect: (agendamentoId: string) => void
}

/** A agenda no celular (design: Admin 05, mobile): faixa de dias, filtro de barbeiro e a lista. */
export function AgendaLista({ dia, barbeiros, agendamentos, bloqueios, onSelect }: AgendaListaProps) {
    const { barbeiroFiltro, setDia, setBarbeiroFiltro } = useAgenda()
    const faixa = Array.from({ length: 7 }, (_, index) => addDays(dia, index - 2))
    const filtro = barbeiros.some((barbeiro) => barbeiro.id === barbeiroFiltro) ? barbeiroFiltro : TODOS_BARBEIROS
    const lista = agendamentos.filter((agendamento) => filtro === TODOS_BARBEIROS || agendamento.barbeiro_id === filtro)
    const bloqueiosDoFiltro = bloqueios.filter((bloqueio) => filtro === TODOS_BARBEIROS || bloqueio.barbeiro_id === filtro)

    return (
        <div className="flex flex-col gap-4">
            <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4">
                {faixa.map((d) => (
                    <button
                        key={d}
                        type="button"
                        onClick={() => setDia(d)}
                        aria-pressed={d === dia}
                        className={cn(
                            "flex w-12 shrink-0 flex-col items-center rounded-md border py-1.5",
                            d === dia ? "border-primary bg-primary text-primary-foreground" : "bg-surface-2"
                        )}
                    >
                        <span className="letreiro text-[10px]">{DIAS_SEMANA_CURTOS[weekday(d)]}</span>
                        <span className="font-display text-xl">{Number(d.slice(8))}</span>
                    </button>
                ))}
            </div>

            {barbeiros.length > 1 && (
                <Segmentado
                    aria-label="Barbeiro"
                    size="sm"
                    value={filtro}
                    onChange={setBarbeiroFiltro}
                    className="w-full"
                    options={[
                        { value: TODOS_BARBEIROS, label: "Todos" },
                        ...barbeiros.map((barbeiro) => ({ value: barbeiro.id, label: firstName(barbeiro.nome) })),
                    ]}
                />
            )}

            {bloqueiosDoFiltro.map((bloqueio) => (
                <p key={bloqueio.id} className="hachura rounded-md border px-3 py-2 text-sm text-muted-foreground">
                    {bloqueio.motivo ?? "Bloqueado"} · {formatTime(bloqueio.inicio)} – {formatTime(bloqueio.fim)}
                </p>
            ))}

            {!lista.length ? (
                <p className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">Nenhum horário neste dia.</p>
            ) : (
                <ul className="divide-y">
                    {lista.map((agendamento) => (
                        <li key={agendamento.id}>
                            <button
                                type="button"
                                onClick={() => onSelect(agendamento.id)}
                                className="flex w-full items-start gap-4 py-3 text-left"
                            >
                                <span className="w-12 font-display text-lg tabular-nums">{formatTime(agendamento.inicio)}</span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-medium">{agendamento.cliente_nome}</span>
                                    <span className="block truncate text-sm text-muted-foreground">
                                        {agendamento.servico_nome} · {firstName(agendamento.barbeiro_nome)}
                                    </span>
                                </span>
                                {agendamento.status !== "confirmado" ? (
                                    <AgendamentoStatusBadge status={agendamento.status} />
                                ) : (
                                    agendamento.incluso_plano && <Selo variant="default">{agendamento.plano_nome}</Selo>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
