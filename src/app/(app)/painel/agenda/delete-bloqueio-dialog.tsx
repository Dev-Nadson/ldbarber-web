"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { X } from "lucide-react"
import { toast } from "sonner"

import { describeMutationError } from "~/lib/errors"
import { invalidateBloqueios } from "~/lib/queries"
import { formatTime } from "~/lib/utils"
import { deleteBloqueio, type Bloqueio } from "~/services/bloqueios"
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

export function DeleteBloqueioDialog({ bloqueio }: { bloqueio: Bloqueio }) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)

    const { mutateAsync, isPending } = useMutation({
        mutationFn: deleteBloqueio,
        onSuccess: () => invalidateBloqueios(queryClient),
    })

    function liberar() {
        if (isPending) return

        toast.promise(mutateAsync({ bloqueioId: bloqueio.id }), {
            loading: "Liberando...",
            success: "Período liberado na agenda.",
            error: (error: unknown) => describeMutationError(error),
        })
        setOpen(false)
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger
                render={<Button variant="ghost" size="icon-xs" aria-label="Liberar o período" className="text-muted-foreground" disabled={isPending} />}
            >
                <X />
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Liberar {bloqueio.motivo ?? "o bloqueio"}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Das {formatTime(bloqueio.inicio)} às {formatTime(bloqueio.fim)}: o período volta a aceitar horários.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogClose render={<Button type="button" variant="ghost" size="lg" />}>Manter</AlertDialogClose>
                    <Button type="button" variant="destructive" size="lg" onClick={liberar}>
                        Liberar
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
