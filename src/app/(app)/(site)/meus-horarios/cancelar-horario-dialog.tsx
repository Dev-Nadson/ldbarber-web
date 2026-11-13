"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { describeMutationError } from "~/lib/errors"
import { invalidateAgendamentos } from "~/lib/queries"
import { dateKeyOf, formatShortDay, formatTime } from "~/lib/utils"
import { cancelAgendamento, type Agendamento } from "~/services/agendamentos"
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

type CancelarHorarioDialogProps = {
    agendamento: Agendamento
}

export function CancelarHorarioDialog({ agendamento }: CancelarHorarioDialogProps) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const quando = `${formatShortDay(dateKeyOf(agendamento.inicio))}, ${formatTime(agendamento.inicio)}`

    const { mutateAsync, isPending } = useMutation({
        mutationFn: cancelAgendamento,
        onSuccess: () => invalidateAgendamentos(queryClient),
    })

    function cancelar() {
        if (isPending) return

        toast.promise(mutateAsync({ agendamentoId: agendamento.id }), {
            loading: "Cancelando...",
            success: `Horário de ${quando} cancelado.`,
            error: (error: unknown) => describeMutationError(error),
        })
        setOpen(false)
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger render={<Button variant="outline" size="sm" disabled={isPending} />}>Cancelar</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar o horário de {quando}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {agendamento.servico_nome} com {agendamento.barbeiro_nome}. O horário volta a ficar livre para outra pessoa.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogClose render={<Button type="button" variant="ghost" size="lg" />}>Manter</AlertDialogClose>
                    <Button type="button" variant="destructive" size="lg" onClick={cancelar}>
                        Cancelar horário
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
