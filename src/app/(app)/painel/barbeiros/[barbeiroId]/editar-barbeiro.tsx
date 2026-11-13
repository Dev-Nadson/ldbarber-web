"use client"

import { useQuery } from "@tanstack/react-query"

import { ApiError } from "~/lib/errors"
import { QUERIES } from "~/lib/queries"
import { getBarbeiro } from "~/services/barbeiros"
import { Skeleton } from "~/components/ui/skeleton"
import { BarbeiroEditor } from "~/components/barbeiro-editor"
import { PageHeader } from "~/components/page-header"

export function EditarBarbeiro({ barbeiroId }: { barbeiroId: string }) {
    const { data: barbeiro, error } = useQuery({
        queryKey: [QUERIES.GET_BARBEIRO, { barbeiroId }],
        queryFn: () => getBarbeiro({ barbeiroId }),
    })

    if (error instanceof ApiError && error.status === 404) {
        return <p className="rounded-lg border border-dashed px-4 py-10 text-center text-muted-foreground">Barbeiro não encontrado.</p>
    }

    if (!barbeiro) return <Skeleton className="h-[520px] w-full" />

    return (
        <>
            <PageHeader eyebrow="Cadastros" title={barbeiro.nome} />
            {/* `key`: remonta o formulário se o barbeiro for recarregado com outros dados. */}
            <BarbeiroEditor key={barbeiro.id} barbeiro={barbeiro} />
        </>
    )
}
