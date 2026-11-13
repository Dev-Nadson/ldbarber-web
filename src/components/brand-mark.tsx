import { APP_NAME, APP_TAGLINE } from "~/lib/constants"
import { cn } from "~/lib/utils"

const SIZES = {
    sm: { nome: "text-[22px]", tagline: "text-[8px] tracking-[0.35em]", traco: "w-3" },
    md: { nome: "text-4xl", tagline: "text-[10px] tracking-[0.4em]", traco: "w-4" },
    lg: { nome: "text-6xl sm:text-7xl", tagline: "text-xs tracking-[0.5em]", traco: "w-5" },
} as const

type BrandMarkProps = {
    size?: keyof typeof SIZES
    /** Sem o "— Studio —" embaixo (menu recolhido, cabeçalho compacto). */
    semTagline?: boolean
    className?: string
}

/**
 * O logotipo: "LD Barber" em UnifrakturCook e o "— Studio —" em letreiro com os traços neon.
 * É texto (não imagem), então fica nítido em qualquer tamanho e não pesa.
 */
export function BrandMark({ size = "md", semTagline = false, className }: BrandMarkProps) {
    const tamanho = SIZES[size]

    return (
        <span className={cn("inline-flex flex-col items-center leading-none", className)}>
            <span className={cn("font-marca whitespace-nowrap text-chrome", tamanho.nome)}>{APP_NAME}</span>
            {!semTagline && (
                <span className={cn("mt-1 flex items-center gap-1.5 font-display font-semibold uppercase", tamanho.tagline)}>
                    <span className={cn("h-px bg-primary", tamanho.traco)} aria-hidden="true" />
                    <span className="-mr-[0.35em]">{APP_TAGLINE}</span>
                    <span className={cn("h-px bg-primary", tamanho.traco)} aria-hidden="true" />
                </span>
            )}
        </span>
    )
}
