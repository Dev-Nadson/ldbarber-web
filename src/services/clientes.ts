import { AssinaturaStatuses, ClienteFiltros, PAGE_SIZE, Roles, Situacoes, type ClienteFiltro } from "~/lib/constants"
import { ApiError, assertAffected, throwIfError } from "~/lib/errors"
import { supabase } from "~/lib/supabase"
import { onlyDigits, sanitizeSearch } from "~/lib/utils"
import type { PaginatedResponse } from "~/typings"
import type { Database } from "~/typings/database"

/** Uma linha da view `clientes_resumo`: perfil, plano, situação, última visita e próximo horário. */
export type ClienteResumo = Database["public"]["Views"]["clientes_resumo"]["Row"]

export type Ficha = Database["public"]["Tables"]["fichas"]["Row"]

const RESUMO_SELECT =
    "id, nome, email, telefone, nascimento, lembrete_whatsapp, criado_em, apelido, assinatura_id, plano_id, plano_nome, assinatura_status, periodicidade, vence_em, encerra_em, situacao, ultima_visita, proximo_horario"

type ListClientesInput = {
    page: number
    search: string
    filtro: ClienteFiltro
}

export type ListClientesOutput = PaginatedResponse<ClienteResumo>

/** Busca pelo nome, apelido ou telefone. "Inadimplentes" = plano pendente ou atrasado. */
export async function listClientes({ page, search, filtro }: ListClientesInput): Promise<ListClientesOutput> {
    const from = (page - 1) * PAGE_SIZE
    const term = sanitizeSearch(search)
    const digits = onlyDigits(term)

    let query = supabase
        .from("clientes_resumo")
        .select(RESUMO_SELECT, { count: "exact" })
        .order("nome")
        .range(from, from + PAGE_SIZE - 1)

    if (term) {
        const filtros = [`nome.ilike.%${term}%`, `apelido.ilike.%${term}%`]

        if (digits && digits === term.replace(/[\s()-]/g, "")) filtros.push(`telefone.ilike.%${digits}%`)

        query = query.or(filtros.join(","))
    }

    if (filtro === ClienteFiltros.ASSINANTES) query = query.eq("assinatura_status", AssinaturaStatuses.ATIVA)
    if (filtro === ClienteFiltros.AVULSOS) {
        query = query.or(`assinatura_id.is.null,assinatura_status.eq.${AssinaturaStatuses.SOLICITADA}`)
    }
    if (filtro === ClienteFiltros.INADIMPLENTES) query = query.in("situacao", [Situacoes.PENDENTE, Situacoes.ATRASADO])

    const { data, count, error } = await query

    throwIfError(error)

    const total = count ?? 0

    return { data: data ?? [], total, page, total_pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

type GetClienteInput = {
    clienteId: string
}

export type GetClienteOutput = ClienteResumo

export async function getCliente({ clienteId }: GetClienteInput): Promise<GetClienteOutput> {
    const { data, error } = await supabase.from("clientes_resumo").select(RESUMO_SELECT).eq("id", clienteId).maybeSingle()

    throwIfError(error)

    if (!data) throw new ApiError("Cliente não encontrado.", { status: 404 })

    return data
}

export type ClienteBusca = {
    id: string
    nome: string | null
    telefone: string | null
    email: string | null
}

type SearchClientesInput = {
    search: string
}

/** A busca do encaixe: só contas de cliente (todo cliente tem conta). */
export async function searchClientes({ search }: SearchClientesInput): Promise<ClienteBusca[]> {
    const term = sanitizeSearch(search)

    if (term.length < 2) return []

    const digits = onlyDigits(term)
    const filtros = [`nome.ilike.%${term}%`, `email.ilike.%${term}%`]

    if (digits.length >= 4) filtros.push(`telefone.ilike.%${digits}%`)

    const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, telefone, email")
        .eq("role", Roles.CLIENTE)
        .or(filtros.join(","))
        .order("nome")
        .limit(8)

    throwIfError(error)

    return data ?? []
}

type GetFichaInput = {
    clienteId: string
}

/** As anotações da casa sobre o cliente. Só a equipe lê. */
export async function getFicha({ clienteId }: GetFichaInput): Promise<Ficha | null> {
    const { data, error } = await supabase
        .from("fichas")
        .select("profile_id, apelido, barbeiro_preferido_id, observacoes, atualizado_em")
        .eq("profile_id", clienteId)
        .maybeSingle()

    throwIfError(error)

    return data
}

type SaveFichaInput = {
    clienteId: string
    apelido: string | null
    barbeiroPreferidoId: string | null
    observacoes: string | null
}

export async function saveFicha({ clienteId, apelido, barbeiroPreferidoId, observacoes }: SaveFichaInput): Promise<void> {
    const { data, error } = await supabase
        .from("fichas")
        .upsert(
            { profile_id: clienteId, apelido, barbeiro_preferido_id: barbeiroPreferidoId, observacoes },
            { onConflict: "profile_id" }
        )
        .select("profile_id")

    throwIfError(error)
    assertAffected(data)
}
