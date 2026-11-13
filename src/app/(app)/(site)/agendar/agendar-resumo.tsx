"use client"

import { LoaderCircle } from "lucide-react"

import { formatCurrency, formatDuration, formatLongDay } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Selo } from "~/components/badges"

type AgendarResumoProps = {
    dia: string | null
    hora: string | null
    servicoNome: string | null
    duracaoMin: number | null
    preco: number | null
    barbeiroNome: string | null
    /** Nome do plano quando o serviço entra nele (o total vira R$ 0). */
    planoNome: string | null
    cancelamentoHoras: number
    podeConfirmar: boolean
    isPending: boolean
    onConfirmar: () => void
}

/** O resumo com a listra no topo (design: Cliente 03). É a prévia: o valor que vale é o do banco. */
export function AgendarResumo({
    dia,
    hora,
    servicoNome,
    duracaoMin,
    preco,
    barbeiroNome,
    planoNome,
    cancelamentoHoras,
    podeConfirmar,
    isPending,
    onConfirmar,
}: AgendarResumoProps) {
    return (
        <div className="relative overflow-hidden rounded-lg border bg-card p-5">
            <div className="listras absolute inset-x-0 top-0 h-1" aria-hidden="true" />
            <p className="letreiro text-muted-foreground">Resumo</p>
            <p className="mt-2 font-display text-5xl font-medium tabular-nums">{hora ?? "--:--"}</p>
            <p className="text-muted-foreground">{dia ? formatLongDay(dia) : "Escolha o dia"}</p>

            <dl className="mt-5 flex flex-col gap-3 border-t pt-4 text-sm">
                <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Serviço</dt>
                    <dd className="text-right">{servicoNome ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Barbeiro</dt>
                    <dd className="text-right">{barbeiroNome ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Duração</dt>
                    <dd>{duracaoMin ? formatDuration(duracaoMin) : "—"}</dd>
                </div>
            </dl>

            <div className="mt-4 flex items-end justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-right">
                    {planoNome && preco !== null && (
                        <span className="mr-2 font-display text-base text-subtle tabular-nums line-through">{formatCurrency(preco)}</span>
                    )}
                    <span className="font-display text-3xl font-medium tabular-nums">
                        {preco === null ? "—" : formatCurrency(planoNome ? 0 : preco)}
                    </span>
                </span>
            </div>

            {planoNome && <Selo variant="default" className="mt-3">Incluso no plano {planoNome}</Selo>}

            <Button size="xl" className="mt-5 hidden w-full md:flex" disabled={!podeConfirmar || isPending} onClick={onConfirmar}>
                {isPending && <LoaderCircle className="animate-spin" />}
                Confirmar horário
            </Button>
            <p className="mt-3 text-center text-sm text-muted-foreground">
                {cancelamentoHoras > 0
                    ? `Cancelamento grátis até ${cancelamentoHoras}h antes.`
                    : "Dá para cancelar até a hora do horário."}
            </p>
        </div>
    )
}
