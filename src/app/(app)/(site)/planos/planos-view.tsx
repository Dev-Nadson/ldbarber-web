"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { useConfiguracao } from "~/hooks/use-configuracao"
import { useMeuPlano } from "~/hooks/use-meu-plano"
import { Periodicidades, type Periodicidade } from "~/lib/constants"
import { valorMensalEquivalente } from "~/lib/plano"
import { QUERIES } from "~/lib/queries"
import { cn, formatPrice } from "~/lib/utils"
import { listPlanos } from "~/services/planos"
import { Skeleton } from "~/components/ui/skeleton"
import { Segmentado } from "~/components/segmentado"
import { AssinarButton } from "./assinar-button"
import { PlanoCard } from "./plano-card"

export function PlanosView() {
    const { data: configuracao } = useConfiguracao()
    const { assinatura, situacao } = useMeuPlano()
    const [periodicidade, setPeriodicidade] = useState<Periodicidade>(Periodicidades.MENSAL)
    const [escolhido, setEscolhido] = useState<string | null>(null)
    const desconto = configuracao?.desconto_trimestral ?? 0

    const { data: planos, isPending } = useQuery({
        queryKey: [QUERIES.LIST_PLANOS, { incluirInativos: false }],
        queryFn: () => listPlanos(),
    })

    // Celular: um cartão aberto (o escolhido, ou o "Mais escolhido") e os outros em linha.
    const aberto = planos?.find((plano) => plano.id === escolhido) ?? planos?.find((plano) => plano.destaque) ?? planos?.[0]

    const segmentado = (
        <Segmentado
            aria-label="Periodicidade"
            value={periodicidade}
            onChange={setPeriodicidade}
            options={[
                { value: Periodicidades.MENSAL, label: "Mensal" },
                { value: Periodicidades.TRIMESTRAL, label: desconto > 0 ? `Trimestral −${desconto}%` : "Trimestral" },
            ]}
        />
    )

    function acao(plano: NonNullable<typeof planos>[number]) {
        return <AssinarButton plano={plano} periodicidade={periodicidade} assinatura={assinatura} situacao={situacao} />
    }

    return (
        <div className="flex flex-col gap-8">
            <header className="flex flex-col gap-3 md:items-center md:text-center">
                <p className="letreiro text-muted-foreground">Assinatura mensal</p>
                <h1 className="font-marca text-4xl sm:text-5xl">Planos</h1>
                <p className="text-muted-foreground">Corte sempre em dia, sem pensar no valor. Cancele quando quiser.</p>
                <div className="md:hidden">{segmentado}</div>
            </header>

            {isPending && <Skeleton className="h-96 w-full" />}

            {planos && !planos.length && <p className="text-center text-muted-foreground">Os planos aparecem aqui em breve.</p>}

            {planos && planos.length > 0 && (
                <>
                    {/* Computador: os cartões lado a lado. */}
                    <div className="hidden justify-center gap-6 md:flex">
                        {planos.map((plano) => (
                            <PlanoCard
                                key={plano.id}
                                plano={plano}
                                periodicidade={periodicidade}
                                descontoTrimestral={desconto}
                                acao={acao(plano)}
                                className="w-full max-w-xs"
                            />
                        ))}
                    </div>

                    {/* Celular: o aberto inteiro, os outros em linha (tocar abre). */}
                    <div className="flex flex-col gap-3 md:hidden">
                        {aberto && (
                            <PlanoCard plano={aberto} periodicidade={periodicidade} descontoTrimestral={desconto} acao={acao(aberto)} />
                        )}
                        {planos
                            .filter((plano) => plano.id !== aberto?.id)
                            .map((plano) => (
                                <button
                                    key={plano.id}
                                    type="button"
                                    onClick={() => setEscolhido(plano.id)}
                                    className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3 text-left"
                                >
                                    <span className="min-w-0">
                                        <span className="block font-marca text-xl">{plano.nome}</span>
                                        {plano.resumo && <span className="block truncate text-sm text-muted-foreground">{plano.resumo}</span>}
                                    </span>
                                    <span className="font-display text-lg tabular-nums">
                                        {formatPrice(valorMensalEquivalente(plano.preco_mensal, periodicidade, desconto))}
                                    </span>
                                </button>
                            ))}
                    </div>

                    <div className={cn("hidden justify-center md:flex")}>{segmentado}</div>
                </>
            )}
        </div>
    )
}
