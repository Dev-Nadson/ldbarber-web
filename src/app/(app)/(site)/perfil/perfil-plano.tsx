"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Copy } from "lucide-react"
import { toast } from "sonner"

import { useConfiguracao } from "~/hooks/use-configuracao"
import { useMeuPlano } from "~/hooks/use-meu-plano"
import { Situacoes } from "~/lib/constants"
import { describeMutationError } from "~/lib/errors"
import { invalidateAssinaturas } from "~/lib/queries"
import { formatDay } from "~/lib/utils"
import { cancelAssinatura } from "~/services/assinaturas"
import {
    AlertDialog,
    AlertDialogClose,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "~/components/ui/alert-dialog"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import { Section } from "~/components/detail-section"
import { PlanoResumo } from "~/components/plano-resumo"

/**
 * O plano do cliente. Cancelar o pedido (ainda não pago) é na hora; cancelar o plano ativo
 * agenda o fim para o vencimento, porque o período já está pago (`assinaturas_protect`).
 */
export function PerfilPlano() {
    const queryClient = useQueryClient()
    const { data: configuracao } = useConfiguracao()
    const { assinatura, situacao, uso, isPending: carregando } = useMeuPlano()
    const [open, setOpen] = useState(false)

    const { mutateAsync, isPending } = useMutation({
        mutationFn: cancelAssinatura,
        onSuccess: () => invalidateAssinaturas(queryClient),
    })

    if (carregando) {
        return (
            <Section title="Meu plano">
                <Skeleton className="h-32 w-full" />
            </Section>
        )
    }

    if (!assinatura) {
        return (
            <Section title="Meu plano">
                <p className="text-sm text-muted-foreground">Você não tem plano. Assinantes têm cortes inclusos e prioridade na agenda.</p>
                <Button variant="outline" className="self-start" render={<Link href="/planos" />}>
                    Ver planos
                </Button>
            </Section>
        )
    }

    const solicitada = situacao === Situacoes.SOLICITADA

    function cancelar() {
        if (isPending || !assinatura) return

        toast.promise(mutateAsync({ assinaturaId: assinatura.id }), {
            loading: "Cancelando...",
            success: solicitada
                ? "Pedido do plano cancelado."
                : `Cancelamento agendado. O plano vale até ${formatDay(assinatura.vence_em)}.`,
            error: (error: unknown) => describeMutationError(error),
        })
        setOpen(false)
    }

    function copiarPix() {
        if (!configuracao?.chave_pix) return

        navigator.clipboard
            .writeText(configuracao.chave_pix)
            .then(() => toast.success("Chave Pix copiada."))
            .catch(() => toast.error("Não deu para copiar. Selecione a chave e copie."))
    }

    return (
        <Section title="Meu plano">
            <PlanoResumo assinatura={assinatura} situacao={situacao} uso={uso} />

            {configuracao?.chave_pix && (
                <div className="flex flex-col gap-2 rounded-md border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <p className="letreiro text-subtle">Chave Pix da casa</p>
                        <p className="truncate font-mono text-sm">{configuracao.chave_pix}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={copiarPix}>
                        <Copy />
                        Copiar
                    </Button>
                </div>
            )}

            {!assinatura.encerra_em && (
                <AlertDialog open={open} onOpenChange={setOpen}>
                    <AlertDialogTrigger
                        render={<Button variant="ghost" size="sm" className="self-start text-muted-foreground" disabled={isPending} />}
                    >
                        {solicitada ? "Cancelar pedido" : "Cancelar plano"}
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{solicitada ? "Cancelar o pedido do plano?" : `Cancelar o ${assinatura.plano_nome}?`}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {solicitada
                                    ? "O pedido sai da fila da barbearia. Dá para pedir de novo quando quiser."
                                    : `O período já pago continua valendo: o plano encerra em ${formatDay(assinatura.vence_em)} e não há nova cobrança.`}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogClose render={<Button type="button" variant="ghost" size="lg" />}>Manter</AlertDialogClose>
                            <Button type="button" variant="destructive" size="lg" onClick={cancelar}>
                                {solicitada ? "Cancelar pedido" : "Cancelar plano"}
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </Section>
    )
}
