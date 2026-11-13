"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Pencil } from "lucide-react"

import { CategoriaLabels } from "~/lib/constants"
import { QUERIES } from "~/lib/queries"
import { cn, formatPrice } from "~/lib/utils"
import { listPlanos } from "~/services/planos"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import { Selo } from "~/components/badges"
import { DeletePlanoDialog } from "./delete-plano-dialog"

export function PlanosList() {
    const { data: planos, isPending } = useQuery({
        queryKey: [QUERIES.LIST_PLANOS, { incluirInativos: true }],
        queryFn: () => listPlanos({ incluirInativos: true }),
    })

    if (isPending) return <Skeleton className="h-64 w-full" />

    if (!planos?.length) {
        return (
            <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                Nenhum plano ainda. Cadastre o primeiro para aparecer em /planos.
            </p>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {planos.map((plano) => (
                <article key={plano.id} className={cn("flex flex-col gap-4 rounded-lg border bg-card p-5", plano.destaque && "border-primary", !plano.ativo && "opacity-60")}>
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className="font-marca text-3xl">{plano.nome}</h2>
                            <p className="mt-1 font-display text-2xl tabular-nums">
                                {formatPrice(plano.preco_mensal)}
                                <span className="ml-1 font-sans text-sm text-muted-foreground">/mês</span>
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                            {plano.destaque && <Selo variant="default">Mais escolhido</Selo>}
                            {!plano.ativo && <Selo variant="secondary">Fora do site</Selo>}
                        </div>
                    </div>
                    <ul className="flex flex-1 flex-col gap-1.5 text-sm">
                        {plano.cotas.length ? (
                            plano.cotas.map((cota) => (
                                <li key={cota.categoria} className="flex justify-between gap-3">
                                    <span className="text-muted-foreground">{CategoriaLabels[cota.categoria]}</span>
                                    <span>{cota.limite === null ? "Ilimitado" : `${cota.limite} por mês`}</span>
                                </li>
                            ))
                        ) : (
                            <li className="text-warning">Sem cota: o plano não cobre nenhum serviço.</li>
                        )}
                    </ul>
                    <div className="flex justify-end gap-1 border-t pt-3">
                        <Button variant="outline" size="sm" render={<Link href={`/painel/planos/${plano.id}`} />}>
                            <Pencil />
                            Editar
                        </Button>
                        <DeletePlanoDialog plano={plano} />
                    </div>
                </article>
            ))}
        </div>
    )
}
