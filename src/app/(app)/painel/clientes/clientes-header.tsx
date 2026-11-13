"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { ClienteFiltros } from "~/lib/constants"
import { QUERIES } from "~/lib/queries"
import { listClientes } from "~/services/clientes"
import { PageHeader } from "~/components/page-header"

/** "CLIENTES 248": o total da base, da mesma consulta da lista sem filtro (cache do React Query). */
export function ClientesHeader() {
    const params = { page: 1, search: "", filtro: ClienteFiltros.TODOS }
    const { data } = useQuery({
        queryKey: [QUERIES.LIST_CLIENTES, params],
        queryFn: () => listClientes(params),
        placeholderData: keepPreviousData,
    })

    return (
        <PageHeader
            eyebrow="Base"
            title="Clientes"
            count={data?.total}
            description="Toda pessoa que cria conta no site entra aqui. Plano, mensalidades e preferências ficam no detalhe."
        />
    )
}
