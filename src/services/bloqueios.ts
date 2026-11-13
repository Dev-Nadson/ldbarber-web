import { assertAffected, throwIfError } from "~/lib/errors"
import { supabase } from "~/lib/supabase"
import type { Database } from "~/typings/database"

export type Bloqueio = Database["public"]["Tables"]["bloqueios"]["Row"]

type ListBloqueiosInput = {
    de: string
    ate: string
}

export type ListBloqueiosOutput = Bloqueio[]

/** Os bloqueios do período (o barbeiro vê só os dele: RLS). */
export async function listBloqueios({ de, ate }: ListBloqueiosInput): Promise<ListBloqueiosOutput> {
    const { data, error } = await supabase
        .from("bloqueios")
        .select("id, barbeiro_id, inicio, fim, motivo, criado_por, criado_em")
        .lt("inicio", ate)
        .gt("fim", de)
        .order("inicio")

    throwIfError(error)

    return data ?? []
}

type CreateBloqueiosInput = {
    /** Um bloqueio por barbeiro: fechar a casa é bloquear todos. */
    barbeiroIds: string[]
    inicio: string
    fim: string
    motivo: string | null
}

/** Esbarrar num horário marcado volta o erro do banco ("Já há horário marcado nesse período"). */
export async function createBloqueios({ barbeiroIds, inicio, fim, motivo }: CreateBloqueiosInput): Promise<void> {
    const { data, error } = await supabase
        .from("bloqueios")
        .insert(barbeiroIds.map((barbeiroId) => ({ barbeiro_id: barbeiroId, inicio, fim, motivo })))
        .select("id")

    throwIfError(error)
    assertAffected(data)
}

type DeleteBloqueioInput = {
    bloqueioId: string
}

export async function deleteBloqueio({ bloqueioId }: DeleteBloqueioInput): Promise<void> {
    const { data, error } = await supabase.from("bloqueios").delete().eq("id", bloqueioId).select("id")

    throwIfError(error)
    assertAffected(data)
}
