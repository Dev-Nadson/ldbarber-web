import { Periodicidades, type Periodicidade } from "~/lib/constants"
import { valorMensalEquivalente, valorPeriodo } from "~/lib/plano"
import { cn, formatCurrency, formatPrice } from "~/lib/utils"
import type { Plano } from "~/services/planos"

type PlanoCardProps = {
    plano: Plano
    periodicidade: Periodicidade
    descontoTrimestral: number
    /** O botão de assinar (depende de login e do plano atual). */
    acao: React.ReactNode
    className?: string
}

/** O cartão do plano (design: Cliente 04). O "Mais escolhido" ganha a borda neon. */
export function PlanoCard({ plano, periodicidade, descontoTrimestral, acao, className }: PlanoCardProps) {
    const trimestral = periodicidade === Periodicidades.TRIMESTRAL
    const porMes = valorMensalEquivalente(plano.preco_mensal, periodicidade, descontoTrimestral)

    return (
        <article
            className={cn(
                "relative flex flex-col rounded-lg border bg-card p-5 sm:p-6",
                plano.destaque && "brilho border-primary",
                className
            )}
        >
            {plano.destaque && (
                <span className="absolute -top-2.5 left-5 bg-primary px-2 py-0.5 font-display text-[11px] font-semibold tracking-[0.14em] text-primary-foreground uppercase">
                    Mais escolhido
                </span>
            )}

            <h2 className="font-marca text-3xl">{plano.nome}</h2>
            <p className="mt-3 flex items-baseline gap-1.5">
                <span className="font-display text-5xl font-medium tabular-nums">{formatPrice(porMes)}</span>
                <span className="text-sm text-muted-foreground">/mês</span>
            </p>
            {trimestral && (
                <p className="mt-1 text-sm text-muted-foreground">
                    {formatCurrency(valorPeriodo(plano.preco_mensal, periodicidade, descontoTrimestral))} a cada 3 meses
                </p>
            )}

            <ul className="mt-5 flex flex-1 flex-col gap-2.5 text-sm">
                {plano.beneficios.map((linha) => (
                    <li key={linha} className="flex items-start gap-3">
                        <span className="mt-2 h-px w-2.5 shrink-0 bg-primary" aria-hidden="true" />
                        {linha}
                    </li>
                ))}
                {plano.nao_inclui.map((linha) => (
                    <li key={linha} className="flex items-start gap-3 text-subtle line-through">
                        <span className="mt-2 h-px w-2.5 shrink-0 bg-subtle" aria-hidden="true" />
                        <span>
                            <span className="sr-only">Não inclui: </span>
                            {linha}
                        </span>
                    </li>
                ))}
            </ul>

            <div className="mt-6">{acao}</div>
        </article>
    )
}
