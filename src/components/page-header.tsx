import { cn } from "~/lib/utils"

type PageHeaderProps = {
    /** O rótulo pequeno em cima ("AGENDA", "DIAS DISPONÍVEIS"). */
    eyebrow?: string
    title: string
    /** Número ao lado do título, apagado ("CLIENTES 248"). */
    count?: number
    description?: string
    action?: React.ReactNode
    /**
     * `letreiro`: Oswald em caixa alta, o padrão do painel. `marca`: UnifrakturCook, o padrão
     * das telas do cliente ("Outubro", "Planos").
     */
    variant?: "letreiro" | "marca"
    className?: string
}

export function PageHeader({ eyebrow, title, count, description, action, variant = "letreiro", className }: PageHeaderProps) {
    return (
        <header className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
            <div className="min-w-0">
                {eyebrow && <p className="letreiro text-muted-foreground">{eyebrow}</p>}
                <h1
                    className={cn(
                        "mt-1",
                        variant === "marca"
                            ? "font-marca text-3xl sm:text-4xl"
                            : "font-display text-2xl font-semibold tracking-wide uppercase sm:text-3xl"
                    )}
                >
                    {title}
                    {count !== undefined && (
                        <span className="ml-2 font-display text-xl font-normal text-subtle tabular-nums sm:text-2xl">{count}</span>
                    )}
                </h1>
                {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
            </div>
            {action}
        </header>
    )
}
