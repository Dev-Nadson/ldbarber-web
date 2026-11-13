"use client"

import { cn } from "~/lib/utils"
import type { Barbeiro } from "~/services/barbeiros"
import { Iniciais } from "~/components/iniciais"
import { QUALQUER_BARBEIRO } from "./agendar-store"

type AgendarBarbeirosProps = {
    barbeiros: Barbeiro[]
    barbeiroId: string | null
    onChange: (barbeiroId: string) => void
}

/** "2 · Barbeiro", com o "Tanto faz · Primeiro disponível" no fim. */
export function AgendarBarbeiros({ barbeiros, barbeiroId, onChange }: AgendarBarbeirosProps) {
    const opcoes = [
        ...barbeiros.map((barbeiro) => ({ id: barbeiro.id, nome: barbeiro.nome, detalhe: barbeiro.especialidade ?? "Barbeiro" })),
        { id: QUALQUER_BARBEIRO, nome: "Tanto faz", detalhe: "Primeiro disponível" },
    ]

    return (
        <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Barbeiro">
            {opcoes.map((opcao) => {
                const ativo = opcao.id === barbeiroId

                return (
                    <button
                        key={opcao.id}
                        type="button"
                        role="radio"
                        aria-checked={ativo}
                        onClick={() => onChange(opcao.id)}
                        className={cn(
                            "flex items-center gap-3 rounded-md border px-4 py-3 text-left transition-colors",
                            ativo ? "border-primary bg-primary/12" : "bg-surface-2 hover:border-line-strong"
                        )}
                    >
                        {opcao.id === QUALQUER_BARBEIRO ? (
                            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line-strong font-display text-sm text-muted-foreground">
                                ?
                            </span>
                        ) : (
                            <Iniciais nome={opcao.nome} destaque={ativo} />
                        )}
                        <span className="min-w-0">
                            <span className="block font-medium">{opcao.nome}</span>
                            <span className="block text-sm text-muted-foreground">{opcao.detalhe}</span>
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
