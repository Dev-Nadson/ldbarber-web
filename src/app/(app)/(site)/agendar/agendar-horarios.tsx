"use client"

import { DIAS_SEMANA_CURTOS } from "~/lib/constants"
import type { Horario } from "~/lib/agenda"
import { cn, weekday } from "~/lib/utils"
import { Skeleton } from "~/components/ui/skeleton"

type DiaOpcao = {
    dia: string
    livres: number
}

type AgendarHorariosProps = {
    dias: DiaOpcao[]
    dia: string | null
    horarios: Horario[]
    hora: string | null
    isPending: boolean
    onDia: (dia: string) => void
    onHora: (hora: string) => void
}

/** "3 · Horário": a faixa de dias e a grade (riscado = ocupado ou não cabe). */
export function AgendarHorarios({ dias, dia, horarios, hora, isPending, onDia, onHora }: AgendarHorariosProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" role="radiogroup" aria-label="Dia">
                {dias.map((opcao) => {
                    const ativo = opcao.dia === dia
                    const vazio = opcao.livres === 0

                    return (
                        <button
                            key={opcao.dia}
                            type="button"
                            role="radio"
                            aria-checked={ativo}
                            disabled={vazio}
                            onClick={() => onDia(opcao.dia)}
                            className={cn(
                                "flex w-14 shrink-0 flex-col items-center rounded-md border py-2 transition-colors",
                                ativo ? "border-primary bg-primary text-primary-foreground" : "bg-surface-2 hover:border-line-strong",
                                vazio && "opacity-40"
                            )}
                        >
                            <span className="letreiro text-[10px]">{DIAS_SEMANA_CURTOS[weekday(opcao.dia)]}</span>
                            <span className="font-display text-xl">{Number(opcao.dia.slice(8))}</span>
                        </button>
                    )
                })}
            </div>

            {isPending ? (
                <Skeleton className="h-40 w-full" />
            ) : !horarios.length ? (
                <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                    Nenhum horário neste dia. Escolha outro dia ou outro barbeiro.
                </p>
            ) : (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8" role="radiogroup" aria-label="Horário">
                    {horarios.map((horario) => {
                        const ativo = horario.livre && horario.hora === hora

                        return (
                            <button
                                key={horario.hora}
                                type="button"
                                role="radio"
                                aria-checked={ativo}
                                disabled={!horario.livre}
                                onClick={() => onHora(horario.hora)}
                                className={cn(
                                    "h-10 rounded-md border font-display text-base tabular-nums transition-colors",
                                    ativo && "border-primary bg-primary text-primary-foreground",
                                    !ativo && horario.livre && "bg-surface-2 hover:border-line-strong",
                                    !horario.livre && "border-dashed text-subtle line-through"
                                )}
                            >
                                {horario.hora}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
