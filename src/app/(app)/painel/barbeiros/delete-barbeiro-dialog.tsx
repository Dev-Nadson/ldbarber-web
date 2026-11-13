"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

import { describeDeleteError } from "~/lib/errors"
import { invalidateBarbeiros } from "~/lib/queries"
import { deleteBarbeiro, type Barbeiro } from "~/services/barbeiros"
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

export function DeleteBarbeiroDialog({ barbeiro }: { barbeiro: Barbeiro }) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)

    const { mutateAsync, isPending } = useMutation({
        mutationFn: deleteBarbeiro,
        onSuccess: () => invalidateBarbeiros(queryClient),
    })

    function excluir() {
        if (isPending) return

        toast.promise(mutateAsync({ barbeiroId: barbeiro.id }), {
            loading: "Excluindo...",
            success: `${barbeiro.nome} excluído.`,
            error: (error: unknown) =>
                describeDeleteError(error, `${barbeiro.nome} já tem horários no histórico. Desative em vez de excluir.`),
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
                                    aria-label={`Excluir ${barbeiro.nome}`}
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
                    <AlertDialogTitle>Excluir {barbeiro.nome}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Só dá para excluir quem nunca teve horário marcado. Para tirar da agenda sem perder o histórico, desative.
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
