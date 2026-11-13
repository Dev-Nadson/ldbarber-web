"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle } from "lucide-react"
import z from "zod"

import { CATEGORIA_OPTIONS, Categorias, LIMITS } from "~/lib/constants"
import { parseCurrency } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { Switch } from "~/components/ui/switch"
import { CurrencyInput } from "~/components/currency-input"

/** Espelha os `check` de `servicos`. */
const servicoSchema = z.object({
    nome: z
        .string()
        .trim()
        .min(2, "Informe o nome.")
        .max(LIMITS.SERVICO_NOME, `No máximo ${LIMITS.SERVICO_NOME} caracteres.`),
    descricao: z.string().trim().max(LIMITS.SERVICO_DESCRICAO, `No máximo ${LIMITS.SERVICO_DESCRICAO} caracteres.`),
    duracao: z.string().refine((value) => {
        const minutos = Number(value)

        return Number.isInteger(minutos) && minutos >= 5 && minutos <= 480 && minutos % 5 === 0
    }, "De 5 em 5 minutos, até 480."),
    preco: z.string().refine((value) => {
        const numero = parseCurrency(value)

        return Number.isFinite(numero) && numero >= 0
    }, "Informe o preço."),
    categorias: z.array(z.enum([Categorias.CORTE, Categorias.BARBA, Categorias.PIGMENTACAO])),
    ordem: z.string().refine((value) => /^\d{1,4}$/.test(value.trim()), "Use um número de 0 a 9999."),
    ativo: z.boolean(),
})

export type ServicoFormValues = z.infer<typeof servicoSchema>

type ServicoFormProps = {
    defaultValues?: ServicoFormValues
    isPending: boolean
    onSubmit: (values: ServicoFormValues) => void
    onCancel: () => void
}

export function ServicoForm({ defaultValues, isPending, onSubmit, onCancel }: ServicoFormProps) {
    const form = useForm<ServicoFormValues>({
        resolver: zodResolver(servicoSchema),
        defaultValues: defaultValues ?? { nome: "", descricao: "", duracao: "30", preco: "", categorias: [], ordem: "0", ativo: true },
    })

    return (
        <form id="servico-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Controller
                name="nome"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="servico-nome">Nome</FieldLabel>
                        <Input {...field} id="servico-nome" size="xl" maxLength={LIMITS.SERVICO_NOME} placeholder="Ex.: Corte degradê" disabled={isPending} aria-invalid={fieldState.invalid} />
                        <FieldError errors={[fieldState.error]} />
                    </Field>
                )}
            />
            <div className="grid grid-cols-2 gap-4">
                <Controller
                    name="duracao"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="servico-duracao">Duração (min)</FieldLabel>
                            <Input {...field} id="servico-duracao" size="xl" type="number" step={5} min={5} max={480} disabled={isPending} aria-invalid={fieldState.invalid} />
                            <FieldError errors={[fieldState.error]} />
                        </Field>
                    )}
                />
                <Controller
                    name="preco"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="servico-preco">Preço</FieldLabel>
                            <CurrencyInput {...field} id="servico-preco" size="xl" placeholder="R$ 0,00" disabled={isPending} aria-invalid={fieldState.invalid} />
                            <FieldError errors={[fieldState.error]} />
                        </Field>
                    )}
                />
            </div>
            <Controller
                name="categorias"
                control={form.control}
                render={({ field }) => (
                    <Field>
                        <FieldLabel>Entra na cota do plano como</FieldLabel>
                        <div className="flex flex-wrap gap-x-5 gap-y-2">
                            {CATEGORIA_OPTIONS.map((opcao) => (
                                <label key={opcao.value} className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={field.value.includes(opcao.value)}
                                        onCheckedChange={(checked) =>
                                            field.onChange(
                                                checked === true
                                                    ? [...field.value, opcao.value]
                                                    : field.value.filter((categoria) => categoria !== opcao.value)
                                            )
                                        }
                                        disabled={isPending}
                                    />
                                    {opcao.label}
                                </label>
                            ))}
                        </div>
                        <FieldDescription>“Corte + Barba” marca os dois. Sem nenhum, o serviço nunca entra no plano.</FieldDescription>
                    </Field>
                )}
            />
            <Controller
                name="descricao"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="servico-descricao">Descrição</FieldLabel>
                        <Input {...field} id="servico-descricao" size="xl" maxLength={LIMITS.SERVICO_DESCRICAO} placeholder="Opcional" disabled={isPending} aria-invalid={fieldState.invalid} />
                        <FieldError errors={[fieldState.error]} />
                    </Field>
                )}
            />
            <div className="grid grid-cols-2 items-end gap-4">
                <Controller
                    name="ordem"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="servico-ordem">Ordem</FieldLabel>
                            <Input {...field} id="servico-ordem" size="xl" inputMode="numeric" disabled={isPending} aria-invalid={fieldState.invalid} />
                            <FieldError errors={[fieldState.error]} />
                        </Field>
                    )}
                />
                <Controller
                    name="ativo"
                    control={form.control}
                    render={({ field }) => (
                        <Field orientation="horizontal" className="pb-3">
                            <Switch id="servico-ativo" checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                            <FieldLabel htmlFor="servico-ativo">No site</FieldLabel>
                        </Field>
                    )}
                />
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" size="lg" disabled={isPending} onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" variant="chrome" size="lg" disabled={isPending}>
                    {isPending && <LoaderCircle className="animate-spin" />}
                    Salvar
                </Button>
            </div>
        </form>
    )
}
