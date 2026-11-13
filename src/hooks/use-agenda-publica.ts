import { useQuery } from "@tanstack/react-query"

import { useConfiguracao } from "~/hooks/use-configuracao"
import { useRealtimeOcupacoes } from "~/hooks/use-realtime-ocupacoes"
import { QUERIES } from "~/lib/queries"
import { addDays, toInstant } from "~/lib/utils"
import { listBarbeiros, listExpedientes } from "~/services/barbeiros"
import { listOcupacoes } from "~/services/ocupacoes"

/**
 * O que a grade de horários livres precisa (disponibilidade e agendar): barbeiros ativos,
 * expedientes, ocupações do período e a configuração. Tudo público, sem dado de cliente. As
 * ocupações seguem o Realtime: o horário que alguém acabou de marcar some da tela.
 */
export function useAgendaPublica(de: string, ate: string) {
    useRealtimeOcupacoes()

    const { data: configuracao } = useConfiguracao()

    const { data: barbeiros } = useQuery({
        queryKey: [QUERIES.LIST_BARBEIROS, { incluirInativos: false }],
        queryFn: () => listBarbeiros(),
    })

    const { data: expedientes } = useQuery({
        queryKey: [QUERIES.LIST_EXPEDIENTES],
        queryFn: () => listExpedientes(),
    })

    const { data: ocupacoes } = useQuery({
        queryKey: [QUERIES.LIST_OCUPACOES, { de, ate }],
        queryFn: () => listOcupacoes({ de: toInstant(de, "00:00"), ate: toInstant(addDays(ate, 1), "00:00") }),
        refetchInterval: 60_000,
    })

    return {
        configuracao,
        barbeiros: barbeiros ?? [],
        expedientes: expedientes ?? [],
        ocupacoes: ocupacoes ?? [],
        isPending: !configuracao || !barbeiros || !expedientes || !ocupacoes,
    }
}
