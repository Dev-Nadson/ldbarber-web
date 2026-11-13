import type { Categoria } from "~/lib/constants"
import { ApiError, assertAffected, throwIfError } from "~/lib/errors"
import type { Cota } from "~/lib/plano"
import { supabase } from "~/lib/supabase"
import type { Database } from "~/typings/database"

export type PlanoRow = Database["public"]["Tables"]["planos"]["Row"]

export type Plano = PlanoRow & {
    cotas: Cota[]
}

const PLANO_SELECT =
    "id, nome, resumo, preco_mensal, beneficios, nao_inclui, destaque, ativo, ordem, criado_em, atualizado_em, plano_cotas(categoria, limite)"

type PlanoComCotasRow = PlanoRow & {
    plano_cotas: Cota[]
}

function toPlano({ plano_cotas, ...plano }: PlanoComCotasRow): Plano {
    return { ...plano, cotas: plano_cotas }
}

type ListPlanosInput = {
    /** Painel: os desativados também. O RLS só libera para a gestão. */
    incluirInativos?: boolean
}

export type ListPlanosOutput = Plano[]

export async function listPlanos({ incluirInativos = false }: ListPlanosInput = {}): Promise<ListPlanosOutput> {
    let query = supabase.from("planos").select(PLANO_SELECT).order("ordem").order("preco_mensal")

    if (!incluirInativos) query = query.eq("ativo", true)

    const { data, error } = await query

    throwIfError(error)

    return ((data ?? []) as unknown as PlanoComCotasRow[]).map(toPlano)
}

type GetPlanoInput = {
    planoId: string
}

export type GetPlanoOutput = Plano

export async function getPlano({ planoId }: GetPlanoInput): Promise<GetPlanoOutput> {
    const { data, error } = await supabase.from("planos").select(PLANO_SELECT).eq("id", planoId).maybeSingle()

    throwIfError(error)

    if (!data) throw new ApiError("Plano não encontrado.", { status: 404 })

    return toPlano(data as unknown as PlanoComCotasRow)
}

export type CotaInput = {
    categoria: Categoria
    limite: number | null
}

type SavePlanoInput = {
    nome: string
    resumo: string | null
    precoMensal: number
    beneficios: string[]
    naoInclui: string[]
    destaque: boolean
    ativo: boolean
    ordem: number
    cotas: CotaInput[]
}

function toPlanoRow(input: SavePlanoInput) {
    return {
        nome: input.nome,
        resumo: input.resumo,
        preco_mensal: input.precoMensal,
        beneficios: input.beneficios,
        nao_inclui: input.naoInclui,
        destaque: input.destaque,
        ativo: input.ativo,
        ordem: input.ordem,
    }
}

/** Troca as cotas inteiras. Não é atômico (é a gestão, e o erro aparece): salve de novo. */
async function saveCotas(planoId: string, cotas: CotaInput[]) {
    const { error: deleteError } = await supabase.from("plano_cotas").delete().eq("plano_id", planoId)

    throwIfError(deleteError)

    if (!cotas.length) return

    const { data, error } = await supabase
        .from("plano_cotas")
        .insert(cotas.map((cota) => ({ plano_id: planoId, categoria: cota.categoria, limite: cota.limite })))
        .select("plano_id")

    throwIfError(error)
    assertAffected(data)
}

export type CreatePlanoOutput = { id: string }

/** Se as cotas falharem, o plano recém-criado sai: plano sem cota não cobre nada. */
export async function createPlano(input: SavePlanoInput): Promise<CreatePlanoOutput> {
    const { data, error } = await supabase.from("planos").insert(toPlanoRow(input)).select("id").single()

    throwIfError(error)

    try {
        await saveCotas(data!.id, input.cotas)
    } catch (cotasError) {
        await supabase.from("planos").delete().eq("id", data!.id)
        throw cotasError
    }

    return { id: data!.id }
}

type UpdatePlanoInput = SavePlanoInput & {
    planoId: string
}

/**
 * Preço novo vale para quem assinar a partir de agora: cada assinatura guarda o valor do dia
 * em que foi aberta. As cotas novas valem para os próximos horários de todo mundo.
 */
export async function updatePlano({ planoId, ...input }: UpdatePlanoInput): Promise<void> {
    const { data, error } = await supabase.from("planos").update(toPlanoRow(input)).eq("id", planoId).select("id")

    throwIfError(error)
    assertAffected(data)

    await saveCotas(planoId, input.cotas)
}

type DeletePlanoInput = {
    planoId: string
}

/** Só sai plano que ninguém assinou (chave estrangeira); os outros, desative. */
export async function deletePlano({ planoId }: DeletePlanoInput): Promise<void> {
    const { data, error } = await supabase.from("planos").delete().eq("id", planoId).select("id")

    throwIfError(error)
    assertAffected(data)
}
