import { EQUIPE_ROLES, type Role } from "~/lib/constants"
import { ApiError, assertAffected, throwIfError } from "~/lib/errors"
import { supabase } from "~/lib/supabase"
import type { Database } from "~/typings/database"

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export type MeuPerfil = Pick<Profile, "id" | "nome" | "email" | "telefone" | "nascimento" | "lembrete_whatsapp">

const MEU_PERFIL_SELECT = "id, nome, email, telefone, nascimento, lembrete_whatsapp"

async function requireUserId() {
    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session) throw new ApiError("Entre na sua conta.", { status: 401 })

    return session.user.id
}

export type GetMeuPerfilOutput = MeuPerfil

export async function getMeuPerfil(): Promise<GetMeuPerfilOutput> {
    const userId = await requireUserId()
    const { data, error } = await supabase.from("profiles").select(MEU_PERFIL_SELECT).eq("id", userId).single()

    throwIfError(error)

    return data!
}

type UpdateMeuPerfilInput = {
    nome: string
    telefone: string
    nascimento: string | null
    lembreteWhatsapp: boolean
}

/** Dados do próprio cliente. O `profiles_protect` barra o resto (papel, e-mail). */
export async function updateMeuPerfil({ nome, telefone, nascimento, lembreteWhatsapp }: UpdateMeuPerfilInput): Promise<void> {
    const userId = await requireUserId()
    const { data, error } = await supabase
        .from("profiles")
        .update({ nome, telefone, nascimento, lembrete_whatsapp: lembreteWhatsapp })
        .eq("id", userId)
        .select("id")

    throwIfError(error)
    assertAffected(data)
}

export type MembroEquipe = Pick<Profile, "id" | "nome" | "email" | "role" | "criado_em">

const MEMBRO_SELECT = "id, nome, email, role, criado_em"

export type ListEquipeOutput = MembroEquipe[]

/** Admins primeiro, depois gerentes e barbeiros, por nome. */
export async function listEquipe(): Promise<ListEquipeOutput> {
    const { data, error } = await supabase
        .from("profiles")
        .select(MEMBRO_SELECT)
        .in("role", [...EQUIPE_ROLES])
        .order("role")
        .order("nome")

    throwIfError(error)

    return data ?? []
}

type FindProfileByEmailInput = {
    email: string
}

export type FindProfileByEmailOutput = MembroEquipe | null

/** Para pôr alguém na equipe ou ligar uma conta a um barbeiro: a pessoa cria a conta antes. */
export async function findProfileByEmail({ email }: FindProfileByEmailInput): Promise<FindProfileByEmailOutput> {
    const { data, error } = await supabase
        .from("profiles")
        .select(MEMBRO_SELECT)
        .ilike("email", email.trim().replace(/[%_\\]/g, "\\$&"))
        .maybeSingle()

    throwIfError(error)

    return data
}

type UpdateProfileRoleInput = {
    profileId: string
    role: Role
}

/** Só o admin, e nunca o próprio papel (`profiles_protect`). Tirar da equipe = voltar a cliente. */
export async function updateProfileRole({ profileId, role }: UpdateProfileRoleInput): Promise<void> {
    const { data, error } = await supabase.from("profiles").update({ role }).eq("id", profileId).select("id")

    throwIfError(error)
    assertAffected(data)
}
