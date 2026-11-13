import Link from "next/link"

import { APP_DESCRIPTION } from "~/lib/constants"
import { Button } from "~/components/ui/button"
import { BrandMark } from "~/components/brand-mark"

/** A capa do design: a marca grande, a frase e as três peças (listra, cromo, grafite). */
export function InicioHero() {
    return (
        <section className="grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
            <div className="flex flex-col items-center gap-6 text-center md:items-start md:text-left">
                <BrandMark size="lg" className="md:items-start" />
                <p className="max-w-md text-lg text-muted-foreground">{APP_DESCRIPTION}</p>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                    <Button size="xl" render={<Link href="/agendar" />}>
                        Marcar horário
                    </Button>
                    <Button variant="outline" size="xl" render={<Link href="/planos" />}>
                        Ver planos
                    </Button>
                </div>
            </div>

            <div className="hidden h-72 items-end gap-4 md:flex" aria-hidden="true">
                <div className="listras h-full flex-[1.4] rounded-md" />
                <div className="h-3/5 flex-1 rounded-md bg-chrome" />
                <div className="h-4/5 flex-1 rounded-md bg-surface-3" />
            </div>
        </section>
    )
}
