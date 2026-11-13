import { useEffect, useId, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { invalidateAgendamentos } from "~/lib/queries"
import { supabase } from "~/lib/supabase"
import type { Agendamento } from "~/services/agendamentos"

type UseRealtimeAgendamentosOptions = {
    /** Chamado a cada horário novo (o aviso do painel). */
    onInsert?: (agendamento: Agendamento) => void
}

/**
 * Mantém agenda, "Meus horários" e caixa em dia sem recarregar. O Realtime respeita o RLS: a
 * gestão recebe todos, o barbeiro os da agenda dele, o cliente os dele. Precisa de
 * `agendamentos` na publicação `supabase_realtime` (schema.sql, seção 10).
 */
export function useRealtimeAgendamentos({ onInsert }: UseRealtimeAgendamentosOptions = {}) {
    const queryClient = useQueryClient()
    // Um canal por tela que assina: dois `channel()` com o mesmo nome se atrapalham.
    const channelId = useId()
    const onInsertRef = useRef(onInsert)

    useEffect(() => {
        onInsertRef.current = onInsert
    }, [onInsert])

    useEffect(() => {
        const channel = supabase
            .channel(`agendamentos-realtime-${channelId}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "agendamentos" }, (payload) => {
                invalidateAgendamentos(queryClient)

                if (payload.eventType === "INSERT") onInsertRef.current?.(payload.new as Agendamento)
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [channelId, queryClient])
}
