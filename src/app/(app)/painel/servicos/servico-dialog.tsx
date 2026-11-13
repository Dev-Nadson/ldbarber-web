"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Pencil, Plus } from "lucide-react"
import { toast } from "sonner"

import { describeMutationError } from "~/lib/errors"
import { invalidateServicos } from "~/lib/queries"
import { parseCurrency, toCurrencyInput } from "~/lib/utils"
import { createServico, updateServico, type Servico } from "~/services/servicos"
import { Button } from "~/components/ui/button"
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "~/components/ui/tooltip"
import { ServicoForm, type ServicoFormValues } from "~/components/forms/servico-form"

type ServicoDialogProps = {
    /** Sem serviço, o diálogo cadastra um novo. */
    servico?: Servico
}

export function ServicoDialog({ servico }: ServicoDialogProps) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)

    const { mutateAsync, isPending } = useMutation({
        mutationFn: async (values: ServicoFormValues) => {
            const input = {
                nome: values.nome.trim(),
                descricao: values.descricao.trim() || null,
                duracaoMin: Number(values.duracao),
                preco: parseCurrency(values.preco),
                categorias: values.categorias,
                ordem: Number(values.ordem),
                ativo: values.ativo,
            }

            if (servico) {
                await updateServico({ servicoId: servico.id, ...input })
                return
            }

            await createServico(input)
        },
        onSuccess: () => {
            invalidateServicos(queryClient)
            setOpen(false)
        },
    })

    function handleSubmit(values: ServicoFormValues) {
        if (isPending) return

        toast.promise(mutateAsync(values), {
            loading: "Salvando serviço...",
            success: `${values.nome.trim()} salvo.`,
            error: (error: unknown) => describeMutationError(error),
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {servico ? (
                <Tooltip>
                    <TooltipTrigger
                        render={<DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Editar ${servico.nome}`} />} />}
                    >
                        <Pencil />
                    </TooltipTrigger>
                    <TooltipContent>Editar</TooltipContent>
                </Tooltip>
            ) : (
                <DialogTrigger render={<Button variant="chrome" size="lg" />}>
                    <Plus />
                    Novo serviço
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{servico ? "Editar serviço" : "Novo serviço"}</DialogTitle>
                </DialogHeader>
                <DialogBody className="pb-5">
                    {/* Remonta a cada abertura para começar dos valores atuais. */}
                    {open && (
                        <ServicoForm
                            defaultValues={
                                servico && {
                                    nome: servico.nome,
                                    descricao: servico.descricao ?? "",
                                    duracao: String(servico.duracao_min),
                                    preco: toCurrencyInput(servico.preco),
                                    categorias: servico.categorias,
                                    ordem: String(servico.ordem),
                                    ativo: servico.ativo,
                                }
                            }
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
