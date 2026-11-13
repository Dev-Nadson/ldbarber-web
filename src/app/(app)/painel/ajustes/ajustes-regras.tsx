"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useConfiguracao } from "~/hooks/use-configuracao"
import { describeMutationError } from "~/lib/errors"
import { invalidateConfiguracao } from "~/lib/queries"
import { updateRegras } from "~/services/configuracoes"
import { Skeleton } from "~/components/ui/skeleton"
import { Section } from "~/components/detail-section"
import { RegrasForm, type RegrasFormValues } from "~/components/forms/regras-form"

export function AjustesRegras() {
    const queryClient = useQueryClient()
    const { data: configuracao } = useConfiguracao()

    const { mutateAsync, isPending } = useMutation({
        mutationFn: (values: RegrasFormValues) =>
            updateRegras({
                intervaloMin: Number(values.intervaloMin),
                antecedenciaAvulsoDias: Number(values.antecedenciaAvulsoDias),
                antecedenciaAssinanteDias: Number(values.antecedenciaAssinanteDias),
                cancelamentoMinHoras: Number(values.cancelamentoMinHoras),
                maxAgendamentosAbertos: Number(values.maxAgendamentosAbertos),
                toleranciaAtrasoDias: Number(values.toleranciaAtrasoDias),
                descontoTrimestral: Number(values.descontoTrimestral),
            }),
        onSuccess: () => invalidateConfiguracao(queryClient),
    })

    function handleSubmit(values: RegrasFormValues) {
        if (isPending) return

        toast.promise(mutateAsync(values), {
            loading: "Salvando...",
            success: "Regras da agenda salvas.",
            error: (error: unknown) => describeMutationError(error),
        })
    }

    return (
        <Section title="Regras da agenda" description="Valem no banco para todo horário marcado pelo site. O encaixe da equipe não segue grade nem antecedência.">
            {configuracao ? (
                <RegrasForm
                    defaultValues={{
                        intervaloMin: String(configuracao.intervalo_min),
                        antecedenciaAvulsoDias: String(configuracao.antecedencia_avulso_dias),
                        antecedenciaAssinanteDias: String(configuracao.antecedencia_assinante_dias),
                        cancelamentoMinHoras: String(configuracao.cancelamento_min_horas),
                        maxAgendamentosAbertos: String(configuracao.max_agendamentos_abertos),
                        toleranciaAtrasoDias: String(configuracao.tolerancia_atraso_dias),
                        descontoTrimestral: String(configuracao.desconto_trimestral),
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
