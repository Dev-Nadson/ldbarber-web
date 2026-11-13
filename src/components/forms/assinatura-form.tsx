"use client"

import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle } from "lucide-react"
import z from "zod"

import { Periodicidades, PeriodicidadeLabels, type SelectOption } from "~/lib/constants"
import { valorPeriodo } from "~/lib/plano"
import { formatCurrency } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"

const DIAS_VENCIMENTO: SelectOption<string>[] = Array.from({ length: 28 }, (_, index) => ({
    value: String(index + 1),
    label: `Todo dia ${index + 1}`,
}))

const PERIODICIDADE_OPTIONS = Object.values(Periodicidades).map((value) => ({ value, label: PeriodicidadeLabels[value] }))

const assinaturaSchema = z.object({
    planoId: z.string().min(1, "Escolha o plano."),
    periodicidade: z.enum([Periodicidades.MENSAL, Periodicidades.TRIMESTRAL]),
    diaVencimento: z.string().regex(/^([1-9]|1\d|2[0-8])$/, "Escolha o dia."),
})

export type AssinaturaFormValues = z.infer<typeof assinaturaSchema>

export type PlanoOpcao = SelectOption<string> & {
    precoMensal: number
}

type AssinaturaFormProps = {
    defaultValues: AssinaturaFormValues
    planos: PlanoOpcao[]
    descontoTrimestral: number
    submitLabel: string
    isPending: boolean
    onSubmit: (values: AssinaturaFormValues) => void
    onCancel: () => void
}

/** Abrir ou trocar o plano de um cliente (gestão). O valor final é o do `assinaturas_protect`. */
export function AssinaturaForm({ defaultValues, planos, descontoTrimestral, submitLabel, isPending, onSubmit, onCancel }: AssinaturaFormProps) {
    const form = useForm<AssinaturaFormValues>({
        resolver: zodResolver(assinaturaSchema),
        defaultValues,
    })

    const [planoId, periodicidade] = useWatch({ control: form.control, name: ["planoId", "periodicidade"] })
    const plano = planos.find((item) => item.value === planoId)

    return (
        <form id="assinatura-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Controller
                name="planoId"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="assinatura-plano">Plano</FieldLabel>
                        <Select items={planos} value={field.value || null} onValueChange={(value) => field.onChange(value ?? "")} disabled={isPending}>
                            <SelectTrigger id="assinatura-plano" size="xl" aria-invalid={fieldState.invalid}>
                                <SelectValue placeholder="Escolha" />
                            </SelectTrigger>
                            <SelectContent>
                                {planos.map((item) => (
                                    <SelectItem key={item.value} value={item.value}>
                                        {item.label} · {formatCurrency(item.precoMensal)}/mês
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FieldError errors={[fieldState.error]} />
                    </Field>
                )}
            />
            <div className="grid grid-cols-2 gap-4">
                <Controller
                    name="periodicidade"
                    control={form.control}
                    render={({ field }) => (
                        <Field>
                            <FieldLabel htmlFor="assinatura-periodicidade">Cobrança</FieldLabel>
                            <Select
                                items={PERIODICIDADE_OPTIONS}
                                value={field.value}
                                onValueChange={(value) => value && field.onChange(value)}
                                disabled={isPending}
                            >
                                <SelectTrigger id="assinatura-periodicidade" size="xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PERIODICIDADE_OPTIONS.map((item) => (
                                        <SelectItem key={item.value} value={item.value}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    )}
                />
                <Controller
                    name="diaVencimento"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="assinatura-vencimento">Vencimento</FieldLabel>
                            <Select items={DIAS_VENCIMENTO} value={field.value} onValueChange={(value) => value && field.onChange(value)} disabled={isPending}>
                                <SelectTrigger id="assinatura-vencimento" size="xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DIAS_VENCIMENTO.map((item) => (
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
            </div>
            {plano && (
                <FieldDescription>
                    {formatCurrency(valorPeriodo(plano.precoMensal, periodicidade, descontoTrimestral))}
                    {periodicidade === Periodicidades.TRIMESTRAL ? " a cada 3 meses" : " por mês"}, pago na casa.
                </FieldDescription>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" size="lg" disabled={isPending} onClick={onCancel}>
                    Voltar
                </Button>
                <Button type="submit" variant="chrome" size="lg" disabled={isPending}>
                    {isPending && <LoaderCircle className="animate-spin" />}
                    {submitLabel}
                </Button>
            </div>
        </form>
    )
}
