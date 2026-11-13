"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useConfiguracao } from "~/hooks/use-configuracao"
import { useSession } from "~/hooks/use-session"
import { PeriodicidadeLabels, Situacoes, type Periodicidade, type Situacao } from "~/lib/constants"
import { describeMutationError } from "~/lib/errors"
import { buildWhatsAppUrl } from "~/lib/mensagem"
import { valorPeriodo } from "~/lib/plano"
import { invalidateAssinaturas } from "~/lib/queries"
import { formatCurrency } from "~/lib/utils"
import { createAssinatura, type MinhaAssinatura } from "~/services/assinaturas"
import type { Plano } from "~/services/planos"
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

type AssinarButtonProps = {
    plano: Plano
    periodicidade: Periodicidade
    assinatura: MinhaAssinatura | null
    situacao: Situacao | null
}

/**
 * "Assinar": sem login, vai para o cadastro e volta; com plano em andamento, mostra qual. O
 * pedido nasce `solicitada` e vale quando a casa registrar o primeiro pagamento.
 */
export function AssinarButton({ plano, periodicidade, assinatura, situacao }: AssinarButtonProps) {
    const queryClient = useQueryClient()
    const { data: session } = useSession()
    const { data: configuracao } = useConfiguracao()
    const [open, setOpen] = useState(false)
    const variant = plano.destaque ? "default" : "outline"

    const { mutateAsync, isPending } = useMutation({
        mutationFn: createAssinatura,
        onSuccess: () => invalidateAssinaturas(queryClient),
    })

    if (!session) {
        return (
            <Button variant={variant} size="xl" className="w-full" render={<Link href="/cadastrar?redirect=/planos" />}>
                Assinar {plano.nome}
            </Button>
        )
    }

    if (assinatura) {
        const meu = assinatura.plano_id === plano.id

        return (
            <Button variant="outline" size="xl" className="w-full" disabled>
                {meu ? (situacao === Situacoes.SOLICITADA ? "Pedido enviado" : "Seu plano") : "Você já tem um plano"}
            </Button>
        )
    }

    const valor = valorPeriodo(plano.preco_mensal, periodicidade, configuracao?.desconto_trimestral ?? 0)

    function assinar() {
        if (isPending) return

        toast.promise(mutateAsync({ planoId: plano.id, periodicidade }), {
            loading: "Enviando o pedido...",
            success: `Pedido do plano ${plano.nome} enviado. Pague na barbearia para ativar.`,
            error: (error: unknown) => describeMutationError(error),
        })
        setOpen(false)
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger render={<Button variant={variant} size="xl" className="w-full" disabled={isPending} />}>
                Assinar {plano.nome}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Assinar o {plano.nome}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {PeriodicidadeLabels[periodicidade]}: {formatCurrency(valor)}
                        {periodicidade === "trimestral" ? " a cada 3 meses" : " por mês"}. O pagamento é feito na barbearia
                        (Pix, cartão ou dinheiro). O plano começa a valer assim que a casa registrar o primeiro pagamento.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {configuracao?.whatsapp && (
                    <a
                        href={buildWhatsAppUrl(
                            configuracao.whatsapp,
                            `Olá! Quero assinar o plano ${plano.nome} (${PeriodicidadeLabels[periodicidade].toLowerCase()}).`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-neon-text hover:underline"
                    >
                        Tirar dúvidas pelo WhatsApp
                    </a>
                )}
                <AlertDialogFooter>
                    <AlertDialogClose render={<Button type="button" variant="ghost" size="lg" />}>Agora não</AlertDialogClose>
                    <Button type="button" size="lg" onClick={assinar}>
                        Pedir o plano
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
