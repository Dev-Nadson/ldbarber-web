"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle } from "lucide-react"
import z from "zod"

import { FORMA_PAGAMENTO_OPTIONS, FormasPagamento } from "~/lib/constants"
import { Button } from "~/components/ui/button"
import { Field, FieldError, FieldLabel } from "~/components/ui/field"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"

const mensalidadeSchema = z.object({
    formaPagamento: z.enum([FormasPagamento.PIX, FormasPagamento.CREDITO, FormasPagamento.DEBITO, FormasPagamento.DINHEIRO], {
        error: "Escolha a forma de pagamento.",
    }),
})

export type MensalidadeFormValues = z.infer<typeof mensalidadeSchema>

type MensalidadeFormProps = {
    /** O que vai ser registrado ("R$ 149,00 · vale até 10/12/2026"), calculado pela prévia. */
    resumo: React.ReactNode
    isPending: boolean
    onSubmit: (values: MensalidadeFormValues) => void
    onCancel: () => void
}

/** Registrar o pagamento do plano. Valor e vencimento são do `mensalidades_criar`. */
export function MensalidadeForm({ resumo, isPending, onSubmit, onCancel }: MensalidadeFormProps) {
    const form = useForm<MensalidadeFormValues>({
        resolver: zodResolver(mensalidadeSchema),
        defaultValues: { formaPagamento: FormasPagamento.PIX },
    })

    return (
        <form id="mensalidade-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="rounded-md bg-surface-2 px-4 py-3 text-sm">{resumo}</div>
            <Controller
                name="formaPagamento"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="mensalidade-forma">Forma de pagamento</FieldLabel>
                        <Select items={FORMA_PAGAMENTO_OPTIONS} value={field.value} onValueChange={(value) => value && field.onChange(value)} disabled={isPending}>
                            <SelectTrigger id="mensalidade-forma" size="xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {FORMA_PAGAMENTO_OPTIONS.map((item) => (
                                    <SelectItem key={item.value} value={item.value}>
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FieldError errors={[fieldState.error]} />
                    </Field>
                )}
            />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" size="lg" disabled={isPending} onClick={onCancel}>
                    Voltar
                </Button>
                <Button type="submit" variant="chrome" size="lg" disabled={isPending}>
                    {isPending && <LoaderCircle className="animate-spin" />}
                    Registrar pagamento
                </Button>
            </div>
        </form>
    )
}
