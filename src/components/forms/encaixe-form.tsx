"use client"

import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle } from "lucide-react"
import z from "zod"

import { LIMITS, type SelectOption } from "~/lib/constants"
import { cn } from "~/lib/utils"
import type { ClienteBusca as Cliente } from "~/services/clientes"
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
import { ClienteBusca } from "~/components/cliente-busca"

const encaixeSchema = z.object({
    clienteId: z.string().min(1, "Escolha o cliente."),
    barbeiroId: z.string().min(1, "Escolha o barbeiro."),
    servicoId: z.string().min(1, "Escolha o serviço."),
    dia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe o dia."),
    hora: z.string().regex(/^\d{2}:\d{2}$/, "Informe a hora."),
    observacao: z
        .string()
        .max(LIMITS.OBSERVACAO_AGENDAMENTO, `No máximo ${LIMITS.OBSERVACAO_AGENDAMENTO} caracteres.`),
})

export type EncaixeFormValues = z.infer<typeof encaixeSchema>

type Escolha = Pick<EncaixeFormValues, "dia" | "barbeiroId" | "servicoId">

type EncaixeFormProps = {
    defaultValues: EncaixeFormValues
    clientePreset: Cliente | null
    barbeiros: SelectOption<string>[]
    servicos: SelectOption<string>[]
    /** Horários livres do barbeiro no dia, para tocar e preencher. */
    sugestoes: string[]
    isPending: boolean
    /** Avisa a tela quando dia, barbeiro ou serviço mudam (as sugestões dependem deles). */
    onEscolha: (escolha: Escolha) => void
    onSubmit: (values: EncaixeFormValues) => void
    onCancel: () => void
}

export function EncaixeForm({
    defaultValues,
    clientePreset,
    barbeiros,
    servicos,
    sugestoes,
    isPending,
    onEscolha,
    onSubmit,
    onCancel,
}: EncaixeFormProps) {
    const [cliente, setCliente] = useState<Cliente | null>(clientePreset)
    const form = useForm<EncaixeFormValues>({
        resolver: zodResolver(encaixeSchema),
        defaultValues,
    })

    function avisar(campo: keyof Escolha, valor: string) {
        const { dia, barbeiroId, servicoId } = form.getValues()

        onEscolha({ dia, barbeiroId, servicoId, [campo]: valor })
    }

    return (
        <form id="encaixe-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex max-w-2xl flex-col gap-5 rounded-lg border bg-card p-5">
            <Controller
                name="clienteId"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="encaixe-cliente">Cliente</FieldLabel>
                        <ClienteBusca
                            id="encaixe-cliente"
                            value={cliente}
                            disabled={isPending}
                            invalid={fieldState.invalid}
                            onChange={(escolhido) => {
                                setCliente(escolhido)
                                field.onChange(escolhido?.id ?? "")
                            }}
                        />
                        <FieldError errors={[fieldState.error]} />
                    </Field>
                )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                    name="servicoId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="encaixe-servico">Serviço</FieldLabel>
                            <Select
                                items={servicos}
                                value={field.value || null}
                                onValueChange={(value) => {
                                    field.onChange(value ?? "")
                                    avisar("servicoId", value ?? "")
                                }}
                                disabled={isPending}
                            >
                                <SelectTrigger id="encaixe-servico" size="xl" aria-invalid={fieldState.invalid}>
                                    <SelectValue placeholder="Escolha" />
                                </SelectTrigger>
                                <SelectContent>
                                    {servicos.map((item) => (
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
                <Controller
                    name="barbeiroId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="encaixe-barbeiro">Barbeiro</FieldLabel>
                            <Select
                                items={barbeiros}
                                value={field.value || null}
                                onValueChange={(value) => {
                                    field.onChange(value ?? "")
                                    avisar("barbeiroId", value ?? "")
                                }}
                                disabled={isPending || barbeiros.length === 1}
                            >
                                <SelectTrigger id="encaixe-barbeiro" size="xl" aria-invalid={fieldState.invalid}>
                                    <SelectValue placeholder="Escolha" />
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
                <Controller
                    name="dia"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="encaixe-dia">Dia</FieldLabel>
                            <Input
                                {...field}
                                id="encaixe-dia"
                                type="date"
                                size="xl"
                                disabled={isPending}
                                aria-invalid={fieldState.invalid}
                                onChange={(event) => {
                                    field.onChange(event.target.value)
                                    if (/^\d{4}-\d{2}-\d{2}$/.test(event.target.value)) avisar("dia", event.target.value)
                                }}
                            />
                            <FieldError errors={[fieldState.error]} />
                        </Field>
                    )}
                />
                <Controller
                    name="hora"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="encaixe-hora">Hora</FieldLabel>
                            <Input {...field} id="encaixe-hora" type="time" step={300} size="xl" disabled={isPending} aria-invalid={fieldState.invalid} />
                            <FieldError errors={[fieldState.error]} />
                        </Field>
                    )}
                />
            </div>

            <Controller
                name="hora"
                control={form.control}
                render={({ field }) =>
                    sugestoes.length ? (
                        <Field>
                            <FieldDescription>Livres na grade (toque para usar):</FieldDescription>
                            <div className="flex flex-wrap gap-1.5">
                                {sugestoes.map((hora) => (
                                    <button
                                        key={hora}
                                        type="button"
                                        onClick={() => field.onChange(hora)}
                                        className={cn(
                                            "h-8 rounded-md border px-2.5 font-display text-sm tabular-nums",
                                            field.value === hora ? "border-primary bg-primary text-primary-foreground" : "bg-surface-2 hover:border-line-strong"
                                        )}
                                    >
                                        {hora}
                                    </button>
                                ))}
                            </div>
                        </Field>
                    ) : (
                        <></>
                    )
                }
            />

            <Controller
                name="observacao"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="encaixe-observacao">Observação</FieldLabel>
                        <Textarea
                            {...field}
                            id="encaixe-observacao"
                            size="xl"
                            maxLength={LIMITS.OBSERVACAO_AGENDAMENTO}
                            placeholder="Opcional"
                            disabled={isPending}
                            aria-invalid={fieldState.invalid}
                        />
                        <FieldError errors={[fieldState.error]} />
                    </Field>
                )}
            />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" size="lg" disabled={isPending} onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" variant="chrome" size="lg" disabled={isPending}>
                    {isPending && <LoaderCircle className="animate-spin" />}
                    Marcar horário
                </Button>
            </div>
        </form>
    )
}
