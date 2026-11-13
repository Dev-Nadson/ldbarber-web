"use client"

import { useQuery } from "@tanstack/react-query"

import { QUERIES } from "~/lib/queries"
import { formatCurrency, formatDuration } from "~/lib/utils"
import { listBarbeiros } from "~/services/barbeiros"
import { listServicos } from "~/services/servicos"
import { Skeleton } from "~/components/ui/skeleton"
import { Iniciais } from "~/components/iniciais"

export function InicioServicos() {
    const { data: servicos, isPending } = useQuery({
        queryKey: [QUERIES.LIST_SERVICOS, { incluirInativos: false }],
        queryFn: () => listServicos(),
    })
    const { data: barbeiros } = useQuery({
        queryKey: [QUERIES.LIST_BARBEIROS, { incluirInativos: false }],
        queryFn: () => listBarbeiros(),
    })

    return (
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr]">
            <section>
                <p className="letreiro text-muted-foreground">Serviços</p>
                <h2 className="mt-1 font-marca text-3xl">Na cadeira</h2>
                <ul className="mt-5 divide-y rounded-lg border bg-card">
                    {isPending &&
                        Array.from({ length: 4 }).map((_, index) => (
                            <li key={index} className="px-4 py-4">
                                <Skeleton className="h-5 w-full" />
                            </li>
                        ))}
                    {servicos?.map((servico) => (
                        <li key={servico.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
                            <div className="min-w-0">
                                <p className="font-medium">{servico.nome}</p>
                                <p className="text-sm text-muted-foreground">
                                    {formatDuration(servico.duracao_min)}
                                    {servico.descricao && ` · ${servico.descricao}`}
                                </p>
                            </div>
                            <span className="font-display text-xl tabular-nums">{formatCurrency(servico.preco)}</span>
                        </li>
                    ))}
                    {servicos && !servicos.length && (
                        <li className="px-4 py-8 text-center text-sm text-muted-foreground">Os serviços aparecem aqui em breve.</li>
                    )}
                </ul>
            </section>

            <section>
                <p className="letreiro text-muted-foreground">A casa</p>
                <h2 className="mt-1 font-marca text-3xl">Barbeiros</h2>
                <ul className="mt-5 flex flex-col gap-3">
                    {barbeiros?.map((barbeiro) => (
                        <li key={barbeiro.id} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
                            <Iniciais nome={barbeiro.nome} className="size-10" />
                            <div>
                                <p className="font-medium">{barbeiro.nome}</p>
                                {barbeiro.especialidade && <p className="text-sm text-muted-foreground">{barbeiro.especialidade}</p>}
                            </div>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    )
}
