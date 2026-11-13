import { AssinaturaStatuses, type Periodicidade } from "~/lib/constants"
import { ApiError, assertAffected, throwIfError } from "~/lib/errors"
import type { Cota } from "~/lib/plano"
import { supabase } from "~/lib/supabase"
import type { Database } from "~/typings/database"

export type Assinatura = Database["public"]["Tables"]["assinaturas"]["Row"]

const ASSINATURA_SELECT =
    "id, cliente_id, plano_id, plano_nome, valor_mensal, periodicidade, dia_vencimento, status, vence_em, encerra_em, criado_em, ativada_em, cancelada_em"

export type MinhaAssinatura = Assinatura & {
    /** As cotas atuais do plano (a assinatura guarda nome e preço; a cota é a do plano). */
    cotas: Cota[]
}

type MinhaAssinaturaRow = Assinatura & {
    planos: { plano_cotas: Cota[] } | null
}

/** O plano em andamento (solicitado ou ativo) de quem está logado, ou `null`. */
export async function getMinhaAssinatura(): Promise<MinhaAssinatura | null> {
    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session) return null

    const { data, error } = await supabase
        .from("assinaturas")
        .select(`${ASSINATURA_SELECT}, planos(plano_cotas(categoria, limite))`)
        .eq("cliente_id", session.user.id)
        .neq("status", AssinaturaStatuses.CANCELADA)
        .maybeSingle()

    throwIfError(error)

    if (!data) return null

    const { planos, ...assinatura } = data as unknown as MinhaAssinaturaRow

    return { ...assinatura, cotas: planos?.plano_cotas ?? [] }
}

type CreateAssinaturaInput = {
    planoId: string
    periodicidade: Periodicidade
    /** Só a gestão abre plano para outra pessoa. Sem isto, é para quem está logado. */
    clienteId?: string
    diaVencimento?: number | null
}

export type CreateAssinaturaOutput = { id: string }

/**
 * Nasce `solicitada`, com o preço do plano no dia (`assinaturas_criar`). Vira ativa quando a
 * gerência registra o primeiro pagamento.
 */
export async function createAssinatura({
    planoId,
    periodicidade,
    clienteId,
    diaVencimento,
}: CreateAssinaturaInput): Promise<CreateAssinaturaOutput> {
    let cliente = clienteId

    if (!cliente) {
        const {
            data: { session },
        } = await supabase.auth.getSession()

        if (!session) throw new ApiError("Entre na sua conta para assinar.", { status: 401 })

        cliente = session.user.id
    }

    const { data, error } = await supabase
        .from("assinaturas")
        .insert({
            cliente_id: cliente,
            plano_id: planoId,
            periodicidade,
            dia_vencimento: diaVencimento ?? null,
        })
        .select("id")
        .single()

    throwIfError(error)

    return { id: data!.id }
}

type CancelAssinaturaInput = {
    assinaturaId: string
}

/**
 * Cliente: o pedido ainda não pago cancela na hora; o plano ativo vale até o fim do período
 * pago (`encerra_em`). Gestão: encerra na hora. Quem decide é o `assinaturas_protect`.
 */
export async function cancelAssinatura({ assinaturaId }: CancelAssinaturaInput): Promise<void> {
    const { data, error } = await supabase
        .from("assinaturas")
        .update({ status: AssinaturaStatuses.CANCELADA })
        .eq("id", assinaturaId)
        .select("id")

    throwIfError(error)
    assertAffected(data)
}

type UpdateAssinaturaInput = {
    assinaturaId: string
    planoId: string
    periodicidade: Periodicidade
    diaVencimento: number | null
}

/** Gestão: troca de plano (o preço vira o do plano novo), periodicidade e dia de vencimento. */
export async function updateAssinatura({ assinaturaId, planoId, periodicidade, diaVencimento }: UpdateAssinaturaInput): Promise<void> {
    const { data, error } = await supabase
        .from("assinaturas")
        .update({ plano_id: planoId, periodicidade, dia_vencimento: diaVencimento })
        .eq("id", assinaturaId)
        .select("id")

    throwIfError(error)
    assertAffected(data)
}

type DesfazerCancelamentoInput = {
    assinaturaId: string
}

/** Gestão: o cliente desistiu de cancelar. */
export async function desfazerCancelamento({ assinaturaId }: DesfazerCancelamentoInput): Promise<void> {
    const { data, error } = await supabase
        .from("assinaturas")
        .update({ encerra_em: null })
        .eq("id", assinaturaId)
        .select("id")

    throwIfError(error)
    assertAffected(data)
}

export type Solicitacao = Pick<Assinatura, "id" | "cliente_id" | "plano_nome" | "periodicidade" | "valor_mensal" | "criado_em"> & {
    cliente: { nome: string | null; telefone: string | null } | null
}

export type ListSolicitacoesOutput = Solicitacao[]

/** Pedidos de plano esperando o primeiro pagamento na casa. */
export async function listSolicitacoes(): Promise<ListSolicitacoesOutput> {
    const { data, error } = await supabase
        .from("assinaturas")
        .select("id, cliente_id, plano_nome, periodicidade, valor_mensal, criado_em, cliente:profiles!assinaturas_cliente_id_fkey(nome, telefone)")
        .eq("status", AssinaturaStatuses.SOLICITADA)
        .order("criado_em")

    throwIfError(error)

    return (data ?? []) as unknown as Solicitacao[]
}

type GetAssinaturaDoClienteInput = {
    clienteId: string
}

/** O plano em andamento de um cliente (gestão). */
export async function getAssinaturaDoCliente({ clienteId }: GetAssinaturaDoClienteInput): Promise<Assinatura | null> {
    const { data, error } = await supabase
        .from("assinaturas")
        .select(ASSINATURA_SELECT)
        .eq("cliente_id", clienteId)
        .neq("status", AssinaturaStatuses.CANCELADA)
        .maybeSingle()

    throwIfError(error)

    return data
}
