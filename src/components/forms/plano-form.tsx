"use client"

import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"

import { CATEGORIA_OPTIONS, Categorias, LIMITS, type Categoria } from "~/lib/constants"
import type { Cota } from "~/lib/plano"
import { parseCurrency } from "~/lib/utils"
import type { CotaInput } from "~/services/planos"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import { Switch } from "~/components/ui/switch"
import { Textarea } from "~/components/ui/textarea"
import { CurrencyInput } from "~/components/currency-input"

export const TiposCota = {
    NAO: "nao",
    ILIMITADO: "ilimitado",
    LIMITE: "limite",
} as const

type TipoCota = (typeof TiposCota)[keyof typeof TiposCota]

const TIPO_COTA_OPTIONS = [
    { value: TiposCota.NAO, label: "Não cobre" },
    { value: TiposCota.LIMITE, label: "Por mês" },
    { value: TiposCota.ILIMITADO, label: "Ilimitado" },
]

const cotaSchema = z
    .object({
        tipo: z.enum([TiposCota.NAO, TiposCota.ILIMITADO, TiposCota.LIMITE]),
        limite: z.string(),
    })
    .refine((cota) => cota.tipo !== TiposCota.LIMITE || /^([1-9]|[1-9]\d)$/.test(cota.limite), {
        message: "De 1 a 99.",
        path: ["limite"],
    })

/** Uma linha por benefício, como aparece no cartão. */
function linhas(value: string) {
    return value
        .split("\n")
        .map((linha) => linha.trim())
        .filter(Boolean)
}

/** Espelha os `check` de `planos` e `plano_cotas`. */
const planoSchema = z.object({
    nome: z
        .string()
        .trim()
        .min(2, "Informe o nome.")
        .max(LIMITS.PLANO_NOME, `No máximo ${LIMITS.PLANO_NOME} caracteres.`),
    resumo: z.string().trim().max(LIMITS.PLANO_RESUMO, `No máximo ${LIMITS.PLANO_RESUMO} caracteres.`),
    preco: z.string().refine((value) => parseCurrency(value) > 0, "Informe o preço por mês."),
    beneficios: z.string().refine((value) => linhas(value).length <= LIMITS.PLANO_LINHAS, `No máximo ${LIMITS.PLANO_LINHAS} linhas.`),
    naoInclui: z.string().refine((value) => linhas(value).length <= LIMITS.PLANO_LINHAS, `No máximo ${LIMITS.PLANO_LINHAS} linhas.`),
    cotas: z.object({
        [Categorias.CORTE]: cotaSchema,
        [Categorias.BARBA]: cotaSchema,
        [Categorias.PIGMENTACAO]: cotaSchema,
    }),
    destaque: z.boolean(),
    ativo: z.boolean(),
    ordem: z.string().refine((value) => /^\d{1,4}$/.test(value.trim()), "Use um número de 0 a 9999."),
})

export type PlanoFormValues = z.infer<typeof planoSchema>

export function toCotasValues(cotas: Cota[]): PlanoFormValues["cotas"] {
    const valor = (categoria: Categoria) => {
        const cota = cotas.find((item) => item.categoria === categoria)

        if (!cota) return { tipo: TiposCota.NAO, limite: "" }
        if (cota.limite === null) return { tipo: TiposCota.ILIMITADO, limite: "" }

        return { tipo: TiposCota.LIMITE, limite: String(cota.limite) }
    }

    return {
        [Categorias.CORTE]: valor(Categorias.CORTE),
        [Categorias.BARBA]: valor(Categorias.BARBA),
        [Categorias.PIGMENTACAO]: valor(Categorias.PIGMENTACAO),
    }
}

export function toPlanoInput(values: PlanoFormValues) {
    const cotas: CotaInput[] = CATEGORIA_OPTIONS.flatMap(({ value: categoria }) => {
        const cota = values.cotas[categoria]

        if (cota.tipo === TiposCota.NAO) return []

        return [{ categoria, limite: cota.tipo === TiposCota.ILIMITADO ? null : Number(cota.limite) }]
    })

    return {
        nome: values.nome.trim(),
        resumo: values.resumo.trim() || null,
        precoMensal: parseCurrency(values.preco),
        beneficios: linhas(values.beneficios),
        naoInclui: linhas(values.naoInclui),
        destaque: values.destaque,
        ativo: values.ativo,
        ordem: Number(values.ordem),
        cotas,
    }
}

type PlanoFormProps = {
    defaultValues: PlanoFormValues
    isPending: boolean
    rootError: string | null
    onSubmit: (values: PlanoFormValues) => void
    onNomeChange?: (nome: string) => void
}

/**
 * O plano: vitrine (nome, preço, linhas do cartão) e as cotas, que é o que vale no
 * `agendamentos_criar`. Os botões ficam no cartão ao lado (`form="plano-form"`).
 */
export function PlanoForm({ defaultValues, isPending, rootError, onSubmit, onNomeChange }: PlanoFormProps) {
    const form = useForm<PlanoFormValues>({
        resolver: zodResolver(planoSchema),
        defaultValues,
    })

    const cotas = useWatch({ control: form.control, name: "cotas" })

    return (
        <form id="plano-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 rounded-lg border bg-card p-5">
            <section className="flex flex-col gap-4">
                <h2 className="font-display text-base font-semibold tracking-wide uppercase">Vitrine</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Controller
                        name="nome"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="plano-nome">Nome</FieldLabel>
                                <Input
                                    {...field}
                                    id="plano-nome"
                                    size="xl"
                                    maxLength={LIMITS.PLANO_NOME}
                                    disabled={isPending}
                                    aria-invalid={fieldState.invalid}
                                    onChange={(event) => {
                                        field.onChange(event.target.value)
                                        onNomeChange?.(event.target.value)
                                    }}
                                />
                                <FieldError errors={[fieldState.error]} />
                            </Field>
                        )}
                    />
                    <Controller
                        name="preco"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="plano-preco">Preço por mês</FieldLabel>
                                <CurrencyInput {...field} id="plano-preco" size="xl" placeholder="R$ 0,00" disabled={isPending} aria-invalid={fieldState.invalid} />
                                {fieldState.error ? (
                                    <FieldError errors={[fieldState.error]} />
                                ) : (
                                    <FieldDescription>Quem já assina continua com o preço que assinou.</FieldDescription>
                                )}
                            </Field>
                        )}
                    />
                </div>
                <Controller
                    name="resumo"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="plano-resumo">Resumo</FieldLabel>
                            <Input {...field} id="plano-resumo" size="xl" maxLength={LIMITS.PLANO_RESUMO} placeholder="Ex.: Cortes ilimitados" disabled={isPending} aria-invalid={fieldState.invalid} />
                            <FieldError errors={[fieldState.error]} />
                        </Field>
                    )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                    <Controller
                        name="beneficios"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="plano-beneficios">Inclui (uma por linha)</FieldLabel>
                                <Textarea {...field} id="plano-beneficios" size="xl" className="min-h-28" disabled={isPending} aria-invalid={fieldState.invalid} />
                                <FieldError errors={[fieldState.error]} />
                            </Field>
                        )}
                    />
                    <Controller
                        name="naoInclui"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="plano-nao-inclui">Não inclui (riscado)</FieldLabel>
                                <Textarea {...field} id="plano-nao-inclui" size="xl" className="min-h-28" disabled={isPending} aria-invalid={fieldState.invalid} />
                                <FieldError errors={[fieldState.error]} />
                            </Field>
                        )}
                    />
                </div>
            </section>

            <section className="flex flex-col gap-3">
                <div>
                    <h2 className="font-display text-base font-semibold tracking-wide uppercase">Cotas</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        É o que vale de verdade: o serviço entra no plano se todas as categorias dele tiverem cota no mês.
                    </p>
                </div>
                <ul className="flex flex-col divide-y rounded-md border">
                    {CATEGORIA_OPTIONS.map(({ value: categoria, label }) => (
                        <li key={categoria} className="flex flex-wrap items-center gap-3 px-3 py-3">
                            <span className="w-28 font-medium">{label}</span>
                            <Controller
                                name={`cotas.${categoria}.tipo`}
                                control={form.control}
                                render={({ field }) => (
                                    <Select
                                        items={TIPO_COTA_OPTIONS}
                                        value={field.value}
                                        onValueChange={(value) => value && field.onChange(value as TipoCota)}
                                        disabled={isPending}
                                    >
                                        <SelectTrigger aria-label={`Cota de ${label}`} className="w-36">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIPO_COTA_OPTIONS.map((item) => (
                                                <SelectItem key={item.value} value={item.value}>
                                                    {item.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {cotas[categoria].tipo === TiposCota.LIMITE && (
                                <Controller
                                    name={`cotas.${categoria}.limite`}
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                {...field}
                                                inputMode="numeric"
                                                aria-label={`${label} por mês`}
                                                className="w-20"
                                                disabled={isPending}
                                                aria-invalid={fieldState.invalid}
                                            />
                                            <span className="text-sm text-muted-foreground">por mês</span>
                                            <FieldError errors={[fieldState.error]} />
                                        </div>
                                    )}
                                />
                            )}
                        </li>
                    ))}
                </ul>
            </section>

            <section className="grid gap-4 sm:grid-cols-3 sm:items-end">
                <Controller
                    name="ordem"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="plano-ordem">Ordem</FieldLabel>
                            <Input {...field} id="plano-ordem" size="xl" inputMode="numeric" disabled={isPending} aria-invalid={fieldState.invalid} />
                            <FieldError errors={[fieldState.error]} />
                        </Field>
                    )}
                />
                <Controller
                    name="destaque"
                    control={form.control}
                    render={({ field }) => (
                        <Field orientation="horizontal" className="pb-3">
                            <Switch id="plano-destaque" checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                            <FieldLabel htmlFor="plano-destaque">“Mais escolhido”</FieldLabel>
                        </Field>
                    )}
                />
                <Controller
                    name="ativo"
                    control={form.control}
                    render={({ field }) => (
                        <Field orientation="horizontal" className="pb-3">
                            <Switch id="plano-ativo" checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                            <FieldLabel htmlFor="plano-ativo">No site</FieldLabel>
                        </Field>
                    )}
                />
            </section>

            {rootError && <FieldError>{rootError}</FieldError>}
        </form>
    )
}
