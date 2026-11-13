"use client"

import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle } from "lucide-react"
import z from "zod"

import { LIMITS, type SelectOption } from "~/lib/constants"
import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import { Field, FieldError, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"

/** Escolha "todos" no barbeiro: fecha a casa (um bloqueio por barbeiro). */
export const BLOQUEAR_TODOS = "todos"

const bloqueioSchema = z
    .object({
        barbeiroId: z.string().min(1, "Escolha o barbeiro."),
        diaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe o dia."),
        diaFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe o dia."),
        diaInteiro: z.boolean(),
        de: z.string(),
        ate: z.string(),
        motivo: z.string().trim().max(LIMITS.BLOQUEIO_MOTIVO, `No máximo ${LIMITS.BLOQUEIO_MOTIVO} caracteres.`),
    })
    .refine((values) => values.diaFim >= values.diaInicio, { message: "O fim vem depois do começo.", path: ["diaFim"] })
    .refine((values) => values.diaInteiro || /^\d{2}:\d{2}$/.test(values.de), { message: "Informe a hora.", path: ["de"] })
    .refine((values) => values.diaInteiro || /^\d{2}:\d{2}$/.test(values.ate), { message: "Informe a hora.", path: ["ate"] })
    .refine((values) => values.diaInteiro || values.diaFim > values.diaInicio || values.ate > values.de, {
        message: "O fim vem depois do começo.",
        path: ["ate"],
    })

export type BloqueioFormValues = z.infer<typeof bloqueioSchema>

type BloqueioFormProps = {
    defaultValues: BloqueioFormValues
    barbeiros: SelectOption<string>[]
    isPending: boolean
    onSubmit: (values: BloqueioFormValues) => void
    onCancel: () => void
}

export function BloqueioForm({ defaultValues, barbeiros, isPending, onSubmit, onCancel }: BloqueioFormProps) {
    const form = useForm<BloqueioFormValues>({
        resolver: zodResolver(bloqueioSchema),
        defaultValues,
    })

    const diaInteiro = useWatch({ control: form.control, name: "diaInteiro" })

    return (
        <form id="bloqueio-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Controller
                name="barbeiroId"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="bloqueio-barbeiro">Agenda</FieldLabel>
                        <Select
                            items={barbeiros}
                            value={field.value}
                            onValueChange={(value) => value && field.onChange(value)}
                            disabled={isPending || barbeiros.length === 1}
                        >
                            <SelectTrigger id="bloqueio-barbeiro" size="xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {barbeiros.map((item) => (
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
            <div className="grid grid-cols-2 gap-4">
                <Controller
                    name="diaInicio"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="bloqueio-dia-inicio">De (dia)</FieldLabel>
                            <Input {...field} id="bloqueio-dia-inicio" type="date" size="xl" disabled={isPending} aria-invalid={fieldState.invalid} />
                            <FieldError errors={[fieldState.error]} />
                        </Field>
                    )}
                />
                <Controller
                    name="diaFim"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="bloqueio-dia-fim">Até (dia)</FieldLabel>
                            <Input {...field} id="bloqueio-dia-fim" type="date" size="xl" disabled={isPending} aria-invalid={fieldState.invalid} />
                            <FieldError errors={[fieldState.error]} />
                        </Field>
                    )}
                />
            </div>
            <Controller
                name="diaInteiro"
                control={form.control}
                render={({ field }) => (
                    <Field orientation="horizontal">
                        <Checkbox
                            id="bloqueio-dia-inteiro"
                            checked={field.value}
                            onCheckedChange={(checked) => field.onChange(checked === true)}
                            disabled={isPending}
                        />
                        <FieldLabel htmlFor="bloqueio-dia-inteiro">Dia inteiro</FieldLabel>
                    </Field>
                )}
            />
            {!diaInteiro && (
                <div className="grid grid-cols-2 gap-4">
                    <Controller
                        name="de"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="bloqueio-de">Das</FieldLabel>
                                <Input {...field} id="bloqueio-de" type="time" step={300} size="xl" disabled={isPending} aria-invalid={fieldState.invalid} />
                                <FieldError errors={[fieldState.error]} />
                            </Field>
                        )}
                    />
                    <Controller
                        name="ate"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="bloqueio-ate">Às</FieldLabel>
                                <Input {...field} id="bloqueio-ate" type="time" step={300} size="xl" disabled={isPending} aria-invalid={fieldState.invalid} />
                                <FieldError errors={[fieldState.error]} />
                            </Field>
                        )}
                    />
                </div>
            )}
            <Controller
                name="motivo"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="bloqueio-motivo">Motivo</FieldLabel>
                        <Input
                            {...field}
                            id="bloqueio-motivo"
                            size="xl"
                            maxLength={LIMITS.BLOQUEIO_MOTIVO}
                            placeholder="Folga, feriado, médico..."
                            disabled={isPending}
                            aria-invalid={fieldState.invalid}
                        />
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
                    Bloquear
                </Button>
            </div>
        </form>
    )
}
