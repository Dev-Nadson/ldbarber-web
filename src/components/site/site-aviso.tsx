"use client"

import { Megaphone } from "lucide-react"

import { useConfiguracao } from "~/hooks/use-configuracao"

/** A faixa do topo com o aviso da casa ("Fechado no feriado de 15/11"). Some sem aviso. */
export function SiteAviso() {
    const { data: configuracao } = useConfiguracao()

    if (!configuracao?.aviso) return null

    return (
        <div className="flex items-center justify-center gap-2 bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground">
            <Megaphone className="size-4 shrink-0" />
            {configuracao.aviso}
        </div>
    )
}
