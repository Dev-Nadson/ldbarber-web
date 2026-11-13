"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CreditCard, Undo2 } from "lucide-react"
import { toast } from "sonner"

import { useConfiguracao } from "~/hooks/use-configuracao"
import { FormaPagamentoLabels, PeriodicidadeLabels, Periodicidades, Situacoes } from "~/lib/constants"
import { describeMutationError } from "~/lib/errors"
import { proximoVencimento, situacaoAssinatura, valorPeriodo } from "~/lib/plano"
import { QUERIES, invalidateAssinaturas } from "~/lib/queries"
import { formatCurrency, formatDay, formatTimestamp, today } from "~/lib/utils"
import {
    cancelAssinatura,
    createAssinatura,
    desfazerCancelamento,
    getAssinaturaDoCliente,
    updateAssinatura,
} from "~/services/assinaturas"
import { createMensalidade, estornarMensalidade, listMensalidades, type Mensalidade } from "~/services/mensalidades"
import { listPlanos } from "~/services/planos"
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
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog"
import { Skeleton } from "~/components/ui/skeleton"
import { Selo, SituacaoBadge } from "~/components/badges"
import { DataField, Section } from "~/components/detail-section"
import { AssinaturaForm, type AssinaturaFormValues } from "~/components/forms/assinatura-form"
import { MensalidadeForm, type MensalidadeFormValues } from "~/components/forms/mensalidade-form"

type Acao = "abrir" | "trocar" | "pagar" | "encerrar" | "desfazer" | null

/**
 * O plano do cliente na gestão. O pagamento é na casa: abrir o plano deixa `solicitada`, o
 * primeiro pagamento ativa e cada pagamento empurra o vencimento (`mensalidades_criar`).
 */
export function ClientePlano({ clienteId }: { clienteId: string }) {
    const queryClient = useQueryClient()
    const { data: configuracao } = useConfiguracao()
    const [acao, setAcao] = useState<Acao>(null)
    const [estornar, setEstornar] = useState<Mensalidade | null>(null)

    const { data: assinatura, isPending: carregando } = useQuery({
        queryKey: [QUERIES.GET_ASSINATURA_CLIENTE, { clienteId }],
        queryFn: () => getAssinaturaDoCliente({ clienteId }),
    })
    const { data: planos } = useQuery({
        queryKey: [QUERIES.LIST_PLANOS, { incluirInativos: false }],
        queryFn: () => listPlanos(),
    })
    const { data: mensalidades } = useQuery({
        queryKey: [QUERIES.LIST_MENSALIDADES, { assinaturaId: assinatura?.id }],
        queryFn: () => listMensalidades({ assinaturaId: assinatura!.id }),
        enabled: Boolean(assinatura),
    })

    const { mutateAsync, isPending } = useMutation({
        mutationFn: async (executar: () => Promise<unknown>) => {
            await executar()
        },
        onSuccess: () => {
            invalidateAssinaturas(queryClient)
            setAcao(null)
            setEstornar(null)
        },
    })

    function executar(executarAcao: () => Promise<unknown>, mensagens: { loading: string; success: string }) {
        if (isPending) return

        toast.promise(mutateAsync(executarAcao), { ...mensagens, error: (error: unknown) => describeMutationError(error) })
    }

    const desconto = configuracao?.desconto_trimestral ?? 0
    const opcoesPlano = (planos ?? []).map((plano) => ({ value: plano.id, label: plano.nome, precoMensal: plano.preco_mensal }))
    const situacao = assinatura ? situacaoAssinatura(assinatura, today(), configuracao?.tolerancia_atraso_dias ?? 0) : null
    const ultimaPaga = mensalidades?.find((mensalidade) => !mensalidade.estornada)

    function abrir(values: AssinaturaFormValues) {
        executar(
            () =>
                createAssinatura({
                    clienteId,
                    planoId: values.planoId,
                    periodicidade: values.periodicidade,
                    diaVencimento: Number(values.diaVencimento),
                }),
            { loading: "Abrindo o plano...", success: "Plano aberto. Registre o primeiro pagamento para ativar." }
        )
    }

    function trocar(values: AssinaturaFormValues) {
        if (!assinatura) return

        executar(
            () =>
                updateAssinatura({
                    assinaturaId: assinatura.id,
                    planoId: values.planoId,
                    periodicidade: values.periodicidade,
                    diaVencimento: Number(values.diaVencimento),
                }),
            { loading: "Salvando o plano...", success: "Plano atualizado." }
        )
    }

    function pagar(values: MensalidadeFormValues) {
        if (!assinatura) return

        executar(() => createMensalidade({ assinaturaId: assinatura.id, formaPagamento: values.formaPagamento }), {
            loading: "Registrando o pagamento...",
            success: "Pagamento registrado.",
        })
    }

    return (
        <Section
            title="Plano"
            icon={<CreditCard className="size-4 text-neon-text" />}
            action={
                !carregando &&
                !assinatura && (
                    <Button variant="chrome" size="sm" disabled={!planos?.length} onClick={() => setAcao("abrir")}>
                        Abrir plano
                    </Button>
                )
            }
        >
            {carregando ? (
                <Skeleton className="h-40 w-full" />
            ) : !assinatura ? (
                <p className="text-sm text-muted-foreground">Cliente avulso. Abra um plano quando ele assinar na casa.</p>
            ) : (
                <>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="font-marca text-3xl">{assinatura.plano_nome}</span>
                        <SituacaoBadge situacao={situacao} />
                        {assinatura.encerra_em && <Selo variant="warning">Encerra em {formatDay(assinatura.encerra_em)}</Selo>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <DataField label="Valor">
                            {formatCurrency(valorPeriodo(assinatura.valor_mensal, assinatura.periodicidade, desconto))}
                            {assinatura.periodicidade === Periodicidades.TRIMESTRAL ? " / trimestre" : " / mês"}
                        </DataField>
                        <DataField label="Cobrança">{PeriodicidadeLabels[assinatura.periodicidade]}</DataField>
                        <DataField label="Vencimento">
                            {assinatura.dia_vencimento ? `Todo dia ${assinatura.dia_vencimento}` : "No primeiro pagamento"}
                        </DataField>
                        <DataField label="Pago até">{formatDay(assinatura.vence_em)}</DataField>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button variant="chrome" disabled={isPending || Boolean(assinatura.encerra_em)} onClick={() => setAcao("pagar")}>
                            {situacao === Situacoes.SOLICITADA ? "Registrar 1º pagamento" : "Registrar pagamento"}
                        </Button>
                        <Button variant="outline" disabled={isPending} onClick={() => setAcao("trocar")}>
                            Trocar plano
                        </Button>
                        {assinatura.encerra_em ? (
                            <Button variant="outline" disabled={isPending} onClick={() => setAcao("desfazer")}>
                                <Undo2 />
                                Desfazer cancelamento
                            </Button>
                        ) : (
                            <Button variant="ghost" className="text-danger" disabled={isPending} onClick={() => setAcao("encerrar")}>
                                Encerrar plano
                            </Button>
                        )}
                    </div>

                    {Boolean(mensalidades?.length) && (
                        <div>
                            <p className="letreiro mb-2 text-subtle">Pagamentos</p>
                            <ul className="divide-y rounded-md border">
                                {mensalidades?.map((mensalidade) => (
                                    <li key={mensalidade.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                                        <div className="min-w-0 flex-1">
                                            <p className={mensalidade.estornada ? "text-subtle line-through" : undefined}>
                                                {formatCurrency(mensalidade.valor)} · {FormaPagamentoLabels[mensalidade.forma_pagamento]}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatTimestamp(mensalidade.recebido_em)} · vale até {formatDay(mensalidade.periodo_fim)}
                                            </p>
                                        </div>
                                        {mensalidade.estornada ? (
                                            <Selo variant="secondary">Estornado</Selo>
                                        ) : (
                                            mensalidade.id === ultimaPaga?.id && (
                                                <Button variant="ghost" size="sm" disabled={isPending} onClick={() => setEstornar(mensalidade)}>
                                                    Estornar
                                                </Button>
                                            )
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            )}

            <Dialog open={acao === "abrir" || acao === "trocar"} onOpenChange={(aberto) => !aberto && setAcao(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{acao === "trocar" ? "Trocar plano" : "Abrir plano"}</DialogTitle>
                        <DialogDescription>
                            {acao === "trocar"
                                ? "O valor passa a ser o do plano escolhido, a partir do próximo pagamento."
                                : "O plano começa a valer quando o primeiro pagamento for registrado."}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody className="pb-5">
                        {(acao === "abrir" || acao === "trocar") && (
                            <AssinaturaForm
                                defaultValues={{
                                    planoId: acao === "trocar" ? (assinatura?.plano_id ?? "") : "",
                                    periodicidade: assinatura?.periodicidade ?? Periodicidades.MENSAL,
                                    diaVencimento: String(assinatura?.dia_vencimento ?? Math.min(Number(today().slice(8)), 28)),
                                }}
                                planos={opcoesPlano}
                                descontoTrimestral={desconto}
                                submitLabel={acao === "trocar" ? "Salvar" : "Abrir plano"}
                                isPending={isPending}
                                onSubmit={acao === "trocar" ? trocar : abrir}
                                onCancel={() => setAcao(null)}
                            />
                        )}
                    </DialogBody>
                </DialogContent>
            </Dialog>

            <Dialog open={acao === "pagar"} onOpenChange={(aberto) => !aberto && setAcao(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Registrar pagamento</DialogTitle>
                    </DialogHeader>
                    <DialogBody className="pb-5">
                        {acao === "pagar" && assinatura && (
                            <MensalidadeForm
                                resumo={
                                    <>
                                        <p className="font-display text-2xl tabular-nums">
                                            {formatCurrency(valorPeriodo(assinatura.valor_mensal, assinatura.periodicidade, desconto))}
                                        </p>
                                        <p className="text-muted-foreground">
                                            {assinatura.plano_nome} · vale até{" "}
                                            {formatDay(
                                                proximoVencimento({
                                                    venceEm: assinatura.vence_em,
                                                    diaVencimento: assinatura.dia_vencimento,
                                                    periodicidade: assinatura.periodicidade,
                                                    hoje: today(),
                                                })
                                            )}
                                        </p>
                                    </>
                                }
                                isPending={isPending}
                                onSubmit={pagar}
                                onCancel={() => setAcao(null)}
                            />
                        )}
                    </DialogBody>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={acao === "encerrar" || acao === "desfazer" || Boolean(estornar)}
                onOpenChange={(aberto) => {
                    if (aberto) return
                    setAcao(null)
                    setEstornar(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {estornar
                                ? `Estornar ${formatCurrency(estornar.valor)}?`
                                : acao === "desfazer"
                                  ? "Desfazer o cancelamento?"
                                  : `Encerrar o ${assinatura?.plano_nome} agora?`}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {estornar
                                ? "O pagamento sai do caixa e o plano volta ao vencimento anterior."
                                : acao === "desfazer"
                                  ? "O plano continua depois do vencimento, com as próximas cobranças."
                                  : "O plano deixa de valer hoje. O histórico de pagamentos continua."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogClose render={<Button type="button" variant="ghost" size="lg" />}>Voltar</AlertDialogClose>
                        <Button
                            type="button"
                            variant={acao === "desfazer" && !estornar ? "chrome" : "destructive"}
                            size="lg"
                            onClick={() => {
                                if (estornar) {
                                    executar(() => estornarMensalidade({ mensalidadeId: estornar.id }), {
                                        loading: "Estornando...",
                                        success: "Pagamento estornado.",
                                    })
                                } else if (assinatura && acao === "desfazer") {
                                    executar(() => desfazerCancelamento({ assinaturaId: assinatura.id }), {
                                        loading: "Desfazendo...",
                                        success: "Cancelamento desfeito.",
                                    })
                                } else if (assinatura) {
                                    executar(() => cancelAssinatura({ assinaturaId: assinatura.id }), {
                                        loading: "Encerrando...",
                                        success: `${assinatura.plano_nome} encerrado.`,
                                    })
                                }
                            }}
                        >
                            {estornar ? "Estornar" : acao === "desfazer" ? "Desfazer" : "Encerrar"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Section>
    )
}
