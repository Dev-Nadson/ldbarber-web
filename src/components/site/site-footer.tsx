"use client"

import { AtSign, MapPin } from "lucide-react"

import { useConfiguracao } from "~/hooks/use-configuracao"
import { buildWhatsAppUrl } from "~/lib/mensagem"
import { BrandMark } from "~/components/brand-mark"
import { WhatsAppIcon } from "~/components/whatsapp-icon"

export function SiteFooter() {
    const { data: configuracao } = useConfiguracao()

    return (
        <footer className="border-t pb-20 md:pb-0">
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:justify-between lg:px-8">
                <BrandMark size="sm" />
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
                    {configuracao?.endereco && (
                        <span className="flex items-center gap-1.5 text-center">
                            <MapPin className="size-4 shrink-0" />
                            {configuracao.endereco}
                        </span>
                    )}
                    {configuracao?.whatsapp && (
                        <a
                            href={buildWhatsAppUrl(configuracao.whatsapp)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 hover:text-foreground"
                        >
                            <WhatsAppIcon className="size-4" />
                            WhatsApp
                        </a>
                    )}
                    {configuracao?.instagram && (
                        <a
                            href={`https://instagram.com/${configuracao.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 hover:text-foreground"
                        >
                            <AtSign className="size-4" />
                            {configuracao.instagram}
                        </a>
                    )}
                </div>
            </div>
        </footer>
    )
}
