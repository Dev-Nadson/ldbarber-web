"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useAgora } from "~/hooks/use-agora"
import { useSession } from "~/hooks/use-session"
import { isGestao } from "~/lib/constants"
import { disponibilidadeDoDia } from "~/lib/agenda"
import { describeMutationError } from "~/lib/errors"
import { QUERIES, invalidateAgendamentos } from "~/lib/queries"
import { addDays, formatShortDay, toInstant, today } from "~/lib/utils"
import { createAgendamento } from "~/services/agendamentos"
import { listBarbeiros, listExpedientes } from "~/services/barbeiros"
import { getCliente } from "~/services/clientes"
import { listOcupacoes } from "~/services/ocupacoes"
import { listServicos } from "~/services/servicos"
import { Skeleton } from "~/components/ui/skeleton"
import { EncaixeForm, type EncaixeFormValues } from "~/components/forms/encaixe-form"

type EncaixeViewProps = {
    diaInicial: string | null
    clienteInicial: string | null
}

export function EncaixeView({ diaInicial, clienteInicial }: EncaixeViewProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const { data: session } = useSession()
    const agora = useAgora()
    const gestao = isGestao(session?.role)
    // O que está escolhido no formulário, para sugerir os horários livres.
    const [escolha, setEscolha] = useState<{ dia: string; barbeiroId: string; servicoId: string }>({
        dia: diaInicial ?? today(),
        barbeiroId: "",
        servicoId: "",
    })

    const { data: barbeiros } = useQuery({
        queryKey: [QUERIES.LIST_BARBEIROS, { incluirInativos: false }],
        queryFn: () => listBarbeiros(),
    })
    const { data: servicos } = useQuery({
        queryKey: [QUERIES.LIST_SERVICOS, { incluirInativos: false }],
        queryFn: () => listServicos(),
    })
    const { data: expedientes } = useQuery({
        queryKey: [QUERIES.LIST_EXPEDIENTES],
        queryFn: () => listExpedientes(),
    })
    const { data: ocupacoes } = useQuery({
        queryKey: [QUERIES.LIST_OCUPACOES, { de: escolha.dia, ate: escolha.dia }],
        queryFn: () => listOcupacoes({ de: toInstant(escolha.dia, "00:00"), ate: toInstant(addDays(escolha.dia, 1), "00:00") }),
    })
    // Gestão chega do detalhe do cliente: lê o resumo (o barbeiro não tem acesso, e não precisa).
    const { data: clientePreset } = useQuery({
        queryKey: [QUERIES.GET_CLIENTE, { clienteId: clienteInicial }],
        queryFn: () => getCliente({ clienteId: clienteInicial! }),
        enabled: Boolean(clienteInicial && gestao),
    })

    // O barbeiro só encaixa na própria agenda.
    const opcoesBarbeiro = (barbeiros ?? []).filter((barbeiro) => gestao || barbeiro.id === session?.barbeiro_id)
    const servico = servicos?.find((item) => item.id === escolha.servicoId)

    const sugestoes = useMemo(() => {
        if (!expedientes || !ocupacoes || !escolha.barbeiroId || !agora) return []

        return (
            disponibilidadeDoDia({
                dia: escolha.dia,
                barbeiroIds: [escolha.barbeiroId],
                expedientes,
                ocupacoes,
                duracaoMin: servico?.duracao_min ?? 30,
                intervaloMin: 30,
                agora,
            })[0]
                ?.horarios.filter((horario) => horario.livre)
                .map((horario) => horario.hora) ?? []
        )
    }, [agora, escolha.barbeiroId, escolha.dia, expedientes, ocupacoes, servico?.duracao_min])

    const { mutateAsync, isPending } = useMutation({
        mutationFn: (values: EncaixeFormValues) =>
            createAgendamento({
                clienteId: values.clienteId,
                barbeiroId: values.barbeiroId,
                servicoId: values.servicoId,
                inicio: toInstant(values.dia, values.hora),
                observacao: values.observacao.trim() || null,
            }),
        onSuccess: (_, values) => {
            invalidateAgendamentos(queryClient)
            router.push(`/painel/agenda?dia=${values.dia}`)
        },
    })

    function handleSubmit(values: EncaixeFormValues) {
        if (isPending) return

        toast.promise(mutateAsync(values), {
            loading: "Marcando...",
            success: `Horário marcado: ${formatShortDay(values.dia)}, ${values.hora}.`,
            error: (error: unknown) => describeMutationError(error),
        })
    }

    if (!barbeiros || !servicos || (clienteInicial && gestao && !clientePreset)) return <Skeleton className="h-96 w-full max-w-2xl" />

    if (!opcoesBarbeiro.length) {
        return (
            <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                Sua conta ainda não está ligada a uma agenda. Peça para a gerência ligar em Barbeiros.
            </p>
        )
    }

    return (
        <EncaixeForm
            defaultValues={{
                clienteId: clientePreset?.id ?? "",
                barbeiroId: opcoesBarbeiro.length === 1 ? opcoesBarbeiro[0].id : "",
                servicoId: "",
                dia: escolha.dia,
                hora: "",
                observacao: "",
            }}
            clientePreset={clientePreset ? { id: clientePreset.id!, nome: clientePreset.nome, telefone: clientePreset.telefone, email: clientePreset.email } : null}
            barbeiros={opcoesBarbeiro.map((barbeiro) => ({ value: barbeiro.id, label: barbeiro.nome }))}
            servicos={servicos.map((item) => ({ value: item.id, label: `${item.nome} · ${item.duracao_min} min` }))}
            sugestoes={sugestoes}
            isPending={isPending}
            onEscolha={setEscolha}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/painel/agenda")}
        />
    )
}
