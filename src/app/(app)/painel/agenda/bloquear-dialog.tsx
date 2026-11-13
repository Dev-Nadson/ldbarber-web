"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useSession } from "~/hooks/use-session"
import { isGestao } from "~/lib/constants"
import { describeMutationError } from "~/lib/errors"
import { invalidateBloqueios } from "~/lib/queries"
import { addDays, toInstant } from "~/lib/utils"
import { createBloqueios } from "~/services/bloqueios"
import type { Barbeiro } from "~/services/barbeiros"
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog"
import { BLOQUEAR_TODOS, BloqueioForm, type BloqueioFormValues } from "~/components/forms/bloqueio-form"

type BloquearDialogProps = {
    dia: string
    barbeiros: Barbeiro[]
    trigger: React.ReactElement
}

/**
 * Tira um período da agenda (folga, feriado, compromisso). A gestão pode fechar a casa
 * ("Todos"); o barbeiro bloqueia só a dele. Bater num horário marcado volta o erro do banco.
 */
export function BloquearDialog({ dia, barbeiros, trigger }: BloquearDialogProps) {
    const queryClient = useQueryClient()
    const { data: session } = useSession()
    const [open, setOpen] = useState(false)
    const gestao = isGestao(session?.role)

    const opcoes = [
        ...(gestao && barbeiros.length > 1 ? [{ value: BLOQUEAR_TODOS, label: "Todos (fechar a casa)" }] : []),
        ...barbeiros.map((barbeiro) => ({ value: barbeiro.id, label: barbeiro.nome })),
    ]

    const { mutateAsync, isPending } = useMutation({
        mutationFn: (values: BloqueioFormValues) =>
            createBloqueios({
                barbeiroIds: values.barbeiroId === BLOQUEAR_TODOS ? barbeiros.map((barbeiro) => barbeiro.id) : [values.barbeiroId],
                inicio: toInstant(values.diaInicio, values.diaInteiro ? "00:00" : values.de),
                fim: values.diaInteiro ? toInstant(addDays(values.diaFim, 1), "00:00") : toInstant(values.diaFim, values.ate),
                motivo: values.motivo.trim() || null,
            }),
        onSuccess: () => {
            invalidateBloqueios(queryClient)
            setOpen(false)
        },
    })

    function handleSubmit(values: BloqueioFormValues) {
        if (isPending) return

        toast.promise(mutateAsync(values), {
            loading: "Bloqueando...",
            success: "Período bloqueado na agenda.",
            error: (error: unknown) => describeMutationError(error),
        })
    }

    if (!opcoes.length) return null

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={trigger} />
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Bloquear horário</DialogTitle>
                    <DialogDescription>Ninguém marca nesse período. Os horários já marcados precisam ser remarcados antes.</DialogDescription>
                </DialogHeader>
                <DialogBody className="pb-5">
                    {open && (
                        <BloqueioForm
                            defaultValues={{
                                barbeiroId: opcoes[0].value,
                                diaInicio: dia,
                                diaFim: dia,
                                diaInteiro: false,
                                de: "12:00",
                                ate: "13:00",
                                motivo: "",
                            }}
                            barbeiros={opcoes}
                            isPending={isPending}
                            onSubmit={handleSubmit}
                            onCancel={() => setOpen(false)}
                        />
                    )}
                </DialogBody>
            </DialogContent>
        </Dialog>
    )
}
