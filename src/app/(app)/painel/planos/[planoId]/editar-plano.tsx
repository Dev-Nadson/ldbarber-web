"use client"

import { useQuery } from "@tanstack/react-query"

import { ApiError } from "~/lib/errors"
import { QUERIES } from "~/lib/queries"
import { getPlano } from "~/services/planos"
import { Skeleton } from "~/components/ui/skeleton"
import { PageHeader } from "~/components/page-header"
import { PlanoEditor } from "~/components/plano-editor"

export function EditarPlano({ planoId }: { planoId: string }) {
    const { data: plano, error } = useQuery({
        queryKey: [QUERIES.GET_PLANO, { planoId }],
        queryFn: () => getPlano({ planoId }),
    })

    if (error instanceof ApiError && error.status === 404) {
        return <p className="rounded-lg border border-dashed px-4 py-10 text-center text-muted-foreground">Plano não encontrado.</p>
    }

    if (!plano) return <Skeleton className="h-[520px] w-full" />

    return (
        <>
            <PageHeader eyebrow="Cadastros" title={plano.nome} />
            <PlanoEditor key={plano.id} plano={plano} />
        </>
    )
}
