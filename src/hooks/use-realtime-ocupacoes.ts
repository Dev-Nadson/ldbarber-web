import { useEffect, useId } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { QUERIES } from "~/lib/queries"
import { supabase } from "~/lib/supabase"

/**
 * A grade de horários livres (agendar, disponibilidade) acompanha quem marca ou cancela em
 * outro aparelho: o horário some na hora, em vez de só dar erro no "Confirmar". Precisa de
 * `ocupacoes` na publicação `supabase_realtime` (schema.sql, seção 10).
 */
export function useRealtimeOcupacoes() {
    const queryClient = useQueryClient()
    // Um canal por tela que assina: dois `channel()` com o mesmo nome se atrapalham.
    const channelId = useId()

    useEffect(() => {
        const channel = supabase
            .channel(`ocupacoes-realtime-${channelId}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "ocupacoes" }, () => {
                queryClient.invalidateQueries({ queryKey: [QUERIES.LIST_OCUPACOES] })
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [channelId, queryClient])
}
