import Link from "next/link"

import { Button } from "~/components/ui/button"
import { BrandMark } from "~/components/brand-mark"

export default function NotFound() {
    return (
        <div className="grid min-h-svh place-items-center p-4">
            <div className="flex max-w-md flex-col items-center gap-5 text-center">
                <BrandMark size="md" />
                <h1 className="mt-4 font-display text-2xl font-semibold tracking-wide uppercase">Página não encontrada</h1>
                <p className="text-sm text-muted-foreground">O endereço pode ter mudado. Volte ao início e marque seu horário.</p>
                <Button size="lg" render={<Link href="/" />}>
                    Ir para o início
                </Button>
            </div>
        </div>
    )
}
