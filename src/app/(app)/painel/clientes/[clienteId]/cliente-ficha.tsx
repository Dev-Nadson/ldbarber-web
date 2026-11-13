"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { describeMutationError } from "~/lib/errors"
import { QUERIES, invalidateFicha } from "~/lib/queries"
import { listBarbeiros } from "~/services/barbeiros"
import { getFicha, saveFicha } from "~/services/clientes"
import { Skeleton } from "~/components/ui/skeleton"
import { Section } from "~/components/detail-section"
import { FichaForm, SEM_PREFERIDO, type FichaFormValues } from "~/components/forms/ficha-form"

export function ClienteFicha({ clienteId }: { clienteId: string }) {
    const queryClient = useQueryClient()

    const { data: ficha, isPending: carregando } = useQuery({
        queryKey: [QUERIES.GET_FICHA, { clienteId }],
        queryFn: () => getFicha({ clienteId }),
    })
    const { data: barbeiros } = useQuery({
        queryKey: [QUERIES.LIST_BARBEIROS, { incluirInativos: false }],
        queryFn: () => listBarbeiros(),
    })

    const { mutateAsync, isPending } = useMutation({
        mutationFn: (values: FichaFormValues) =>
            saveFicha({
                clienteId,
                apelido: values.apelido.trim() || null,
                barbeiroPreferidoId: values.barbeiroPreferidoId === SEM_PREFERIDO ? null : values.barbeiroPreferidoId,
                observacoes: values.observacoes.trim() || null,
            }),
        onSuccess: () => invalidateFicha(queryClient),
    })

    function handleSubmit(values: FichaFormValues) {
        if (isPending) return

        toast.promise(mutateAsync(values), {
            loading: "Salvando a ficha...",
            success: "Ficha salva.",
            error: (error: unknown) => describeMutationError(error),
        })
    }

    return (
        <Section title="Ficha da casa" description="Só a equipe vê. O cliente não tem acesso a estas anotações.">
            {carregando || !barbeiros ? (
                <Skeleton className="h-56 w-full" />
            ) : (
                <FichaForm
                    defaultValues={{
                        apelido: ficha?.apelido ?? "",
                        barbeiroPreferidoId: ficha?.barbeiro_preferido_id ?? SEM_PREFERIDO,
                        observacoes: ficha?.observacoes ?? "",
                    }}
                    barbeiros={barbeiros.map((barbeiro) => ({ value: barbeiro.id, label: barbeiro.nome }))}
                    isPending={isPending}
                    onSubmit={handleSubmit}
                />
            )}
        </Section>
    )
}
