"use client"

import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle } from "lucide-react"
import z from "zod"

import { FORMA_PAGAMENTO_OPTIONS, type FormaPagamento } from "~/lib/constants"
import { parseCurrency } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import { CurrencyInput } from "~/components/currency-input"

/** Igual ao `agendamentos_protect`: valor recebido ≥ 0 e, se houve cobrança, a forma. */
const concluirSchema = z
    .object({
        valor: z.string().refine((value) => {
            const numero = parseCurrency(value || "0")

            return Number.isFinite(numero) && numero >= 0
        }, "Confira o valor."),
        formaPagamento: z.string(),
    })
    .refine((values) => parseCurrency(values.valor || "0") === 0 || Boolean(values.formaPagamento), {
        message: "Informe a forma de pagamento.",
        path: ["formaPagamento"],
    })

export type ConcluirFormValues = z.infer<typeof concluirSchema>

export function toConcluirInput(values: ConcluirFormValues) {
    const valorRecebido = parseCurrency(values.valor || "0")

    return {
        valorRecebido,
        formaPagamento: valorRecebido > 0 ? (values.formaPagamento as FormaPagamento) : null,
    }
}

type ConcluirFormProps = {
    defaultValues: ConcluirFormValues
    /** "Incluso no plano Soul": o valor esperado é zero. */
    planoNome: string | null
    isPending: boolean
    onSubmit: (values: ConcluirFormValues) => void
    onCancel: () => void
}

export function ConcluirForm({ defaultValues, planoNome, isPending, onSubmit, onCancel }: ConcluirFormProps) {
    const form = useForm<ConcluirFormValues>({
        resolver: zodResolver(concluirSchema),
        defaultValues,
    })

    const valor = useWatch({ control: form.control, name: "valor" })
    const semCobranca = parseCurrency(valor || "0") === 0

    return (
        <form id="concluir-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Controller
                name="valor"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="concluir-valor">Valor recebido</FieldLabel>
                        <CurrencyInput {...field} id="concluir-valor" size="xl" placeholder="R$ 0,00" disabled={isPending} aria-invalid={fieldState.invalid} />
                        {fieldState.error ? (
                            <FieldError errors={[fieldState.error]} />
                        ) : (
                            <FieldDescription>
                                {planoNome ? `Incluso no plano ${planoNome}: deixe zero.` : "Mude se houve desconto ou acréscimo."}
                            </FieldDescription>
                        )}
                    </Field>
                )}
            />
            <Controller
                name="formaPagamento"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="concluir-forma">Forma de pagamento</FieldLabel>
                        <Select
                            items={FORMA_PAGAMENTO_OPTIONS}
                            value={field.value || null}
                            onValueChange={(value) => field.onChange(value ?? "")}
                            disabled={isPending || semCobranca}
                        >
                            <SelectTrigger id="concluir-forma" size="xl" aria-invalid={fieldState.invalid}>
                                <SelectValue placeholder={semCobranca ? "Sem cobrança" : "Escolha"} />
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
                    Concluir atendimento
                </Button>
            </div>
        </form>
    )
}
