"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { describePlanoError } from "~/lib/errors"
import { invalidatePlanos } from "~/lib/queries"
import { toCurrencyInput } from "~/lib/utils"
import { createPlano, updatePlano, type Plano } from "~/services/planos"
import { CadastroLateral } from "~/components/cadastro-lateral"
import { PlanoForm, TiposCota, toCotasValues, toPlanoInput, type PlanoFormValues } from "~/components/forms/plano-form"

const COTAS_NOVO: PlanoFormValues["cotas"] = {
    corte: { tipo: TiposCota.LIMITE, limite: "2" },
    barba: { tipo: TiposCota.NAO, limite: "" },
    pigmentacao: { tipo: TiposCota.NAO, limite: "" },
}

type PlanoEditorProps = {
    /** Sem plano, cadastra um novo. */
    plano?: Plano
}

export function PlanoEditor({ plano }: PlanoEditorProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [nome, setNome] = useState(plano?.nome ?? "")
    const [rootError, setRootError] = useState<string | null>(null)

    const { mutateAsync, isPending } = useMutation({
        mutationFn: async (values: PlanoFormValues) => {
            const input = toPlanoInput(values)

            if (plano) {
                await updatePlano({ planoId: plano.id, ...input })
                return
            }

            await createPlano(input)
        },
        onSuccess: () => invalidatePlanos(queryClient),
    })

    function handleSubmit(values: PlanoFormValues) {
        if (isPending) return

        setRootError(null)
        mutateAsync(values)
            .then(() => {
                toast.success(`Plano ${values.nome.trim()} salvo.`)
                router.push("/painel/planos")
            })
            .catch((error: unknown) => setRootError(describePlanoError(error)))
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <PlanoForm
                defaultValues={{
                    nome: plano?.nome ?? "",
                    resumo: plano?.resumo ?? "",
                    preco: toCurrencyInput(plano?.preco_mensal),
                    beneficios: plano?.beneficios.join("\n") ?? "",
                    naoInclui: plano?.nao_inclui.join("\n") ?? "",
                    cotas: plano ? toCotasValues(plano.cotas) : COTAS_NOVO,
                    destaque: plano?.destaque ?? false,
                    ativo: plano?.ativo ?? true,
                    ordem: String(plano?.ordem ?? 0),
                }}
                isPending={isPending}
                rootError={rootError}
                onSubmit={handleSubmit}
                onNomeChange={setNome}
            />
            <CadastroLateral
                formId="plano-form"
                nome={nome}
                subtitulo={plano ? "Plano" : "Novo plano"}
                cancelHref="/painel/planos"
                salvarLabel="Salvar plano"
                isPending={isPending}
            />
        </div>
    )
}
