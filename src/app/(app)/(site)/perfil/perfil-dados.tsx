"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { describeMutationError } from "~/lib/errors"
import { QUERIES, invalidatePerfil } from "~/lib/queries"
import { maskPhoneInput, onlyDigits } from "~/lib/utils"
import { getMeuPerfil, updateMeuPerfil } from "~/services/profiles"
import { Skeleton } from "~/components/ui/skeleton"
import { Section } from "~/components/detail-section"
import { MeusDadosForm, type MeusDadosFormValues } from "~/components/forms/meus-dados-form"

export function PerfilDados() {
    const queryClient = useQueryClient()

    const { data: perfil } = useQuery({
        queryKey: [QUERIES.GET_MEU_PERFIL],
        queryFn: () => getMeuPerfil(),
    })

    const { mutateAsync, isPending } = useMutation({
        mutationFn: (values: MeusDadosFormValues) =>
            updateMeuPerfil({
                nome: values.nome.trim(),
                telefone: onlyDigits(values.telefone),
                nascimento: values.nascimento || null,
                lembreteWhatsapp: values.lembreteWhatsapp,
            }),
        onSuccess: () => invalidatePerfil(queryClient),
    })

    function handleSubmit(values: MeusDadosFormValues) {
        if (isPending) return

        toast.promise(mutateAsync(values), {
            loading: "Salvando seus dados...",
            success: "Dados salvos.",
            error: (error: unknown) => describeMutationError(error),
        })
    }

    return (
        <Section title="Meus dados">
            {perfil ? (
                <MeusDadosForm
                    defaultValues={{
                        nome: perfil.nome ?? "",
                        telefone: maskPhoneInput(perfil.telefone ?? ""),
                        nascimento: perfil.nascimento ?? "",
                        lembreteWhatsapp: perfil.lembrete_whatsapp,
                    }}
                    email={perfil.email ?? ""}
                    isPending={isPending}
                    onSubmit={handleSubmit}
                />
            ) : (
                <Skeleton className="h-64 w-full" />
            )}
        </Section>
    )
}
