"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { CalendarPlus } from "lucide-react"

import { ApiError } from "~/lib/errors"
import { buildWhatsAppUrl, whatsAppDoCliente } from "~/lib/mensagem"
import { QUERIES } from "~/lib/queries"
import { formatDay, formatDaysAgo, formatPhone, formatTimestamp } from "~/lib/utils"
import { getCliente } from "~/services/clientes"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import { DataField } from "~/components/detail-section"
import { Iniciais } from "~/components/iniciais"
import { PageHeader } from "~/components/page-header"
import { WhatsAppIcon } from "~/components/whatsapp-icon"

export function ClienteHeader({ clienteId }: { clienteId: string }) {
    const { data: cliente, error } = useQuery({
        queryKey: [QUERIES.GET_CLIENTE, { clienteId }],
        queryFn: () => getCliente({ clienteId }),
    })

    if (error instanceof ApiError && error.status === 404) {
        return <p className="rounded-lg border border-dashed px-4 py-10 text-center text-muted-foreground">Cliente não encontrado.</p>
    }

    if (!cliente) return <Skeleton className="h-40 w-full" />

    return (
        <div className="flex flex-col gap-5">
            <PageHeader
                eyebrow="Cliente"
                title={cliente.nome ?? "Sem nome"}
                action={
                    <div className="flex flex-wrap gap-2">
                        {cliente.telefone && (
                            <Button
                                variant="outline"
                                render={<a href={buildWhatsAppUrl(whatsAppDoCliente(cliente.telefone))} target="_blank" rel="noopener noreferrer" />}
                            >
                                <WhatsAppIcon className="size-4" />
                                WhatsApp
                            </Button>
                        )}
                        <Button variant="chrome" render={<Link href={`/painel/agenda/novo?cliente=${clienteId}`} />}>
                            <CalendarPlus />
                            Marcar horário
                        </Button>
                    </div>
                }
            />
            <div className="flex flex-col gap-5 rounded-lg border bg-card p-5 sm:flex-row sm:items-center">
                <Iniciais nome={cliente.nome} destaque className="size-14 text-base" />
                <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-4">
                    <DataField label="WhatsApp">{formatPhone(cliente.telefone)}</DataField>
                    <DataField label="E-mail">{cliente.email ?? "—"}</DataField>
                    <DataField label="Nascimento">{formatDay(cliente.nascimento)}</DataField>
                    <DataField label="Lembrete">{cliente.lembrete_whatsapp ? "Quer pelo WhatsApp" : "Não quer"}</DataField>
                    <DataField label="Última visita">{formatDaysAgo(cliente.ultima_visita)}</DataField>
                    <DataField label="Próximo horário">{formatTimestamp(cliente.proximo_horario)}</DataField>
                    <DataField label="Cliente desde">{formatDay(cliente.criado_em)}</DataField>
                </div>
            </div>
        </div>
    )
}
