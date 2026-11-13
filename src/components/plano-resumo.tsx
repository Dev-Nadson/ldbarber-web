import { CategoriaLabels, PeriodicidadeLabels, Situacoes, type Situacao } from "~/lib/constants"
import { restanteDaCota, type UsoDoMes } from "~/lib/plano"
import { formatCurrency, formatDay, pluralize } from "~/lib/utils"
import type { MinhaAssinatura } from "~/services/assinaturas"
import { SituacaoBadge } from "~/components/badges"

type PlanoResumoProps = {
    assinatura: MinhaAssinatura
    situacao: Situacao | null
    uso: UsoDoMes
}

/** O plano do cliente: nome, situação, vencimento e quanto da cota sobra no mês. */
export function PlanoResumo({ assinatura, situacao, uso }: PlanoResumoProps) {
    const solicitada = situacao === Situacoes.SOLICITADA

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
                <span className="font-marca text-3xl">{assinatura.plano_nome}</span>
                <SituacaoBadge situacao={situacao} />
            </div>

            <p className="text-sm text-muted-foreground">
                {PeriodicidadeLabels[assinatura.periodicidade]} · {formatCurrency(assinatura.valor_mensal)}/mês
                {assinatura.vence_em && !assinatura.encerra_em && ` · vence em ${formatDay(assinatura.vence_em)}`}
                {assinatura.encerra_em && ` · encerra em ${formatDay(assinatura.encerra_em)}`}
            </p>

            {solicitada ? (
                <p className="rounded-md border border-dashed px-3 py-2.5 text-sm text-muted-foreground">
                    Pedido enviado. O plano começa a valer quando a barbearia registrar o primeiro pagamento (Pix, cartão
                    ou dinheiro, na casa).
                </p>
            ) : (
                <ul className="grid gap-2 sm:grid-cols-3">
                    {assinatura.cotas.map((cota) => {
                        const restante = restanteDaCota(cota, uso)

                        return (
                            <li key={cota.categoria} className="rounded-md bg-surface-2 px-3 py-2.5">
                                <p className="letreiro text-subtle">{CategoriaLabels[cota.categoria]}</p>
                                <p className="mt-0.5 font-display text-lg">
                                    {restante === null ? "Ilimitado" : `${pluralize(restante, "restante", "restantes")}`}
                                </p>
                                {cota.limite !== null && <p className="text-xs text-subtle">de {cota.limite} no mês</p>}
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}
