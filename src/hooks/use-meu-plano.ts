import { useQuery } from "@tanstack/react-query"

import { useConfiguracao } from "~/hooks/use-configuracao"
import { useSession } from "~/hooks/use-session"
import { situacaoAssinatura, temBeneficio, usoDoMes } from "~/lib/plano"
import { QUERIES } from "~/lib/queries"
import { addMonths, toInstant, today } from "~/lib/utils"
import { listMeusDoPeriodo } from "~/services/agendamentos"
import { getMinhaAssinatura } from "~/services/assinaturas"

/**
 * O plano de quem está logado, já com a situação calculada e o uso da cota no mês de `dia`.
 * Transversal: início, agendar, planos e perfil leem o mesmo.
 */
export function useMeuPlano(dia: string = today()) {
    const { data: session } = useSession()
    const { data: configuracao } = useConfiguracao()
    const mes = `${dia.slice(0, 7)}-01`

    const { data: assinatura, isPending } = useQuery({
        queryKey: [QUERIES.GET_MINHA_ASSINATURA, { userId: session?.user_id }],
        queryFn: () => getMinhaAssinatura(),
        enabled: Boolean(session),
    })

    const { data: doMes } = useQuery({
        queryKey: [QUERIES.LIST_MEUS_AGENDAMENTOS, { userId: session?.user_id, mes }],
        queryFn: () => listMeusDoPeriodo({ de: toInstant(mes, "00:00"), ate: toInstant(addMonths(mes, 1), "00:00") }),
        enabled: Boolean(session && assinatura),
    })

    const situacao = assinatura ? situacaoAssinatura(assinatura, today(), configuracao?.tolerancia_atraso_dias ?? 0) : null

    return {
        assinatura: assinatura ?? null,
        situacao,
        beneficio: temBeneficio(situacao) && (!assinatura?.encerra_em || dia <= assinatura.encerra_em),
        uso: usoDoMes(doMes ?? [], dia),
        isPending: Boolean(session) && isPending,
    }
}
