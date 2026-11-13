"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

import { describeDeleteError } from "~/lib/errors"
import { invalidatePlanos } from "~/lib/queries"
import { deletePlano, type Plano } from "~/services/planos"
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

export function DeletePlanoDialog({ plano }: { plano: Plano }) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)

    const { mutateAsync, isPending } = useMutation({
        mutationFn: deletePlano,
        onSuccess: () => invalidatePlanos(queryClient),
    })

    function excluir() {
        if (isPending) return

        toast.promise(mutateAsync({ planoId: plano.id }), {
            loading: "Excluindo...",
            success: `${plano.nome} excluído.`,
            error: (error: unknown) =>
                describeDeleteError(error, `${plano.nome} já foi assinado. Tire do site em vez de excluir.`),
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
                                    aria-label={`Excluir ${plano.nome}`}
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
                    <AlertDialogTitle>Excluir {plano.nome}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Só dá para excluir plano que ninguém assinou. Para parar de vender, edite e desligue “No site”: quem assina continua.
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
