import { cn } from "~/lib/utils"

export function DataField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="min-w-0">
            <span className="letreiro text-subtle">{label}</span>
            <div className="mt-1 text-sm break-words">{children}</div>
        </div>
    )
}

type SectionProps = {
    title: string
    description?: string
    icon?: React.ReactNode
    action?: React.ReactNode
    className?: string
    children: React.ReactNode
}

/** Bloco de conteúdo do painel, com o título em letreiro ("DADOS PESSOAIS"). */
export function Section({ title, description, icon, action, className, children }: SectionProps) {
    return (
        <section className={cn("flex flex-col gap-5 rounded-lg border bg-card p-5", className)}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="flex items-center gap-2 font-display text-base font-semibold tracking-wide uppercase">
                        {icon}
                        {title}
                    </h2>
                    {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
                </div>
                {action}
            </div>
            {children}
        </section>
    )
}

/** Um número grande do painel ("ATENDIMENTOS 18"). */
export function StatCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) {
    return (
        <div className="rounded-lg border bg-card px-4 py-3.5">
            <p className="letreiro text-muted-foreground">{label}</p>
            <p className="mt-1.5 font-display text-3xl font-medium tabular-nums">{value}</p>
            {hint && <p className="mt-0.5 text-xs text-subtle">{hint}</p>}
        </div>
    )
}
