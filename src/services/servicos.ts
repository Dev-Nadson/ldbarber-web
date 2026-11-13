import type { Categoria } from "~/lib/constants"
import { assertAffected, throwIfError } from "~/lib/errors"
import { supabase } from "~/lib/supabase"
import type { Database } from "~/typings/database"

export type Servico = Database["public"]["Tables"]["servicos"]["Row"]

const SERVICO_SELECT = "id, nome, descricao, duracao_min, preco, categorias, ativo, ordem, criado_em"

type ListServicosInput = {
    /** Painel: os desativados também. O RLS só libera para a gestão. */
    incluirInativos?: boolean
}

export type ListServicosOutput = Servico[]

export async function listServicos({ incluirInativos = false }: ListServicosInput = {}): Promise<ListServicosOutput> {
    let query = supabase.from("servicos").select(SERVICO_SELECT).order("ordem").order("nome")

    if (!incluirInativos) query = query.eq("ativo", true)

    const { data, error } = await query

    throwIfError(error)

    return data ?? []
}

type SaveServicoInput = {
    nome: string
    descricao: string | null
    duracaoMin: number
    preco: number
    categorias: Categoria[]
    ordem: number
    ativo: boolean
}

function toServicoRow({ duracaoMin, ...input }: SaveServicoInput) {
    return { ...input, duracao_min: duracaoMin }
}

export async function createServico(input: SaveServicoInput): Promise<void> {
    const { data, error } = await supabase.from("servicos").insert(toServicoRow(input)).select("id")

    throwIfError(error)
    assertAffected(data)
}

type UpdateServicoInput = SaveServicoInput & {
    servicoId: string
}

/** Mudar o preço não mexe nos horários já marcados: cada um guarda o preço do dia. */
export async function updateServico({ servicoId, ...input }: UpdateServicoInput): Promise<void> {
    const { data, error } = await supabase.from("servicos").update(toServicoRow(input)).eq("id", servicoId).select("id")

    throwIfError(error)
    assertAffected(data)
}

type DeleteServicoInput = {
    servicoId: string
}

/** Os horários marcados guardam o nome e o preço; o serviço some só da escolha. */
export async function deleteServico({ servicoId }: DeleteServicoInput): Promise<void> {
    const { data, error } = await supabase.from("servicos").delete().eq("id", servicoId).select("id")

    throwIfError(error)
    assertAffected(data)
}
