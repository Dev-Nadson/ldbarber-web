"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle } from "lucide-react"
import z from "zod"

import { LIMITS } from "~/lib/constants"
import { maskPhoneInput, onlyDigits, today } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"

/** Espelha os `check` de `profiles`. */
const meusDadosSchema = z.object({
    nome: z
        .string()
        .trim()
        .min(2, "Informe seu nome.")
        .max(LIMITS.NOME_PESSOA, `No máximo ${LIMITS.NOME_PESSOA} caracteres.`),
    telefone: z.string().refine((value) => /^\d{10,11}$/.test(onlyDigits(value)), "Informe o WhatsApp com DDD."),
    nascimento: z
        .string()
        .refine((value) => !value || (value >= "1900-01-01" && value <= today()), "Confira a data de nascimento."),
    lembreteWhatsapp: z.boolean(),
})

export type MeusDadosFormValues = z.infer<typeof meusDadosSchema>

type MeusDadosFormProps = {
    defaultValues: MeusDadosFormValues
    email: string
    isPending: boolean
    onSubmit: (values: MeusDadosFormValues) => void
}

export function MeusDadosForm({ defaultValues, email, isPending, onSubmit }: MeusDadosFormProps) {
    const form = useForm<MeusDadosFormValues>({
        resolver: zodResolver(meusDadosSchema),
        defaultValues,
    })

    return (
        <form id="meus-dados-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                    name="nome"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="meus-dados-nome">Nome</FieldLabel>
                            <Input
                                {...field}
                                id="meus-dados-nome"
                                size="xl"
                                autoComplete="name"
                                maxLength={LIMITS.NOME_PESSOA}
                                disabled={isPending}
                                aria-invalid={fieldState.invalid}
                            />
                            <FieldError errors={[fieldState.error]} />
                        </Field>
                    )}
                />
                <Field>
                    <FieldLabel htmlFor="meus-dados-email">E-mail</FieldLabel>
                    <Input id="meus-dados-email" size="xl" value={email} disabled readOnly />
                </Field>
                <Controller
                    name="telefone"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="meus-dados-telefone">WhatsApp</FieldLabel>
                            <Input
                                {...field}
                                id="meus-dados-telefone"
                                type="tel"
                                size="xl"
                                inputMode="tel"
                                autoComplete="tel-national"
                                placeholder="(81) 99999-0000"
                                onChange={(event) => field.onChange(maskPhoneInput(event.target.value))}
                                disabled={isPending}
                                aria-invalid={fieldState.invalid}
                            />
                            <FieldError errors={[fieldState.error]} />
                        </Field>
                    )}
                />
                <Controller
                    name="nascimento"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="meus-dados-nascimento">Data de nascimento</FieldLabel>
                            <Input
                                {...field}
                                id="meus-dados-nascimento"
                                type="date"
                                size="xl"
                                max={today()}
                                disabled={isPending}
                                aria-invalid={fieldState.invalid}
                            />
                            <FieldError errors={[fieldState.error]} />
                        </Field>
                    )}
                />
            </div>

            <Controller
                name="lembreteWhatsapp"
                control={form.control}
                render={({ field }) => (
                    <Field orientation="horizontal">
                        <Checkbox
                            id="meus-dados-lembrete"
                            checked={field.value}
                            onCheckedChange={(checked) => field.onChange(checked === true)}
                            disabled={isPending}
                        />
                        <FieldLabel htmlFor="meus-dados-lembrete">Quero lembrete do horário pelo WhatsApp</FieldLabel>
                    </Field>
                )}
            />
            <FieldDescription className="-mt-3">A barbearia manda um lembrete antes do seu horário.</FieldDescription>

            <Button type="submit" variant="chrome" size="lg" className="self-start" disabled={isPending}>
                {isPending && <LoaderCircle className="animate-spin" />}
                Salvar dados
            </Button>
        </form>
    )
}
