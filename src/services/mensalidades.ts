import type { FormaPagamento } from "~/lib/constants"
import { assertAffected, throwIfError } from "~/lib/errors"
import { supabase } from "~/lib/supabase"
import type { Database } from "~/typings/database"

export type Mensalidade = Database["public"]["Tables"]["mensalidades"]["Row"]

const MENSALIDADE_SELECT =
    "id, assinatura_id, cliente_id, cliente_nome, plano_nome, meses, periodo_inicio, periodo_fim, vence_em_anterior, valor, forma_pagamento, recebido_por, recebido_em, estornada, estornada_em"

type ListMensalidadesInput = {
    assinaturaId: string
}

export type ListMensalidadesOutput = Mensalidade[]

export async function listMensalidades({ assinaturaId }: ListMensalidadesInput): Promise<ListMensalidadesOutput> {
    const { data, error } = await supabase
        .from("mensalidades")
        .select(MENSALIDADE_SELECT)
        .eq("assinatura_id", assinaturaId)
        .order("recebido_em", { ascending: false })

    throwIfError(error)

    return data ?? []
}

type CreateMensalidadeInput = {
    assinaturaId: string
    formaPagamento: FormaPagamento
}

/**
 * Pagamento recebido na casa. O valor (mês ou trimestre com desconto) e o novo vencimento
 * são do `mensalidades_criar`; o primeiro pagamento ativa o plano.
 */
export async function createMensalidade({ assinaturaId, formaPagamento }: CreateMensalidadeInput): Promise<void> {
    const { data, error } = await supabase
        .from("mensalidades")
        .insert({ assinatura_id: assinaturaId, forma_pagamento: formaPagamento })
        .select("id")

    throwIfError(error)
    assertAffected(data)
}

type EstornarMensalidadeInput = {
    mensalidadeId: string
}

/** Só o último pagamento do plano; devolve o vencimento anterior. */
export async function estornarMensalidade({ mensalidadeId }: EstornarMensalidadeInput): Promise<void> {
    const { data, error } = await supabase
        .from("mensalidades")
        .update({ estornada: true })
        .eq("id", mensalidadeId)
        .select("id")

    throwIfError(error)
    assertAffected(data)
}
