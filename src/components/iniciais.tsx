import { cn, initials } from "~/lib/utils"

type IniciaisProps = {
    nome: string | null | undefined
    /** Contorno neon: o barbeiro escolhido, o usuário logado. */
    destaque?: boolean
    className?: string
}

/** O "avatar" do design: as iniciais num círculo. Não há foto na v1. */
export function Iniciais({ nome, destaque = false, className }: IniciaisProps) {
    return (
        <span
            className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full border bg-surface-3 font-display text-[11px] font-semibold tracking-wider",
                destaque ? "border-primary text-foreground" : "border-line-strong text-muted-foreground",
                className
            )}
            aria-hidden="true"
        >
            {initials(nome) || "?"}
        </span>
    )
}
