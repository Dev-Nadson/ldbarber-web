"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

import { describeDeleteError } from "~/lib/errors"
import { invalidateServicos } from "~/lib/queries"
import { deleteServico, type Servico } from "~/services/servicos"
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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "~/components/ui/tooltip"

export function DeleteServicoDialog({ servico }: { servico: Servico }) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)

    const { mutateAsync, isPending } = useMutation({
        mutationFn: deleteServico,
        onSuccess: () => invalidateServicos(queryClient),
    })

    function excluir() {
        if (isPending) return

        toast.promise(mutateAsync({ servicoId: servico.id }), {
            loading: "Excluindo...",
            success: `${servico.nome} excluído.`,
            error: (error: unknown) =>
                describeDeleteError(error, `${servico.nome} não pode sair agora. Tire do site em vez de excluir.`),
        })
        setOpen(false)
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger
                    render={
                        <AlertDialogTrigger
                            render={
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={`Excluir ${servico.nome}`}
                                    className="text-muted-foreground hover:text-destructive"
                                    disabled={isPending}
                                />
                            }
                        />
                    }
                >
                    <Trash2 />
                </TooltipTrigger>
                <TooltipContent>Excluir</TooltipContent>
            </Tooltip>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir {servico.nome}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Os horários já marcados guardam o nome e o preço: o histórico não muda. Para só esconder do site, edite e desligue “No site”.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogClose render={<Button type="button" variant="ghost" size="lg" />}>Cancelar</AlertDialogClose>
                    <Button type="button" variant="destructive" size="lg" onClick={excluir}>
                        Excluir
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
