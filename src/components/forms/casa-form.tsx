"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle } from "lucide-react"
import z from "zod"

import { LIMITS } from "~/lib/constants"
import { maskPhoneInput, onlyDigits } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"

/** Espelha os `check` de `configuracoes` (a parte da casa). Tudo aqui é público. */
const casaSchema = z.object({
    endereco: z.string().trim().max(LIMITS.ENDERECO, `No máximo ${LIMITS.ENDERECO} caracteres.`),
    whatsapp: z.string().refine((value) => value === "" || /^\d{10,11}$/.test(onlyDigits(value)), "Número com DDD."),
    instagram: z
        .string()
        .trim()
        .refine((value) => value === "" || /^@?[A-Za-z0-9._]{1,30}$/.test(value), "Só o usuário, ex.: @ldbarber."),
    aviso: z.string().trim().max(LIMITS.AVISO, `No máximo ${LIMITS.AVISO} caracteres.`),
    chavePix: z.string().trim().max(LIMITS.CHAVE_PIX, `No máximo ${LIMITS.CHAVE_PIX} caracteres.`),
})

export type CasaFormValues = z.infer<typeof casaSchema>

type CasaFormProps = {
    defaultValues: CasaFormValues
    isPending: boolean
    onSubmit: (values: CasaFormValues) => void
}

export function CasaForm({ defaultValues, isPending, onSubmit }: CasaFormProps) {
    const form = useForm<CasaFormValues>({
        resolver: zodResolver(casaSchema),
        defaultValues,
    })

    return (
        <form id="casa-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                    name="whatsapp"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="casa-whatsapp">WhatsApp da casa</FieldLabel>
                            <Input
                                {...field}
                                id="casa-whatsapp"
                                type="tel"
                                size="xl"
                                inputMode="tel"
                                placeholder="(81) 99999-0000"
                                onChange={(event) => field.onChange(maskPhoneInput(event.target.value))}
                                disabled={isPending}
                                aria-invalid={fieldState.invalid}
                            />
                            {fieldState.error ? (
                                <FieldError errors={[fieldState.error]} />
                            ) : (
                                <FieldDescription>Aparece no site e em “Falar com a casa”.</FieldDescription>
                            )}
                        </Field>
                    )}
                />
                <Controller
                    name="instagram"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="casa-instagram">Instagram</FieldLabel>
                            <Input {...field} id="casa-instagram" size="xl" maxLength={31} placeholder="@ldbarber" disabled={isPending} aria-invalid={fieldState.invalid} />
                            <FieldError errors={[fieldState.error]} />
                        </Field>
                    )}
                />
            </div>
            <Controller
                name="endereco"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="casa-endereco">Endereço</FieldLabel>
                        <Input {...field} id="casa-endereco" size="xl" maxLength={LIMITS.ENDERECO} disabled={isPending} aria-invalid={fieldState.invalid} />
                        <FieldError errors={[fieldState.error]} />
                    </Field>
                )}
            />
            <Controller
                name="chavePix"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="casa-pix">Chave Pix</FieldLabel>
                        <Input {...field} id="casa-pix" size="xl" maxLength={LIMITS.CHAVE_PIX} disabled={isPending} aria-invalid={fieldState.invalid} />
                        {fieldState.error ? (
                            <FieldError errors={[fieldState.error]} />
                        ) : (
                            <FieldDescription>O assinante vê no Perfil, para pagar a mensalidade. É pública.</FieldDescription>
                        )}
                    </Field>
                )}
            />
            <Controller
                name="aviso"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="casa-aviso">Aviso no topo do site</FieldLabel>
                        <Input
                            {...field}
                            id="casa-aviso"
                            size="xl"
                            maxLength={LIMITS.AVISO}
                            placeholder="Ex.: Fechado no feriado de 15/11"
                            disabled={isPending}
                            aria-invalid={fieldState.invalid}
                        />
                        {fieldState.error ? <FieldError errors={[fieldState.error]} /> : <FieldDescription>Vazio, a faixa some.</FieldDescription>}
                    </Field>
                )}
            />
            <Button type="submit" variant="chrome" size="lg" className="self-start" disabled={isPending}>
                {isPending && <LoaderCircle className="animate-spin" />}
                Salvar
            </Button>
        </form>
    )
}
