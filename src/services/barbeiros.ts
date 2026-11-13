import type { Role } from "~/lib/constants"
import { ApiError, assertAffected, throwIfError } from "~/lib/errors"
import { supabase } from "~/lib/supabase"
import type { Database } from "~/typings/database"

export type Barbeiro = Database["public"]["Tables"]["barbeiros"]["Row"]
export type Expediente = Database["public"]["Tables"]["expedientes"]["Row"]

const BARBEIRO_SELECT = "id, nome, especialidade, profile_id, ativo, ordem, criado_em"

type ListBarbeirosInput = {
    /** Painel: os desativados também. O RLS só libera para a gestão. */
    incluirInativos?: boolean
}

export type ListBarbeirosOutput = Barbeiro[]

/** Na ordem da casa. É a ordem das colunas da agenda e do "tanto faz". */
export async function listBarbeiros({ incluirInativos = false }: ListBarbeirosInput = {}): Promise<ListBarbeirosOutput> {
    let query = supabase.from("barbeiros").select(BARBEIRO_SELECT).order("ordem").order("nome")

    if (!incluirInativos) query = query.eq("ativo", true)

    const { data, error } = await query

    throwIfError(error)

    return data ?? []
}

export type ContaBarbeiro = {
    id: string
    nome: string | null
    email: string | null
    role: Role
}

export type BarbeiroDetalhe = Barbeiro & {
    conta: ContaBarbeiro | null
    expedientes: Expediente[]
}

type BarbeiroDetalheRow = Barbeiro & {
    conta: ContaBarbeiro | null
    expedientes: Expediente[]
}

type GetBarbeiroInput = {
    barbeiroId: string
}

export type GetBarbeiroOutput = BarbeiroDetalhe

export async function getBarbeiro({ barbeiroId }: GetBarbeiroInput): Promise<GetBarbeiroOutput> {
    const { data, error } = await supabase
        .from("barbeiros")
        .select(
            `${BARBEIRO_SELECT}, conta:profiles!barbeiros_profile_id_fkey(id, nome, email, role), expedientes(id, barbeiro_id, dia_semana, abre, fecha, pausa_inicio, pausa_fim)`
        )
        .eq("id", barbeiroId)
        .maybeSingle()

    throwIfError(error)

    if (!data) throw new ApiError("Barbeiro não encontrado.", { status: 404 })

    const row = data as unknown as BarbeiroDetalheRow

    return { ...row, expedientes: [...row.expedientes].sort((a, b) => a.dia_semana - b.dia_semana) }
}

export type ListExpedientesOutput = Expediente[]

/** O expediente de todos: a grade de horários do site e da agenda sai daqui. */
export async function listExpedientes(): Promise<ListExpedientesOutput> {
    const { data, error } = await supabase
        .from("expedientes")
        .select("id, barbeiro_id, dia_semana, abre, fecha, pausa_inicio, pausa_fim")
        .order("dia_semana")

    throwIfError(error)

    return data ?? []
}

export type ExpedienteInput = {
    diaSemana: number
    abre: string
    fecha: string
    pausaInicio: string | null
    pausaFim: string | null
}

type SaveBarbeiroInput = {
    nome: string
    especialidade: string | null
    ordem: number
    profileId: string | null
    expedientes: ExpedienteInput[]
}

function toExpedienteRows(barbeiroId: string, expedientes: ExpedienteInput[]) {
    return expedientes.map((expediente) => ({
        barbeiro_id: barbeiroId,
        dia_semana: expediente.diaSemana,
        abre: expediente.abre,
        fecha: expediente.fecha,
        pausa_inicio: expediente.pausaInicio,
        pausa_fim: expediente.pausaFim,
    }))
}

/**
 * Troca o expediente inteiro: grava os dias que ficaram (upsert por barbeiro e dia) e apaga
 * os que saíram. Não é atômico, mas é a gestão e o erro aparece na tela: basta salvar de novo.
 */
async function saveExpedientes(barbeiroId: string, expedientes: ExpedienteInput[]) {
    const dias = expedientes.map((expediente) => expediente.diaSemana)

    let remove = supabase.from("expedientes").delete().eq("barbeiro_id", barbeiroId)

    if (dias.length) remove = remove.not("dia_semana", "in", `(${dias.join(",")})`)

    const { error: deleteError } = await remove

    throwIfError(deleteError)

    if (!expedientes.length) return

    const { data, error } = await supabase
        .from("expedientes")
        .upsert(toExpedienteRows(barbeiroId, expedientes), { onConflict: "barbeiro_id,dia_semana" })
        .select("id")

    throwIfError(error)
    assertAffected(data)
}

export type CreateBarbeiroOutput = { id: string }

/** Se o expediente falhar, o barbeiro recém-criado sai: não fica agenda sem horário. */
export async function createBarbeiro({ expedientes, profileId, ...input }: SaveBarbeiroInput): Promise<CreateBarbeiroOutput> {
    const { data, error } = await supabase
        .from("barbeiros")
        .insert({ ...input, profile_id: profileId })
        .select("id")
        .single()

    throwIfError(error)

    try {
        await saveExpedientes(data!.id, expedientes)
    } catch (expedienteError) {
        await supabase.from("barbeiros").delete().eq("id", data!.id)
        throw expedienteError
    }

    return { id: data!.id }
}

type UpdateBarbeiroInput = SaveBarbeiroInput & {
    barbeiroId: string
}

export async function updateBarbeiro({ barbeiroId, expedientes, profileId, ...input }: UpdateBarbeiroInput): Promise<void> {
    const { data, error } = await supabase
        .from("barbeiros")
        .update({ ...input, profile_id: profileId })
        .eq("id", barbeiroId)
        .select("id")

    throwIfError(error)
    assertAffected(data)

    await saveExpedientes(barbeiroId, expedientes)
}

type UpdateBarbeiroAtivoInput = {
    barbeiroId: string
    ativo: boolean
}

/** Desativado, sai do site e da agenda, mas o histórico (horários, caixa) continua. */
export async function updateBarbeiroAtivo({ barbeiroId, ativo }: UpdateBarbeiroAtivoInput): Promise<void> {
    const { data, error } = await supabase.from("barbeiros").update({ ativo }).eq("id", barbeiroId).select("id")

    throwIfError(error)
    assertAffected(data)
}

type DeleteBarbeiroInput = {
    barbeiroId: string
}

/** Só sai quem nunca teve horário marcado (chave estrangeira); os outros, desative. */
export async function deleteBarbeiro({ barbeiroId }: DeleteBarbeiroInput): Promise<void> {
    const { data, error } = await supabase.from("barbeiros").delete().eq("id", barbeiroId).select("id")

    throwIfError(error)
    assertAffected(data)
}
