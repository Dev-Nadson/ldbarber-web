"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { RoleLabels, isEquipe } from "~/lib/constants"
import { describeMutationError } from "~/lib/errors"
import { invalidateBarbeiros, invalidatePerfil } from "~/lib/queries"
import { createBarbeiro, updateBarbeiro, type BarbeiroDetalhe } from "~/services/barbeiros"
import { findProfileByEmail } from "~/services/profiles"
import { Selo } from "~/components/badges"
import { CadastroLateral } from "~/components/cadastro-lateral"
import {
    BarbeiroForm,
    DIAS_PADRAO,
    toDiasValues,
    toExpedientesInput,
    type BarbeiroFormValues,
} from "~/components/forms/barbeiro-form"

/** Erro de regra do formulário, com a mensagem pronta para aparecer embaixo dos campos. */
class BarbeiroError extends Error {}

/**
 * A conta que vê a agenda precisa existir e ser da equipe. Dar o papel é do admin (Ajustes →
 * Equipe); a gestão só liga a conta ao barbeiro.
 */
async function contaDoBarbeiro(email: string) {
    if (!email.trim()) return null

    const perfil = await findProfileByEmail({ email })

    if (!perfil) throw new BarbeiroError("Nenhuma conta com esse e-mail. A pessoa precisa criar a conta no site antes.")
    if (!isEquipe(perfil.role)) {
        throw new BarbeiroError(
            `${perfil.nome ?? email} é ${RoleLabels[perfil.role].toLowerCase()}. Peça ao admin para dar o papel de barbeiro em Ajustes → Equipe.`
        )
    }

    return perfil.id
}

type BarbeiroEditorProps = {
    /** Sem barbeiro, cadastra um novo. */
    barbeiro?: BarbeiroDetalhe
}

export function BarbeiroEditor({ barbeiro }: BarbeiroEditorProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [nome, setNome] = useState(barbeiro?.nome ?? "")
    const [rootError, setRootError] = useState<string | null>(null)

    const { mutateAsync, isPending } = useMutation({
        mutationFn: async (values: BarbeiroFormValues) => {
            const input = {
                nome: values.nome.trim(),
                especialidade: values.especialidade.trim() || null,
                ordem: Number(values.ordem),
                profileId: await contaDoBarbeiro(values.contaEmail),
                expedientes: toExpedientesInput(values.dias),
            }

            if (barbeiro) {
                await updateBarbeiro({ barbeiroId: barbeiro.id, ...input })
                return
            }

            await createBarbeiro(input)
        },
        onSuccess: () => {
            invalidateBarbeiros(queryClient)
            invalidatePerfil(queryClient)
        },
    })

    function handleSubmit(values: BarbeiroFormValues) {
        if (isPending) return

        setRootError(null)
        mutateAsync(values)
            .then(() => {
                toast.success(`${values.nome.trim()} salvo.`)
                router.push("/painel/barbeiros")
            })
            .catch((error: unknown) => setRootError(error instanceof BarbeiroError ? error.message : describeMutationError(error)))
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <BarbeiroForm
                defaultValues={{
                    nome: barbeiro?.nome ?? "",
                    especialidade: barbeiro?.especialidade ?? "",
                    ordem: String(barbeiro?.ordem ?? 0),
                    contaEmail: barbeiro?.conta?.email ?? "",
                    dias: barbeiro ? toDiasValues(barbeiro.expedientes) : DIAS_PADRAO,
                }}
                isPending={isPending}
                rootError={rootError}
                onSubmit={handleSubmit}
                onNomeChange={setNome}
            />
            <CadastroLateral
                formId="barbeiro-form"
                nome={nome}
                subtitulo={barbeiro ? "Barbeiro" : "Novo barbeiro"}
                selo={barbeiro?.conta ? <Selo variant="default">Com acesso ao painel</Selo> : <Selo variant="secondary">Sem conta</Selo>}
                cancelHref="/painel/barbeiros"
                salvarLabel="Salvar barbeiro"
                isPending={isPending}
            />
        </div>
    )
}
