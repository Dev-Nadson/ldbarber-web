"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { useRealtimeAgendamentos } from "~/hooks/use-realtime-agendamentos"
import { dateKeyOf, formatShortDay, formatTime } from "~/lib/utils"

/**
 * Montado uma vez no painel: cada horário novo atualiza a agenda e aparece num aviso, esteja
 * a equipe em que tela estiver. O barbeiro só recebe os da agenda dele (o Realtime segue o
 * RLS). O encaixe feito na própria tela não avisa: quem marcou já sabe.
 */
export function AgendamentosNotifier() {
    const router = useRouter()

    useRealtimeAgendamentos({
        onInsert: (agendamento) => {
            if (agendamento.encaixe) return

            const dia = dateKeyOf(agendamento.inicio)

            toast.success(`Novo horário: ${agendamento.cliente_nome}`, {
                description: `${formatShortDay(dia)} · ${formatTime(agendamento.inicio)} · ${agendamento.servico_nome} com ${agendamento.barbeiro_nome}`,
                duration: 15_000,
                action: { label: "Ver", onClick: () => router.push(`/painel/agenda?dia=${dia}`) },
            })
        },
    })

    return null
}
