"use client"

import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"

import { DIAS_SEMANA, LIMITS } from "~/lib/constants"
import { cn } from "~/lib/utils"
import type { Expediente, ExpedienteInput } from "~/services/barbeiros"
import { Checkbox } from "~/components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"

const HORA = /^\d{2}:\d{2}$/

/** Um dia do expediente. Espelha os `check` de `expedientes` (abre < pausa < fecha). */
const diaSchema = z
    .object({
        atende: z.boolean(),
        abre: z.string(),
        fecha: z.string(),
        temPausa: z.boolean(),
        pausaInicio: z.string(),
        pausaFim: z.string(),
    })
    .superRefine((dia, ctx) => {
        if (!dia.atende) return

        if (!HORA.test(dia.abre) || !HORA.test(dia.fecha) || dia.abre >= dia.fecha) {
            ctx.addIssue({ code: "custom", message: "Abre antes de fechar.", path: ["fecha"] })
        }
        if (
            dia.temPausa &&
            (!HORA.test(dia.pausaInicio) ||
                !HORA.test(dia.pausaFim) ||
                !(dia.abre < dia.pausaInicio && dia.pausaInicio < dia.pausaFim && dia.pausaFim < dia.fecha))
        ) {
            ctx.addIssue({ code: "custom", message: "A pausa fica dentro do expediente.", path: ["pausaFim"] })
        }
    })

const barbeiroSchema = z.object({
    nome: z
        .string()
        .trim()
        .min(2, "Informe o nome.")
        .max(LIMITS.BARBEIRO_NOME, `No máximo ${LIMITS.BARBEIRO_NOME} caracteres.`),
    especialidade: z.string().trim().max(LIMITS.BARBEIRO_ESPECIALIDADE, `No máximo ${LIMITS.BARBEIRO_ESPECIALIDADE} caracteres.`),
    ordem: z.string().refine((value) => /^\d{1,4}$/.test(value.trim()), "Use um número de 0 a 9999."),
    contaEmail: z.union([z.literal(""), z.email("Informe um e-mail válido.")]),
    dias: z.array(diaSchema).length(7),
})

export type BarbeiroFormValues = z.infer<typeof barbeiroSchema>

/** O expediente do banco → os 7 dias do formulário (dia sem linha = não atende). */
export function toDiasValues(expedientes: Expediente[]): BarbeiroFormValues["dias"] {
    return DIAS_SEMANA.map((_, diaSemana) => {
        const expediente = expedientes.find((item) => item.dia_semana === diaSemana)

        return {
            atende: Boolean(expediente),
            abre: expediente?.abre.slice(0, 5) ?? "09:00",
            fecha: expediente?.fecha.slice(0, 5) ?? "19:00",
            temPausa: expediente ? Boolean(expediente.pausa_inicio) : true,
            pausaInicio: expediente?.pausa_inicio?.slice(0, 5) ?? "12:00",
            pausaFim: expediente?.pausa_fim?.slice(0, 5) ?? "13:00",
        }
    })
}

/** O padrão de quem é novo: segunda a sábado, 09–19h, almoço 12–13. */
export const DIAS_PADRAO: BarbeiroFormValues["dias"] = DIAS_SEMANA.map((_, diaSemana) => ({
    atende: diaSemana !== 0,
    abre: "09:00",
    fecha: "19:00",
    temPausa: true,
    pausaInicio: "12:00",
    pausaFim: "13:00",
}))

export function toExpedientesInput(dias: BarbeiroFormValues["dias"]): ExpedienteInput[] {
    return dias.flatMap((dia, diaSemana) =>
        dia.atende
            ? [
                  {
                      diaSemana,
                      abre: dia.abre,
                      fecha: dia.fecha,
                      pausaInicio: dia.temPausa ? dia.pausaInicio : null,
                      pausaFim: dia.temPausa ? dia.pausaFim : null,
                  },
              ]
            : []
    )
}

type BarbeiroFormProps = {
    defaultValues: BarbeiroFormValues
    isPending: boolean
    rootError: string | null
    onSubmit: (values: BarbeiroFormValues) => void
    /** Avisa o cartão ao lado (prévia do nome). */
    onNomeChange?: (nome: string) => void
}

/**
 * Dados do barbeiro e o expediente da semana (design: Admin 07). Os botões ficam no cartão ao
 * lado, ligados por `form="barbeiro-form"`.
 */
export function BarbeiroForm({ defaultValues, isPending, rootError, onSubmit, onNomeChange }: BarbeiroFormProps) {
    const form = useForm<BarbeiroFormValues>({
        resolver: zodResolver(barbeiroSchema),
        defaultValues,
    })

    const dias = useWatch({ control: form.control, name: "dias" })

    return (
        <form id="barbeiro-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 rounded-lg border bg-card p-5">
            <section className="flex flex-col gap-4">
                <h2 className="font-display text-base font-semibold tracking-wide uppercase">Dados</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Controller
                        name="nome"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="barbeiro-form-nome">Nome</FieldLabel>
                                <Input
                                    {...field}
                                    id="barbeiro-form-nome"
                                    size="xl"
                                    maxLength={LIMITS.BARBEIRO_NOME}
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
                        name="especialidade"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="barbeiro-form-especialidade">Especialidade</FieldLabel>
                                <Input
                                    {...field}
                                    id="barbeiro-form-especialidade"
                                    size="xl"
                                    maxLength={LIMITS.BARBEIRO_ESPECIALIDADE}
                                    placeholder="Ex.: Barba e navalha"
                                    disabled={isPending}
                                    aria-invalid={fieldState.invalid}
                                />
                                <FieldError errors={[fieldState.error]} />
                            </Field>
                        )}
                    />
                    <Controller
                        name="contaEmail"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="barbeiro-form-conta">E-mail da conta</FieldLabel>
                                <Input
                                    {...field}
                                    id="barbeiro-form-conta"
                                    type="email"
                                    size="xl"
                                    inputMode="email"
                                    placeholder="opcional"
                                    disabled={isPending}
                                    aria-invalid={fieldState.invalid}
                                />
                                {fieldState.error ? (
                                    <FieldError errors={[fieldState.error]} />
                                ) : (
                                    <FieldDescription>Quem entra no painel e vê esta agenda. A conta precisa ser da equipe.</FieldDescription>
                                )}
                            </Field>
                        )}
                    />
                    <Controller
                        name="ordem"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="barbeiro-form-ordem">Ordem</FieldLabel>
                                <Input {...field} id="barbeiro-form-ordem" size="xl" inputMode="numeric" disabled={isPending} aria-invalid={fieldState.invalid} />
                                {fieldState.error ? (
                                    <FieldError errors={[fieldState.error]} />
                                ) : (
                                    <FieldDescription>Ordem das colunas da agenda e do “tanto faz”.</FieldDescription>
                                )}
                            </Field>
                        )}
                    />
                </div>
            </section>

            <section className="flex flex-col gap-3">
                <h2 className="font-display text-base font-semibold tracking-wide uppercase">Expediente</h2>
                <ul className="flex flex-col divide-y rounded-md border">
                    {DIAS_SEMANA.map((nome, indice) => {
                        const dia = dias[indice]

                        return (
                            <li key={nome} className="flex flex-col gap-3 px-3 py-3 md:flex-row md:items-start">
                                <Controller
                                    name={`dias.${indice}.atende`}
                                    control={form.control}
                                    render={({ field }) => (
                                        <Field orientation="horizontal" className="md:w-36 md:pt-2">
                                            <Checkbox
                                                id={`barbeiro-form-dia-${indice}`}
                                                checked={field.value}
                                                onCheckedChange={(checked) => field.onChange(checked === true)}
                                                disabled={isPending}
                                            />
                                            <FieldLabel htmlFor={`barbeiro-form-dia-${indice}`}>{nome}</FieldLabel>
                                        </Field>
                                    )}
                                />
                                {dia?.atende ? (
                                    <div className="flex flex-1 flex-wrap items-start gap-x-4 gap-y-2">
                                        <div className="flex items-center gap-2">
                                            <Controller
                                                name={`dias.${indice}.abre`}
                                                control={form.control}
                                                render={({ field }) => (
                                                    <Input {...field} type="time" step={300} aria-label={`${nome}: abre`} className="w-28" disabled={isPending} />
                                                )}
                                            />
                                            <span className="text-subtle">às</span>
                                            <Controller
                                                name={`dias.${indice}.fecha`}
                                                control={form.control}
                                                render={({ field, fieldState }) => (
                                                    <Input
                                                        {...field}
                                                        type="time"
                                                        step={300}
                                                        aria-label={`${nome}: fecha`}
                                                        className="w-28"
                                                        disabled={isPending}
                                                        aria-invalid={fieldState.invalid}
                                                    />
                                                )}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Controller
                                                name={`dias.${indice}.temPausa`}
                                                control={form.control}
                                                render={({ field }) => (
                                                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={(checked) => field.onChange(checked === true)}
                                                            disabled={isPending}
                                                        />
                                                        Pausa
                                                    </label>
                                                )}
                                            />
                                            <div className={cn("flex items-center gap-2", !dia.temPausa && "invisible")}>
                                                <Controller
                                                    name={`dias.${indice}.pausaInicio`}
                                                    control={form.control}
                                                    render={({ field }) => (
                                                        <Input {...field} type="time" step={300} aria-label={`${nome}: pausa de`} className="w-28" disabled={isPending} />
                                                    )}
                                                />
                                                <span className="text-subtle">às</span>
                                                <Controller
                                                    name={`dias.${indice}.pausaFim`}
                                                    control={form.control}
                                                    render={({ field, fieldState }) => (
                                                        <Input
                                                            {...field}
                                                            type="time"
                                                            step={300}
                                                            aria-label={`${nome}: pausa até`}
                                                            className="w-28"
                                                            disabled={isPending}
                                                            aria-invalid={fieldState.invalid}
                                                        />
                                                    )}
                                                />
                                            </div>
                                        </div>
                                        <FieldError
                                            className="basis-full"
                                            errors={[form.formState.errors.dias?.[indice]?.fecha, form.formState.errors.dias?.[indice]?.pausaFim]}
                                        />
                                    </div>
                                ) : (
                                    <span className="text-sm text-subtle md:pt-2">Não atende</span>
                                )}
                            </li>
                        )
                    })}
                </ul>
            </section>

            {rootError && <FieldError>{rootError}</FieldError>}
        </form>
    )
}
