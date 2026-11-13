"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle } from "lucide-react"
import z from "zod"

import { INTERVALO_OPTIONS } from "~/lib/constants"
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

function inteiro(min: number, max: number) {
    return z.string().refine((value) => {
        const numero = Number(value)

        return Number.isInteger(numero) && numero >= min && numero <= max
    }, `De ${min} a ${max}.`)
}

/** Espelha os `check` de `configuracoes` (as regras). Quem aplica é o `agendamentos_criar`. */
const regrasSchema = z
    .object({
        intervaloMin: z.string(),
        antecedenciaAvulsoDias: inteiro(1, 90),
        antecedenciaAssinanteDias: inteiro(1, 90),
        cancelamentoMinHoras: inteiro(0, 72),
        maxAgendamentosAbertos: inteiro(1, 20),
        toleranciaAtrasoDias: inteiro(0, 30),
        descontoTrimestral: inteiro(0, 50),
    })
    .refine((values) => Number(values.antecedenciaAssinanteDias) >= Number(values.antecedenciaAvulsoDias), {
        message: "O assinante marca com pelo menos a mesma antecedência do avulso.",
        path: ["antecedenciaAssinanteDias"],
    })

export type RegrasFormValues = z.infer<typeof regrasSchema>

const INTERVALOS = INTERVALO_OPTIONS.map((minutos) => ({ value: String(minutos), label: `De ${minutos} em ${minutos} min` }))

type CampoNumero = Exclude<keyof RegrasFormValues, "intervaloMin">

const CAMPOS: { name: CampoNumero; label: string; sufixo: string; descricao: string }[] = [
    { name: "antecedenciaAvulsoDias", label: "Antecedência do avulso", sufixo: "dias", descricao: "Até quantos dias à frente quem não assina marca." },
    { name: "antecedenciaAssinanteDias", label: "Antecedência do assinante", sufixo: "dias", descricao: "A prioridade do plano." },
    { name: "cancelamentoMinHoras", label: "Cancelar pelo site até", sufixo: "horas antes", descricao: "Depois disso, só falando com a casa." },
    { name: "maxAgendamentosAbertos", label: "Horários abertos por cliente", sufixo: "no máximo", descricao: "Segura quem reservaria a semana inteira." },
    { name: "toleranciaAtrasoDias", label: "Tolerância da mensalidade", sufixo: "dias", descricao: "Depois do vencimento, o plano ainda vale (pendente)." },
    { name: "descontoTrimestral", label: "Desconto do trimestral", sufixo: "%", descricao: "Aparece em “Trimestral −10%”." },
]

type RegrasFormProps = {
    defaultValues: RegrasFormValues
    isPending: boolean
    onSubmit: (values: RegrasFormValues) => void
}

export function RegrasForm({ defaultValues, isPending, onSubmit }: RegrasFormProps) {
    const form = useForm<RegrasFormValues>({
        resolver: zodResolver(regrasSchema),
        defaultValues,
    })

    return (
        <form id="regras-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Controller
                name="intervaloMin"
                control={form.control}
                render={({ field }) => (
                    <Field>
                        <FieldLabel htmlFor="regras-intervalo">Grade da agenda</FieldLabel>
                        <Select items={INTERVALOS} value={field.value} onValueChange={(value) => value && field.onChange(value)} disabled={isPending}>
                            <SelectTrigger id="regras-intervalo" size="xl" className="sm:w-64">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {INTERVALOS.map((item) => (
                                    <SelectItem key={item.value} value={item.value}>
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FieldDescription>Os horários que o cliente vê, a partir da abertura do expediente.</FieldDescription>
                    </Field>
                )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
                {CAMPOS.map((campo) => (
                    <Controller
                        key={campo.name}
                        name={campo.name}
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={`regras-${campo.name}`}>{campo.label}</FieldLabel>
                                <div className="flex items-center gap-2">
                                    <Input
                                        {...field}
                                        id={`regras-${campo.name}`}
                                        size="xl"
                                        inputMode="numeric"
                                        className="w-24"
                                        disabled={isPending}
                                        aria-invalid={fieldState.invalid}
                                    />
                                    <span className="text-sm text-muted-foreground">{campo.sufixo}</span>
                                </div>
                                {fieldState.error ? <FieldError errors={[fieldState.error]} /> : <FieldDescription>{campo.descricao}</FieldDescription>}
                            </Field>
                        )}
                    />
                ))}
            </div>
            <Button type="submit" variant="chrome" size="lg" className="self-start" disabled={isPending}>
                {isPending && <LoaderCircle className="animate-spin" />}
                Salvar regras
            </Button>
        </form>
    )
}
