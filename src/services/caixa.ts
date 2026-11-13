import { throwIfError } from "~/lib/errors"
import { supabase } from "~/lib/supabase"
import type { Database } from "~/typings/database"

/** Um lançamento da view `caixa`: atendimento concluído ou mensalidade não estornada. */
export type LancamentoCaixa = Database["public"]["Views"]["caixa"]["Row"]

type ListCaixaInput = {
    /** Datas `YYYY-MM-DD` (dia da barbearia), inclusive. */
    de: string
    ate: string
}

export type ListCaixaOutput = LancamentoCaixa[]

export async function listCaixa({ de, ate }: ListCaixaInput): Promise<ListCaixaOutput> {
    const { data, error } = await supabase
        .from("caixa")
        .select("id, tipo, data, momento, barbeiro_id, barbeiro_nome, cliente_id, cliente_nome, descricao, forma_pagamento, valor, incluso_plano")
        .gte("data", de)
        .lte("data", ate)
        .order("momento", { ascending: false })
        .limit(5000)

    throwIfError(error)

    return data ?? []
}
