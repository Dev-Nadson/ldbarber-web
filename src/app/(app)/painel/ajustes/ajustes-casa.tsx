"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useConfiguracao } from "~/hooks/use-configuracao"
import { describeMutationError } from "~/lib/errors"
import { invalidateConfiguracao } from "~/lib/queries"
import { maskPhoneInput, onlyDigits, toNullable } from "~/lib/utils"
import { updateCasa } from "~/services/configuracoes"
import { Skeleton } from "~/components/ui/skeleton"
import { Section } from "~/components/detail-section"
import { CasaForm, type CasaFormValues } from "~/components/forms/casa-form"

export function AjustesCasa() {
    const queryClient = useQueryClient()
    const { data: configuracao } = useConfiguracao()

    const { mutateAsync, isPending } = useMutation({
        mutationFn: (values: CasaFormValues) =>
            updateCasa({
                endereco: toNullable(values.endereco),
                // O banco guarda com o 55 do Brasil: é o número do link wa.me.
                whatsapp: values.whatsapp ? `55${onlyDigits(values.whatsapp)}` : null,
                instagram: toNullable(values.instagram.replace(/^@/, "")),
                aviso: toNullable(values.aviso),
                chavePix: toNullable(values.chavePix),
            }),
        onSuccess: () => invalidateConfiguracao(queryClient),
    })

    function handleSubmit(values: CasaFormValues) {
        if (isPending) return

        toast.promise(mutateAsync(values), {
            loading: "Salvando...",
            success: "Dados da casa salvos.",
            error: (error: unknown) => describeMutationError(error),
        })
    }

    return (
        <Section title="Casa" description="Aparece no site: rodapé, faixa de aviso e “Falar com a casa”.">
            {configuracao ? (
                <CasaForm
                    defaultValues={{
                        endereco: configuracao.endereco ?? "",
                        whatsapp: configuracao.whatsapp ? maskPhoneInput(configuracao.whatsapp.slice(2)) : "",
                        instagram: configuracao.instagram ? `@${configuracao.instagram}` : "",
                        aviso: configuracao.aviso ?? "",
                        chavePix: configuracao.chave_pix ?? "",
                    }}
                    isPending={isPending}
                    onSubmit={handleSubmit}
                />
            ) : (
                <Skeleton className="h-80 w-full" />
            )}
        </Section>
    )
}
