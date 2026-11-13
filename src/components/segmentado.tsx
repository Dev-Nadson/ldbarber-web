"use client"

import { cn } from "~/lib/utils"

type SegmentadoProps<TValue extends string> = {
    value: TValue
    options: { value: TValue; label: React.ReactNode }[]
    onChange: (value: TValue) => void
    "aria-label": string
    size?: "sm" | "default"
    className?: string
}

/**
 * O seletor segmentado do design ("DIA | SEMANA", "MENSAL | TRIMESTRAL −10%", os filtros da
 * lista de clientes): botões colados, o escolhido em azul-noite.
 */
export function Segmentado<TValue extends string>({
    value,
    options,
    onChange,
    size = "default",
    className,
    ...props
}: SegmentadoProps<TValue>) {
    return (
        <div
            role="radiogroup"
            aria-label={props["aria-label"]}
            className={cn("inline-flex w-fit overflow-hidden rounded-md border border-line-strong", className)}
        >
            {options.map((option, index) => {
                const ativo = option.value === value

                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={ativo}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "flex-1 font-display font-medium tracking-[0.14em] whitespace-nowrap uppercase transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-inset",
                            size === "sm" ? "h-8 px-3 text-[11px]" : "h-10 px-4 text-xs",
                            index > 0 && "border-l border-line-strong",
                            ativo ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        {option.label}
                    </button>
                )
            })}
        </div>
    )
}
