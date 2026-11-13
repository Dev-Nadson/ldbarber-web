"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle } from "lucide-react"
import z from "zod"

import { LIMITS, type SelectOption } from "~/lib/constants"
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
import { Textarea } from "~/components/ui/textarea"

/** Sem barbeiro preferido. */
export const SEM_PREFERIDO = "nenhum"

/** Espelha os `check` de `fichas`. */
const fichaSchema = z.object({
    apelido: z.string().trim().max(LIMITS.APELIDO, `No máximo ${LIMITS.APELIDO} caracteres.`),
    barbeiroPreferidoId: z.string(),
    observacoes: z.string().trim().max(LIMITS.OBSERVACOES_FICHA, `No máximo ${LIMITS.OBSERVACOES_FICHA} caracteres.`),
})

export type FichaFormValues = z.infer<typeof fichaSchema>

type FichaFormProps = {
    defaultValues: FichaFormValues
    barbeiros: SelectOption<string>[]
    isPending: boolean
    onSubmit: (values: FichaFormValues) => void
}

/** As anotações da casa sobre o cliente. Só a equipe vê; o cliente, não. */
export function FichaForm({ defaultValues, barbeiros, isPending, onSubmit }: FichaFormProps) {
    const form = useForm<FichaFormValues>({
        resolver: zodResolver(fichaSchema),
        defaultValues,
    })
    const opcoes = [{ value: SEM_PREFERIDO, label: "Sem preferência" }, ...barbeiros]

    return (
        <form id="ficha-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                    name="apelido"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="ficha-apelido">Apelido na casa</FieldLabel>
                            <Input {...field} id="ficha-apelido" size="xl" maxLength={LIMITS.APELIDO} disabled={isPending} aria-invalid={fieldState.invalid} />
                            <FieldError errors={[fieldState.error]} />
                        </Field>
                    )}
                />
                <Controller
                    name="barbeiroPreferidoId"
                    control={form.control}
                    render={({ field }) => (
                        <Field>
                            <FieldLabel htmlFor="ficha-barbeiro">Barbeiro preferido</FieldLabel>
                            <Select items={opcoes} value={field.value} onValueChange={(value) => value && field.onChange(value)} disabled={isPending}>
                                <SelectTrigger id="ficha-barbeiro" size="xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {opcoes.map((item) => (
                                        <SelectItem key={item.value} value={item.value}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    )}
                />
            </div>
            <Controller
                name="observacoes"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="ficha-observacoes">Observações</FieldLabel>
                        <Textarea
                            {...field}
                            id="ficha-observacoes"
                            size="xl"
                            maxLength={LIMITS.OBSERVACOES_FICHA}
                            placeholder="Ex.: pente 2 nas laterais, alergia a pomada X…"
                            disabled={isPending}
                            aria-invalid={fieldState.invalid}
                        />
                        {fieldState.error ? (
                            <FieldError errors={[fieldState.error]} />
                        ) : (
                            <FieldDescription>Aparece para o barbeiro no detalhe do horário.</FieldDescription>
                        )}
                    </Field>
                )}
            />
            <Button type="submit" variant="chrome" size="lg" className="self-start" disabled={isPending}>
                {isPending && <LoaderCircle className="animate-spin" />}
                Salvar ficha
            </Button>
        </form>
    )
}
