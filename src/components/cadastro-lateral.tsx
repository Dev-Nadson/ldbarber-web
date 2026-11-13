import Link from "next/link"
import { LoaderCircle } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Iniciais } from "~/components/iniciais"

type CadastroLateralProps = {
    /** O `id` do formulário que os botões enviam. */
    formId: string
    nome: string
    subtitulo: string
    selo?: React.ReactNode
    cancelHref: string
    salvarLabel: string
    isPending: boolean
    children?: React.ReactNode
}

/** O cartão ao lado dos cadastros (design: Admin 07): a prévia e os botões Salvar e Cancelar. */
export function CadastroLateral({ formId, nome, subtitulo, selo, cancelHref, salvarLabel, isPending, children }: CadastroLateralProps) {
    return (
        <aside className="flex flex-col gap-3 lg:sticky lg:top-8 lg:self-start">
            <div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-6 text-center">
                <Iniciais nome={nome} destaque className="size-14 text-base" />
                <p className="mt-1 font-semibold">{nome || "Sem nome"}</p>
                <p className="text-sm text-muted-foreground">{subtitulo}</p>
                {selo}
            </div>
            <Button type="submit" form={formId} variant="chrome" size="xl" disabled={isPending}>
                {isPending && <LoaderCircle className="animate-spin" />}
                {salvarLabel}
            </Button>
            {children}
            <Button variant="link" className="justify-center font-display tracking-[0.14em] uppercase" render={<Link href={cancelHref} />}>
                Cancelar
            </Button>
        </aside>
    )
}
