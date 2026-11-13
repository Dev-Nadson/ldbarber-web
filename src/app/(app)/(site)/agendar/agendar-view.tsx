"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, LoaderCircle } from "lucide-react"
import { toast } from "sonner"

import { useAgendaPublica } from "~/hooks/use-agenda-publica"
import { useAgora } from "~/hooks/use-agora"
import { useConfiguracao } from "~/hooks/use-configuracao"
import { useMeuPlano } from "~/hooks/use-meu-plano"
import { useSession } from "~/hooks/use-session"
import {
    disponibilidadeDoDia,
    horariosDeQualquer,
    primeiroBarbeiroLivre,
    resumoDoDia,
} from "~/lib/agenda"
import { describeMutationError } from "~/lib/errors"
import { coberturaPlano } from "~/lib/plano"
import { QUERIES, invalidateAgendamentos } from "~/lib/queries"
import { addDays, cn, formatCurrency, formatShortDay, toInstant, today } from "~/lib/utils"
import { createAgendamento } from "~/services/agendamentos"
import { listServicos } from "~/services/servicos"
import { Button } from "~/components/ui/button"
import { PageHeader } from "~/components/page-header"
import { AgendarBarbeiros } from "./agendar-barbeiros"
import { AgendarHorarios } from "./agendar-horarios"
import { AgendarResumo } from "./agendar-resumo"
import { AgendarServicos } from "./agendar-servicos"
import { QUALQUER_BARBEIRO, useAgendar } from "./agendar-store"

const PASSOS = 4

function TituloSecao({ numero, children }: { numero: number; children: React.ReactNode }) {
    return (
        <h2 className="mb-3 font-display text-base font-semibold tracking-wide uppercase">
            {numero} · {children}
        </h2>
    )
}

type AgendarViewProps = {
    diaInicial: string | null
}

/**
 * Marcar horário (design: Cliente 03). No computador, as três escolhas e o resumo na mesma
 * tela; no celular, um passo por vez com a barra de baixo. A grade é a prévia de
 * `lib/agenda.ts`; quem confirma é o `agendamentos_criar`.
 */
export function AgendarView({ diaInicial }: AgendarViewProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const { data: session } = useSession()
    const agora = useAgora()
    const hoje = today()
    const { servicoId, barbeiroId, dia, hora, passo, reset, setServico, setBarbeiro, setDia, setHora, setPasso } = useAgendar()

    useEffect(() => {
        reset(diaInicial)
    }, [diaInicial, reset])

    const { data: configuracao } = useConfiguracao()
    const plano = useMeuPlano(dia ?? diaInicial ?? hoje)
    const antecedencia = plano.beneficio ? configuracao?.antecedencia_assinante_dias : configuracao?.antecedencia_avulso_dias
    const limite = addDays(hoje, antecedencia ?? 15)
    const agenda = useAgendaPublica(hoje, limite)
    const intervalo = agenda.configuracao?.intervalo_min ?? 30

    const { data: servicos } = useQuery({
        queryKey: [QUERIES.LIST_SERVICOS, { incluirInativos: false }],
        queryFn: () => listServicos(),
    })

    const servico = servicos?.find((item) => item.id === servicoId) ?? null
    const duracao = servico?.duracao_min ?? intervalo
    const barbeiroIds = useMemo(() => agenda.barbeiros.map((barbeiro) => barbeiro.id), [agenda.barbeiros])
    const pronto = !agenda.isPending && agora > 0

    // Dias da faixa: de hoje até a antecedência do cliente, com os horários livres de cada um
    // (do barbeiro escolhido, ou de todos no "tanto faz").
    const dias = useMemo(() => {
        if (!pronto) return []

        const lista: { dia: string; livres: number }[] = []

        for (let d = hoje; d <= limite; d = addDays(d, 1)) {
            const disponivel = disponibilidadeDoDia({
                dia: d,
                barbeiroIds: barbeiroId && barbeiroId !== QUALQUER_BARBEIRO ? [barbeiroId] : barbeiroIds,
                expedientes: agenda.expedientes,
                ocupacoes: agenda.ocupacoes,
                duracaoMin: duracao,
                intervaloMin: intervalo,
                agora,
            })
            const resumo = resumoDoDia(disponivel)

            if (resumo.atende) lista.push({ dia: d, livres: resumo.livres })
        }

        return lista
    }, [agenda.expedientes, agenda.ocupacoes, agora, barbeiroId, barbeiroIds, duracao, hoje, intervalo, limite, pronto])

    // O dia escolhido, ou o da disponibilidade (`?dia=`), ou o primeiro com horário livre.
    const diaEfetivo =
        (dia && dias.some((opcao) => opcao.dia === dia) ? dia : null) ??
        dias.find((opcao) => opcao.livres > 0)?.dia ??
        null

    const disponibilidade = useMemo(
        () =>
            pronto && diaEfetivo
                ? disponibilidadeDoDia({
                      dia: diaEfetivo,
                      barbeiroIds,
                      expedientes: agenda.expedientes,
                      ocupacoes: agenda.ocupacoes,
                      duracaoMin: duracao,
                      intervaloMin: intervalo,
                      agora,
                  })
                : [],
        [agenda.expedientes, agenda.ocupacoes, agora, barbeiroIds, diaEfetivo, duracao, intervalo, pronto]
    )

    const horarios =
        barbeiroId === QUALQUER_BARBEIRO
            ? horariosDeQualquer(disponibilidade)
            : (disponibilidade.find((item) => item.barbeiroId === barbeiroId)?.horarios ?? [])
    const horaValida = horarios.some((horario) => horario.hora === hora && horario.livre) ? hora : null
    const barbeiroFinal =
        barbeiroId === QUALQUER_BARBEIRO && horaValida ? primeiroBarbeiroLivre(disponibilidade, horaValida) : barbeiroId
    const barbeiro = agenda.barbeiros.find((item) => item.id === barbeiroFinal) ?? null

    const inclusos = useMemo(() => {
        if (!plano.beneficio || !plano.assinatura || !servicos) return new Set<string>()

        const cotas = plano.assinatura.cotas

        return new Set(servicos.filter((item) => coberturaPlano(item.categorias, cotas, plano.uso)).map((item) => item.id))
    }, [plano.assinatura, plano.beneficio, plano.uso, servicos])

    const planoNome = servico && inclusos.has(servico.id) ? (plano.assinatura?.plano_nome ?? null) : null
    const podeConfirmar = Boolean(session && servico && barbeiro && diaEfetivo && horaValida)

    const { mutateAsync, isPending } = useMutation({
        mutationFn: createAgendamento,
        onSuccess: (agendamento) => {
            invalidateAgendamentos(queryClient)
            router.push(`/meus-horarios?novo=${agendamento.id}`)
        },
        onError: () => queryClient.invalidateQueries({ queryKey: [QUERIES.LIST_OCUPACOES] }),
    })

    function confirmar() {
        if (isPending || !session || !servico || !barbeiro || !diaEfetivo || !horaValida) return

        toast.promise(
            mutateAsync({
                clienteId: session.user_id,
                barbeiroId: barbeiro.id,
                servicoId: servico.id,
                inicio: toInstant(diaEfetivo, horaValida),
            }),
            {
                loading: "Marcando seu horário...",
                success: `Horário confirmado: ${formatShortDay(diaEfetivo)}, ${horaValida}, com ${barbeiro.nome}.`,
                error: (error: unknown) => describeMutationError(error),
            }
        )
    }

    const passoCompleto = [Boolean(servico), Boolean(barbeiroId), Boolean(horaValida), podeConfirmar][passo - 1]

    return (
        <div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-36 md:pt-10 md:pb-12 lg:px-8">
            {/* Celular: "← MARCAR HORÁRIO 3/4" e a barra de progresso. */}
            <div className="md:hidden">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Voltar"
                        onClick={() => (passo > 1 ? setPasso(passo - 1) : router.back())}
                    >
                        <ChevronLeft />
                    </Button>
                    <span className="font-display text-base font-semibold tracking-wide uppercase">Marcar horário</span>
                    <span className="w-8 text-right font-display text-sm text-muted-foreground tabular-nums">
                        {passo}/{PASSOS}
                    </span>
                </div>
                <div className="mt-3 mb-5 grid grid-cols-4 gap-1.5">
                    {Array.from({ length: PASSOS }).map((_, index) => (
                        <span key={index} className={cn("h-0.5 rounded-full", index < passo ? "bg-primary" : "bg-surface-3")} />
                    ))}
                </div>
            </div>

            <PageHeader eyebrow="Novo agendamento" title="Marque seu horário" variant="marca" className="hidden md:flex" />

            <div className="mt-8 grid gap-8 md:grid-cols-[1fr_340px] lg:grid-cols-[1fr_380px]">
                <div className="flex flex-col gap-8">
                    <div className="grid gap-8 lg:grid-cols-2">
                        <section className={cn(passo !== 1 && "hidden md:block")}>
                            <TituloSecao numero={1}>Serviço</TituloSecao>
                            <AgendarServicos
                                servicos={servicos}
                                servicoId={servicoId}
                                inclusos={inclusos}
                                onChange={(id) => {
                                    setServico(id)
                                    if (window.matchMedia("(max-width: 767px)").matches) setPasso(2)
                                }}
                            />
                        </section>

                        <section className={cn(passo !== 2 && "hidden md:block")}>
                            <TituloSecao numero={2}>Barbeiro</TituloSecao>
                            <AgendarBarbeiros
                                barbeiros={agenda.barbeiros}
                                barbeiroId={barbeiroId}
                                onChange={(id) => {
                                    setBarbeiro(id)
                                    if (window.matchMedia("(max-width: 767px)").matches) setPasso(3)
                                }}
                            />
                        </section>
                    </div>

                    <section className={cn(passo !== 3 && "hidden md:block")}>
                        <TituloSecao numero={3}>
                            Horário{diaEfetivo && ` · ${formatShortDay(diaEfetivo)}`}
                        </TituloSecao>
                        {!barbeiroId ? (
                            <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                                Escolha o barbeiro para ver os horários.
                            </p>
                        ) : (
                            <AgendarHorarios
                                dias={dias}
                                dia={diaEfetivo}
                                horarios={horarios}
                                hora={horaValida}
                                isPending={!pronto}
                                onDia={setDia}
                                onHora={setHora}
                            />
                        )}
                        {barbeiroId && pronto && !dias.length && (
                            <p className="mt-3 text-sm text-muted-foreground">Sem dias de atendimento nos próximos dias.</p>
                        )}
                    </section>
                </div>

                <aside className={cn("md:sticky md:top-24 md:self-start", passo !== 4 && "hidden md:block")}>
                    <AgendarResumo
                        dia={diaEfetivo}
                        hora={horaValida}
                        servicoNome={servico?.nome ?? null}
                        duracaoMin={servico?.duracao_min ?? null}
                        preco={servico?.preco ?? null}
                        barbeiroNome={barbeiro?.nome ?? null}
                        planoNome={planoNome}
                        cancelamentoHoras={configuracao?.cancelamento_min_horas ?? 2}
                        podeConfirmar={podeConfirmar}
                        isPending={isPending}
                        onConfirmar={confirmar}
                    />
                </aside>
            </div>

            {/* Celular: o horário e o valor escolhidos, e o botão do passo. */}
            <div className="fixed inset-x-0 bottom-[calc(57px+env(safe-area-inset-bottom))] z-20 flex items-center gap-4 border-t bg-background/95 px-4 py-3 backdrop-blur md:hidden">
                <div className="min-w-0 flex-1">
                    <p className="font-display text-xl tabular-nums">
                        {horaValida ?? "--:--"}
                        {servico && ` · ${formatCurrency(planoNome ? 0 : servico.preco)}`}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                        {diaEfetivo ? formatShortDay(diaEfetivo) : "Escolha o horário"}
                    </p>
                </div>
                {passo < PASSOS ? (
                    <Button size="lg" disabled={!passoCompleto} onClick={() => setPasso(passo + 1)}>
                        Continuar
                    </Button>
                ) : (
                    <Button size="lg" disabled={!podeConfirmar || isPending} onClick={confirmar}>
                        {isPending && <LoaderCircle className="animate-spin" />}
                        Confirmar
                    </Button>
                )}
            </div>
        </div>
    )
}
