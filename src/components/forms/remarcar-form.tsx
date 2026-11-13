"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle } from "lucide-react"
import z from "zod"

import type { SelectOption } from "~/lib/constants"
import { Button } from "~/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"

const remarcarSchema = z.object({
    dia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe o dia."),
    hora: z.string().regex(/^\d{2}:\d{2}$/, "Informe a hora."),
    barbeiroId: z.string().min(1, "Escolha o barbeiro."),
})

export type RemarcarFormValues = z.infer<typeof remarcarSchema>

type RemarcarFormProps = {
    defaultValues: RemarcarFormValues
    barbeiros: SelectOption<string>[]
    /** Só a gestão passa o horário para outro barbeiro. */
    podeTrocarBarbeiro: boolean
    isPending: boolean
    onSubmit: (values: RemarcarFormValues) => void
    onCancel: () => void
}

export function RemarcarForm({ defaultValues, barbeiros, podeTrocarBarbeiro, isPending, onSubmit, onCancel }: RemarcarFormProps) {
    const form = useForm<RemarcarFormValues>({
        resolver: zodResolver(remarcarSchema),
        defaultValues,
    })

    return (
        <form id="remarcar-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
                <Controller
                    name="dia"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="remarcar-dia">Dia</FieldLabel>
                            <Input {...field} id="remarcar-dia" type="date" size="xl" disabled={isPending} aria-invalid={fieldState.invalid} />
                            <FieldError errors={[fieldState.error]} />
                        </Field>
                    )}
                />
                <Controller
                    name="hora"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="remarcar-hora">Hora</FieldLabel>
                            <Input {...field} id="remarcar-hora" type="time" step={300} size="xl" disabled={isPending} aria-invalid={fieldState.invalid} />
                            <FieldError errors={[fieldState.error]} />
                        </Field>
                    )}
                />
            </div>
            <Controller
                name="barbeiroId"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="remarcar-barbeiro">Barbeiro</FieldLabel>
                        <Select
                            items={barbeiros}
                            value={field.value}
                            onValueChange={(value) => value && field.onChange(value)}
                            disabled={isPending || !podeTrocarBarbeiro}
                        >
                            <SelectTrigger id="remarcar-barbeiro" size="xl">
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
                        <FieldDescription>O preço e o plano continuam os do dia em que foi marcado.</FieldDescription>
                    </Field>
                )}
            />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" size="lg" disabled={isPending} onClick={onCancel}>
                    Voltar
                </Button>
                <Button type="submit" variant="chrome" size="lg" disabled={isPending}>
                    {isPending && <LoaderCircle className="animate-spin" />}
                    Remarcar
                </Button>
            </div>
        </form>
    )
}
