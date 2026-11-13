import { AgendamentoStatuses, PAGE_SIZE, type FormaPagamento } from "~/lib/constants"
import { ApiError, assertAffected, throwIfError } from "~/lib/errors"
import { supabase } from "~/lib/supabase"
import type { PaginatedResponse } from "~/typings"
import type { Database } from "~/typings/database"

export type Agendamento = Database["public"]["Tables"]["agendamentos"]["Row"]

const AGENDAMENTO_SELECT =
    "id, cliente_id, barbeiro_id, servico_id, inicio, fim, status, cliente_nome, cliente_telefone, barbeiro_nome, servico_nome, categorias, duracao_min, preco, incluso_plano, assinatura_id, plano_nome, valor, encaixe, observacao, forma_pagamento, valor_recebido, concluido_em, cancelado_em, cancelado_por, criado_por, criado_em, atualizado_em"

function paginate<T>(data: T[] | null, count: number | null, page: number): PaginatedResponse<T> {
    const total = count ?? 0

    return { data: data ?? [], total, page, total_pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

async function requireUserId() {
    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session) throw new ApiError("Entre na sua conta.", { status: 401 })

    return session.user.id
}

type CreateAgendamentoInput = {
    clienteId: string
    barbeiroId: string
    servicoId: string
    /** Instante ISO do início (`toInstant(dia, hora)`). */
    inicio: string
    observacao?: string | null
}

export type CreateAgendamentoOutput = Agendamento

/**
 * O navegador manda só quem, com quem, o quê e quando. Preço, plano, fim e todas as regras da
 * agenda são do `agendamentos_criar`; a sobreposição, da `ocupacoes`. Os erros chegam com a
 * mensagem pronta.
 */
export async function createAgendamento(input: CreateAgendamentoInput): Promise<CreateAgendamentoOutput> {
    const { data, error } = await supabase
        .from("agendamentos")
        .insert({
            cliente_id: input.clienteId,
            barbeiro_id: input.barbeiroId,
            servico_id: input.servicoId,
            inicio: input.inicio,
            observacao: input.observacao ?? null,
        })
        .select(AGENDAMENTO_SELECT)
        .single()

    throwIfError(error)

    return data!
}

type ListAgendaInput = {
    /** Instantes ISO: o começo do primeiro dia e o começo do dia seguinte ao último. */
    de: string
    ate: string
    /** Só esta agenda. Para o barbeiro, o RLS já filtra. */
    barbeiroId?: string | null
}

export type ListAgendaOutput = Agendamento[]

/** A agenda do período, sem os cancelados. */
export async function listAgenda({ de, ate, barbeiroId }: ListAgendaInput): Promise<ListAgendaOutput> {
    let query = supabase
        .from("agendamentos")
        .select(AGENDAMENTO_SELECT)
        .gte("inicio", de)
        .lt("inicio", ate)
        .neq("status", AgendamentoStatuses.CANCELADO)
        .order("inicio")
        .limit(1000)

    if (barbeiroId) query = query.eq("barbeiro_id", barbeiroId)

    const { data, error } = await query

    throwIfError(error)

    return data ?? []
}

export type ListMeusProximosOutput = Agendamento[]

/** Os próximos horários confirmados de quem está logado (o RLS da equipe libera mais). */
export async function listMeusProximos(): Promise<ListMeusProximosOutput> {
    const userId = await requireUserId()
    const { data, error } = await supabase
        .from("agendamentos")
        .select(AGENDAMENTO_SELECT)
        .eq("cliente_id", userId)
        .eq("status", AgendamentoStatuses.CONFIRMADO)
        .gte("fim", new Date().toISOString())
        .order("inicio")

    throwIfError(error)

    return data ?? []
}

type ListMeuHistoricoInput = {
    page: number
}

export type ListMeuHistoricoOutput = PaginatedResponse<Agendamento>

/** Tudo o que já passou ou foi cancelado, do mais recente para o mais antigo. */
export async function listMeuHistorico({ page }: ListMeuHistoricoInput): Promise<ListMeuHistoricoOutput> {
    const userId = await requireUserId()
    const from = (page - 1) * PAGE_SIZE
    const { data, count, error } = await supabase
        .from("agendamentos")
        .select(AGENDAMENTO_SELECT, { count: "exact" })
        .eq("cliente_id", userId)
        .or(`status.neq.${AgendamentoStatuses.CONFIRMADO},fim.lt.${new Date().toISOString()}`)
        .order("inicio", { ascending: false })
        .range(from, from + PAGE_SIZE - 1)

    throwIfError(error)

    return paginate(data, count, page)
}

type ListMeusDoPeriodoInput = {
    de: string
    ate: string
}

/** Os horários do próprio cliente num período: é com eles que a tela conta a cota do mês. */
export async function listMeusDoPeriodo({ de, ate }: ListMeusDoPeriodoInput): Promise<Agendamento[]> {
    const userId = await requireUserId()
    const { data, error } = await supabase
        .from("agendamentos")
        .select(AGENDAMENTO_SELECT)
        .eq("cliente_id", userId)
        .gte("inicio", de)
        .lt("inicio", ate)
        .neq("status", AgendamentoStatuses.CANCELADO)

    throwIfError(error)

    return data ?? []
}

type ListAgendamentosClienteInput = {
    clienteId: string
    page: number
}

export type ListAgendamentosClienteOutput = PaginatedResponse<Agendamento>

/** Histórico de um cliente no painel (gestão). */
export async function listAgendamentosCliente({ clienteId, page }: ListAgendamentosClienteInput): Promise<ListAgendamentosClienteOutput> {
    const from = (page - 1) * PAGE_SIZE
    const { data, count, error } = await supabase
        .from("agendamentos")
        .select(AGENDAMENTO_SELECT, { count: "exact" })
        .eq("cliente_id", clienteId)
        .order("inicio", { ascending: false })
        .range(from, from + PAGE_SIZE - 1)

    throwIfError(error)

    return paginate(data, count, page)
}

type AgendamentoIdInput = {
    agendamentoId: string
}

async function updateAgendamento(agendamentoId: string, values: Database["public"]["Tables"]["agendamentos"]["Update"]) {
    const { data, error } = await supabase.from("agendamentos").update(values).eq("id", agendamentoId).select("id")

    throwIfError(error)
    assertAffected(data)
}

/** Cliente: até `cancelamento_min_horas` antes. Equipe: a qualquer hora. Libera a agenda. */
export async function cancelAgendamento({ agendamentoId }: AgendamentoIdInput): Promise<void> {
    await updateAgendamento(agendamentoId, { status: AgendamentoStatuses.CANCELADO })
}

type ConcluirAgendamentoInput = AgendamentoIdInput & {
    /** null quando não houve cobrança (entrou no plano ou cortesia). */
    formaPagamento: FormaPagamento | null
    valorRecebido: number
}

/** O que entrou no caixa. Valor zero dispensa a forma de pagamento. */
export async function concluirAgendamento({ agendamentoId, formaPagamento, valorRecebido }: ConcluirAgendamentoInput): Promise<void> {
    await updateAgendamento(agendamentoId, {
        status: AgendamentoStatuses.CONCLUIDO,
        forma_pagamento: formaPagamento,
        valor_recebido: valorRecebido,
    })
}

export async function marcarFalta({ agendamentoId }: AgendamentoIdInput): Promise<void> {
    await updateAgendamento(agendamentoId, { status: AgendamentoStatuses.FALTA })
}

type RemarcarAgendamentoInput = AgendamentoIdInput & {
    inicio: string
    /** Trocar de barbeiro é só da gestão. */
    barbeiroId: string
}

/** Equipe: muda dia, hora e (gestão) barbeiro. Preço e plano ficam os do dia em que foi marcado. */
export async function remarcarAgendamento({ agendamentoId, inicio, barbeiroId }: RemarcarAgendamentoInput): Promise<void> {
    await updateAgendamento(agendamentoId, { inicio, barbeiro_id: barbeiroId })
}

type UpdateObservacaoInput = AgendamentoIdInput & {
    observacao: string | null
}

export async function updateObservacao({ agendamentoId, observacao }: UpdateObservacaoInput): Promise<void> {
    await updateAgendamento(agendamentoId, { observacao })
}
