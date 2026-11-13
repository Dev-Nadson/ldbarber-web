"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Ban, CalendarClock, CircleCheck, UserX } from "lucide-react"
import { toast } from "sonner"

import { useAgora } from "~/hooks/use-agora"
import { useSession } from "~/hooks/use-session"
import { AgendamentoStatuses, FormaPagamentoLabels, isGestao } from "~/lib/constants"
import { describeMutationError } from "~/lib/errors"
import { buildLembreteMensagem, buildWhatsAppUrl, whatsAppDoCliente } from "~/lib/mensagem"
import { QUERIES, invalidateAgendamentos } from "~/lib/queries"
import { dateKeyOf, formatCurrency, formatDuration, formatLongDay, formatPhone, formatTime, toCurrencyInput, toInstant, today } from "~/lib/utils"
import {
    cancelAgendamento,
    concluirAgendamento,
    marcarFalta,
    remarcarAgendamento,
    type Agendamento,
} from "~/services/agendamentos"
import type { Barbeiro } from "~/services/barbeiros"
import { getFicha } from "~/services/clientes"
import {
    AlertDialog,
    AlertDialogClose,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "~/components/ui/alert-dialog"
import { Button } from "~/components/ui/button"
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "~/components/ui/sheet"
import { AgendamentoStatusBadge, Selo } from "~/components/badges"
import { DataField } from "~/components/detail-section"
import { WhatsAppIcon } from "~/components/whatsapp-icon"
import { ConcluirForm, toConcluirInput, type ConcluirFormValues } from "~/components/forms/concluir-form"
import { RemarcarForm, type RemarcarFormValues } from "~/components/forms/remarcar-form"

type Acao = "concluir" | "remarcar" | "falta" | "cancelar" | null

type AgendaDetalheProps = {
    agendamento: Agendamento | null
    barbeiros: Barbeiro[]
    onClose: () => void
}

/**
 * O horário aberto na agenda: dados do cliente (com a ficha da casa), o lembrete pelo WhatsApp
 * e as ações. Quem pode o quê é o `agendamentos_protect`; aqui só se esconde o que não cabe.
 */
export function AgendaDetalhe({ agendamento, barbeiros, onClose }: AgendaDetalheProps) {
    const queryClient = useQueryClient()
    const { data: session } = useSession()
    const [acao, setAcao] = useState<Acao>(null)
    const agora = useAgora()
    const gestao = isGestao(session?.role)

    const { data: ficha } = useQuery({
        queryKey: [QUERIES.GET_FICHA, { clienteId: agendamento?.cliente_id }],
        queryFn: () => getFicha({ clienteId: agendamento!.cliente_id! }),
        enabled: Boolean(agendamento?.cliente_id),
    })

    const { mutateAsync, isPending } = useMutation({
        mutationFn: async (executar: () => Promise<void>) => executar(),
        onSuccess: () => {
            invalidateAgendamentos(queryClient)
            setAcao(null)
        },
    })

    function executar(executarAcao: () => Promise<void>, mensagens: { loading: string; success: string }) {
        if (isPending) return

        toast.promise(mutateAsync(executarAcao), {
            ...mensagens,
            error: (error: unknown) => describeMutationError(error),
        })
    }

    if (!agendamento) return <Sheet open={false} />

    const atual = agendamento
    const confirmado = atual.status === AgendamentoStatuses.CONFIRMADO
    const comecou = agora > 0 && Date.parse(atual.inicio) <= agora
    const dia = dateKeyOf(atual.inicio)
    const quando = `${formatLongDay(dia)}, ${formatTime(atual.inicio)}`

    function concluir(values: ConcluirFormValues) {
        executar(() => concluirAgendamento({ agendamentoId: atual.id, ...toConcluirInput(values) }), {
            loading: "Concluindo...",
            success: `Atendimento de ${atual.cliente_nome} concluído.`,
        })
    }

    function remarcar(values: RemarcarFormValues) {
        executar(
            () => remarcarAgendamento({ agendamentoId: atual.id, inicio: toInstant(values.dia, values.hora), barbeiroId: values.barbeiroId }),
            { loading: "Remarcando...", success: `Horário de ${atual.cliente_nome} remarcado.` }
        )
    }

    return (
        <>
            <Sheet open onOpenChange={(aberto) => !aberto && onClose()}>
                <SheetContent className="gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-md">
                    <SheetHeader className="border-b">
                        <SheetTitle className="font-display text-xl font-semibold tracking-wide uppercase">{atual.cliente_nome}</SheetTitle>
                        <SheetDescription>{quando}</SheetDescription>
                        <div className="flex flex-wrap gap-2 pt-1">
                            <AgendamentoStatusBadge status={atual.status} />
                            {atual.incluso_plano && <Selo variant="default">Plano {atual.plano_nome}</Selo>}
                            {atual.encaixe && <Selo variant="secondary">Encaixe</Selo>}
                        </div>
                    </SheetHeader>

                    <div className="flex flex-col gap-5 p-6">
                        <div className="grid grid-cols-2 gap-4">
                            <DataField label="Serviço">{atual.servico_nome}</DataField>
                            <DataField label="Barbeiro">{atual.barbeiro_nome}</DataField>
                            <DataField label="Duração">{formatDuration(atual.duracao_min)}</DataField>
                            <DataField label={atual.status === AgendamentoStatuses.CONCLUIDO ? "Recebido" : "A cobrar"}>
                                <span className="font-display text-lg tabular-nums">
                                    {formatCurrency(atual.valor_recebido ?? atual.valor)}
                                </span>
                                {atual.forma_pagamento && (
                                    <span className="text-muted-foreground"> · {FormaPagamentoLabels[atual.forma_pagamento]}</span>
                                )}
                            </DataField>
                            <DataField label="WhatsApp">{formatPhone(atual.cliente_telefone)}</DataField>
                            {ficha?.apelido && <DataField label="Apelido">{ficha.apelido}</DataField>}
                        </div>

                        {ficha?.observacoes && (
                            <div className="rounded-md border border-dashed px-3 py-2.5 text-sm">
                                <p className="letreiro mb-1 text-subtle">Preferências</p>
                                {ficha.observacoes}
                            </div>
                        )}
                        {atual.observacao && <DataField label="Observação do horário">{atual.observacao}</DataField>}

                        {atual.cliente_telefone && (
                            <div className="flex flex-wrap gap-2">
                                {confirmado && !comecou && (
                                    <Button
                                        variant="outline"
                                        render={
                                            <a
                                                href={buildWhatsAppUrl(whatsAppDoCliente(atual.cliente_telefone), buildLembreteMensagem(atual))}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            />
                                        }
                                    >
                                        <WhatsAppIcon className="size-4" />
                                        Enviar lembrete
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    render={
                                        <a href={buildWhatsAppUrl(whatsAppDoCliente(atual.cliente_telefone))} target="_blank" rel="noopener noreferrer" />
                                    }
                                >
                                    Conversar
                                </Button>
                                {gestao && atual.cliente_id && (
                                    <Button variant="ghost" render={<Link href={`/painel/clientes/${atual.cliente_id}`} />}>
                                        Ver cliente
                                    </Button>
                                )}
                            </div>
                        )}

                        {confirmado && (
                            <div className="flex flex-col gap-2 border-t pt-5">
                                <Button variant="chrome" size="lg" disabled={isPending || dia > today()} onClick={() => setAcao("concluir")}>
                                    <CircleCheck />
                                    Concluir e receber
                                </Button>
                                <div className="grid grid-cols-3 gap-2">
                                    <Button variant="outline" disabled={isPending} onClick={() => setAcao("remarcar")}>
                                        <CalendarClock />
                                        Remarcar
                                    </Button>
                                    <Button variant="outline" disabled={isPending || !comecou} onClick={() => setAcao("falta")}>
                                        <UserX />
                                        Faltou
                                    </Button>
                                    <Button variant="outline" disabled={isPending} onClick={() => setAcao("cancelar")} className="text-danger">
                                        <Ban />
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            <Dialog open={acao === "concluir"} onOpenChange={(aberto) => !aberto && setAcao(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Concluir atendimento</DialogTitle>
                    </DialogHeader>
                    <DialogBody className="pb-5">
                        {acao === "concluir" && (
                            <ConcluirForm
                                defaultValues={{ valor: toCurrencyInput(atual.valor), formaPagamento: "" }}
                                planoNome={atual.incluso_plano ? atual.plano_nome : null}
                                isPending={isPending}
                                onSubmit={concluir}
                                onCancel={() => setAcao(null)}
                            />
                        )}
                    </DialogBody>
                </DialogContent>
            </Dialog>

            <Dialog open={acao === "remarcar"} onOpenChange={(aberto) => !aberto && setAcao(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Remarcar horário</DialogTitle>
                    </DialogHeader>
                    <DialogBody className="pb-5">
                        {acao === "remarcar" && (
                            <RemarcarForm
                                defaultValues={{ dia, hora: formatTime(atual.inicio), barbeiroId: atual.barbeiro_id }}
                                barbeiros={barbeiros.map((barbeiro) => ({ value: barbeiro.id, label: barbeiro.nome }))}
                                podeTrocarBarbeiro={gestao}
                                isPending={isPending}
                                onSubmit={remarcar}
                                onCancel={() => setAcao(null)}
                            />
                        )}
                    </DialogBody>
                </DialogContent>
            </Dialog>

            <AlertDialog open={acao === "falta" || acao === "cancelar"} onOpenChange={(aberto) => !aberto && setAcao(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {acao === "falta" ? `Marcar falta de ${atual.cliente_nome}?` : `Cancelar o horário de ${atual.cliente_nome}?`}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {acao === "falta"
                                ? "O horário fica no histórico como falta. Se entrou no plano, conta na cota do mês."
                                : `${quando} volta a ficar livre na agenda.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogClose render={<Button type="button" variant="ghost" size="lg" />}>Voltar</AlertDialogClose>
                        <Button
                            type="button"
                            variant="destructive"
                            size="lg"
                            onClick={() =>
                                acao === "falta"
                                    ? executar(() => marcarFalta({ agendamentoId: atual.id }), {
                                          loading: "Marcando falta...",
                                          success: `Falta de ${atual.cliente_nome} registrada.`,
                                      })
                                    : executar(() => cancelAgendamento({ agendamentoId: atual.id }), {
                                          loading: "Cancelando...",
                                          success: `Horário de ${atual.cliente_nome} cancelado.`,
                                      })
                            }
                        >
                            {acao === "falta" ? "Marcar falta" : "Cancelar horário"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
