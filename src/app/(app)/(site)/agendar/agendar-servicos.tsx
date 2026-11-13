"use client"

import { formatCurrency, formatDuration, cn } from "~/lib/utils"
import type { Servico } from "~/services/servicos"
import { Skeleton } from "~/components/ui/skeleton"

type AgendarServicosProps = {
    servicos: Servico[] | undefined
    servicoId: string | null
    /** Os serviços que entram no plano do cliente agora (cota sobrando). */
    inclusos: Set<string>
    onChange: (servicoId: string) => void
}

/** "1 · Serviço": cartões com o rádio, a duração e o preço (design: Cliente 03). */
export function AgendarServicos({ servicos, servicoId, inclusos, onChange }: AgendarServicosProps) {
    if (!servicos) return <Skeleton className="h-64 w-full" />

    return (
        <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Serviço">
            {servicos.map((servico) => {
                const ativo = servico.id === servicoId

                return (
                    <button
                        key={servico.id}
                        type="button"
                        role="radio"
                        aria-checked={ativo}
                        onClick={() => onChange(servico.id)}
                        className={cn(
                            "flex items-center gap-3 rounded-md border px-4 py-3.5 text-left transition-colors",
                            ativo ? "border-primary bg-primary/12" : "bg-surface-2 hover:border-line-strong"
                        )}
                    >
                        <span
                            className={cn(
                                "grid size-4 shrink-0 place-items-center rounded-full border",
                                ativo ? "border-primary bg-primary" : "border-line-strong"
                            )}
                            aria-hidden="true"
                        >
                            {ativo && <span className="size-1.5 rounded-full bg-white" />}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block font-medium">{servico.nome}</span>
                            <span className="block text-sm text-muted-foreground">{formatDuration(servico.duracao_min)}</span>
                        </span>
                        <span className="text-right">
                            <span className={cn("block font-display text-lg tabular-nums", inclusos.has(servico.id) && "text-subtle line-through")}>
                                {formatCurrency(servico.preco)}
                            </span>
                            {inclusos.has(servico.id) && <span className="letreiro text-neon-text">No plano</span>}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
