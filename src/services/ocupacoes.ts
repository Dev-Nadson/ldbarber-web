import { throwIfError } from "~/lib/errors"
import { supabase } from "~/lib/supabase"
import type { Ocupacao } from "~/lib/agenda"

type ListOcupacoesInput = {
    /** Instantes ISO do período. */
    de: string
    ate: string
}

export type ListOcupacoesOutput = Ocupacao[]

/**
 * A agenda pública: só barbeiro e intervalo (horários marcados e bloqueios), sem nada do
 * cliente. É dela que o site calcula os horários livres, mesmo sem login.
 */
export async function listOcupacoes({ de, ate }: ListOcupacoesInput): Promise<ListOcupacoesOutput> {
    const { data, error } = await supabase
        .from("ocupacoes")
        .select("barbeiro_id, inicio, fim")
        .lt("inicio", ate)
        .gt("fim", de)
        .order("inicio")
        .limit(5000)

    throwIfError(error)

    return data ?? []
}
