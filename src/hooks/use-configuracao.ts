import { useQuery } from "@tanstack/react-query"

import { QUERIES } from "~/lib/queries"
import { getConfiguracao } from "~/services/configuracoes"

/**
 * A configuração da casa (aviso, WhatsApp, regras da agenda). Transversal como a sessão:
 * quase toda tela lê, do site ao painel.
 */
export function useConfiguracao() {
    return useQuery({
        queryKey: [QUERIES.GET_CONFIGURACAO],
        queryFn: () => getConfiguracao(),
        staleTime: 5 * 60_000,
    })
}
