import type { QueryClient } from "@tanstack/react-query"

export const QUERIES = {
    GET_SESSION: "get-session",
    GET_MEU_PERFIL: "get-meu-perfil",
    GET_CONFIGURACAO: "get-configuracao",
    LIST_BARBEIROS: "list-barbeiros",
    GET_BARBEIRO: "get-barbeiro",
    LIST_EXPEDIENTES: "list-expedientes",
    LIST_SERVICOS: "list-servicos",
    LIST_PLANOS: "list-planos",
    GET_PLANO: "get-plano",
    LIST_OCUPACOES: "list-ocupacoes",
    LIST_BLOQUEIOS: "list-bloqueios",
    LIST_AGENDA: "list-agenda",
    LIST_MEUS_AGENDAMENTOS: "list-meus-agendamentos",
    LIST_AGENDAMENTOS_CLIENTE: "list-agendamentos-cliente",
    GET_MINHA_ASSINATURA: "get-minha-assinatura",
    GET_ASSINATURA_CLIENTE: "get-assinatura-cliente",
    LIST_SOLICITACOES: "list-solicitacoes",
    LIST_MENSALIDADES: "list-mensalidades",
    LIST_CLIENTES: "list-clientes",
    GET_CLIENTE: "get-cliente",
    SEARCH_CLIENTES: "search-clientes",
    GET_FICHA: "get-ficha",
    LIST_CAIXA: "list-caixa",
    LIST_EQUIPE: "list-equipe",
} as const

function invalidateAll(queryClient: QueryClient, keys: string[]) {
    return Promise.all(keys.map((key) => queryClient.invalidateQueries({ queryKey: [key] })))
}

/**
 * O horário aparece na agenda da equipe, em "Meus horários", no histórico do cliente, na grade
 * de horários livres (ocupações), na lista de clientes (última visita e próximo) e no caixa.
 */
export function invalidateAgendamentos(queryClient: QueryClient) {
    return invalidateAll(queryClient, [
        QUERIES.LIST_AGENDA,
        QUERIES.LIST_MEUS_AGENDAMENTOS,
        QUERIES.LIST_AGENDAMENTOS_CLIENTE,
        QUERIES.LIST_OCUPACOES,
        QUERIES.LIST_CLIENTES,
        QUERIES.GET_CLIENTE,
        QUERIES.LIST_CAIXA,
    ])
}

/** Bloqueio aparece na agenda e tira horários da grade. */
export function invalidateBloqueios(queryClient: QueryClient) {
    return invalidateAll(queryClient, [QUERIES.LIST_BLOQUEIOS, QUERIES.LIST_OCUPACOES])
}

/**
 * Assinatura e mensalidade mudam o plano do cliente (perfil, início, agendar), a lista e o
 * detalhe de clientes, os pedidos de plano e o caixa.
 */
export function invalidateAssinaturas(queryClient: QueryClient) {
    return invalidateAll(queryClient, [
        QUERIES.GET_MINHA_ASSINATURA,
        QUERIES.GET_ASSINATURA_CLIENTE,
        QUERIES.LIST_SOLICITACOES,
        QUERIES.LIST_MENSALIDADES,
        QUERIES.LIST_CLIENTES,
        QUERIES.GET_CLIENTE,
        QUERIES.LIST_CAIXA,
    ])
}

/** Barbeiro e expediente aparecem no site (agendar, disponibilidade) e no painel. */
export function invalidateBarbeiros(queryClient: QueryClient) {
    return invalidateAll(queryClient, [QUERIES.LIST_BARBEIROS, QUERIES.GET_BARBEIRO, QUERIES.LIST_EXPEDIENTES])
}

export function invalidateServicos(queryClient: QueryClient) {
    return queryClient.invalidateQueries({ queryKey: [QUERIES.LIST_SERVICOS] })
}

export function invalidatePlanos(queryClient: QueryClient) {
    return invalidateAll(queryClient, [QUERIES.LIST_PLANOS, QUERIES.GET_PLANO])
}

/** A configuração aparece no site inteiro (aviso, WhatsApp, regras da agenda) e no painel. */
export function invalidateConfiguracao(queryClient: QueryClient) {
    return queryClient.invalidateQueries({ queryKey: [QUERIES.GET_CONFIGURACAO] })
}

/** Nome e telefone aparecem no menu, no perfil, na equipe e na lista de clientes. */
export function invalidatePerfil(queryClient: QueryClient) {
    return invalidateAll(queryClient, [
        QUERIES.GET_MEU_PERFIL,
        QUERIES.GET_SESSION,
        QUERIES.LIST_EQUIPE,
        QUERIES.LIST_CLIENTES,
        QUERIES.GET_CLIENTE,
        QUERIES.SEARCH_CLIENTES,
    ])
}

/** A ficha aparece no detalhe do cliente, na lista (apelido) e no detalhe do horário. */
export function invalidateFicha(queryClient: QueryClient) {
    return invalidateAll(queryClient, [QUERIES.GET_FICHA, QUERIES.LIST_CLIENTES, QUERIES.GET_CLIENTE])
}
