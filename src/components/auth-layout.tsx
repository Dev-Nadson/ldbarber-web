import Link from "next/link"

import { APP_DESCRIPTION } from "~/lib/constants"
import { BrandMark } from "~/components/brand-mark"

type AuthLayoutProps = {
    title: string
    description: string
    children: React.ReactNode
    footer?: React.ReactNode
}

/**
 * Moldura das telas de acesso (design: Cliente 01). No computador, a marca à esquerda com a
 * listra do barber pole; no celular, a marca no topo e o formulário embaixo.
 */
export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-1 flex-col">
            <div className="h-0.5 bg-primary shadow-[0_0_12px_rgb(47_84_255/0.8)]" aria-hidden="true" />
            <div className="flex flex-1">
                <div className="relative isolate hidden w-1/2 flex-col items-center justify-center gap-6 overflow-hidden border-r bg-[radial-gradient(ellipse_at_center,#18181c_0%,#0a0a0b_70%)] p-12 lg:flex">
                    <div className="listras absolute top-[18%] right-[8%] h-[30%] w-3 rounded-sm" aria-hidden="true" />
                    <Link href="/" aria-label="Início">
                        <BrandMark size="lg" />
                    </Link>
                    <p className="max-w-xs text-center text-base text-muted-foreground">{APP_DESCRIPTION}</p>
                </div>

                <div className="flex w-full flex-col justify-center px-4 py-10 sm:px-6 lg:w-1/2 lg:px-8">
                    <div className="mx-auto w-full max-w-sm">
                        <Link href="/" className="mb-14 flex justify-center lg:hidden" aria-label="Início">
                            <BrandMark size="md" />
                        </Link>

                        <h1 className="font-marca text-3xl">{title}</h1>
                        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>

                        <div className="mt-7">{children}</div>

                        {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
                    </div>
                </div>
            </div>
        </div>
    )
}
