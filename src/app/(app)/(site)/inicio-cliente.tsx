"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ArrowRight } from "lucide-react"

import { useMeuPlano } from "~/hooks/use-meu-plano"
import { useSession } from "~/hooks/use-session"
import { QUERIES } from "~/lib/queries"
import { dateKeyOf, firstName, formatCurrency, formatLongDay, formatTime } from "~/lib/utils"
import { listMeusProximos } from "~/services/agendamentos"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import { PlanoResumo } from "~/components/plano-resumo"

/** O que só quem está logado vê no início: o próximo horário e o plano. */
export function InicioCliente() {
    const { data: session } = useSession()
    const { assinatura, situacao, uso } = useMeuPlano()

    const { data: proximos, isPending } = useQuery({
        queryKey: [QUERIES.LIST_MEUS_AGENDAMENTOS, { userId: session?.user_id, tipo: "proximos" }],
        queryFn: () => listMeusProximos(),
        enabled: Boolean(session),
    })

    if (!session) return null

    const proximo = proximos?.[0]

    return (
        <section className="flex flex-col gap-4">
            <h1 className="font-marca text-3xl">Olá, {firstName(session.nome)}</h1>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="relative overflow-hidden rounded-lg border bg-card p-5">
                    <div className="listras absolute inset-x-0 top-0 h-1" aria-hidden="true" />
                    <p className="letreiro text-muted-foreground">Seu próximo horário</p>
                    {isPending ? (
                        <Skeleton className="mt-3 h-16 w-full" />
                    ) : proximo ? (
                        <div className="mt-2 flex flex-col gap-3">
                            <div>
                                <p className="font-display text-5xl font-medium tabular-nums">{formatTime(proximo.inicio)}</p>
                                <p className="text-muted-foreground">{formatLongDay(dateKeyOf(proximo.inicio))}</p>
                            </div>
                            <p className="text-sm">
                                {proximo.servico_nome} com {proximo.barbeiro_nome} ·{" "}
                                {proximo.incluso_plano ? `incluso no plano ${proximo.plano_nome}` : formatCurrency(proximo.valor)}
                            </p>
                            <Button variant="link" className="w-fit px-0" render={<Link href="/meus-horarios" />}>
                                Ver meus horários
                                <ArrowRight />
                            </Button>
                        </div>
                    ) : (
                        <div className="mt-3 flex flex-col items-start gap-3">
                            <p className="text-sm text-muted-foreground">Nenhum horário marcado.</p>
                            <Button render={<Link href="/agendar" />}>Marcar horário</Button>
                        </div>
                    )}
                </div>

                <div className="rounded-lg border bg-card p-5">
                    <p className="letreiro mb-3 text-muted-foreground">Seu plano</p>
                    {assinatura ? (
                        <PlanoResumo assinatura={assinatura} situacao={situacao} uso={uso} />
                    ) : (
                        <div className="flex flex-col items-start gap-3">
                            <p className="text-sm text-muted-foreground">
                                Corte sempre em dia, sem pensar no valor. Assinantes têm prioridade na agenda.
                            </p>
                            <Button variant="outline" render={<Link href="/planos" />}>
                                Ver planos
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
