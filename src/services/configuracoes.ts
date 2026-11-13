import { assertAffected, throwIfError } from "~/lib/errors"
import { supabase } from "~/lib/supabase"
import type { Database } from "~/typings/database"

export type Configuracao = Database["public"]["Tables"]["configuracoes"]["Row"]

const CONFIGURACAO_SELECT =
    "id, endereco, whatsapp, instagram, aviso, chave_pix, intervalo_min, antecedencia_avulso_dias, antecedencia_assinante_dias, cancelamento_min_horas, max_agendamentos_abertos, tolerancia_atraso_dias, desconto_trimestral, atualizado_em"

export type GetConfiguracaoOutput = Configuracao

/** Pública: o site inteiro lê (aviso, WhatsApp, regras da agenda). */
export async function getConfiguracao(): Promise<GetConfiguracaoOutput> {
    const { data, error } = await supabase.from("configuracoes").select(CONFIGURACAO_SELECT).eq("id", 1).single()

    throwIfError(error)

    return data!
}

type UpdateCasaInput = {
    endereco: string | null
    whatsapp: string | null
    instagram: string | null
    aviso: string | null
    chavePix: string | null
}

export async function updateCasa({ chavePix, ...input }: UpdateCasaInput): Promise<void> {
    const { data, error } = await supabase
        .from("configuracoes")
        .update({ ...input, chave_pix: chavePix })
        .eq("id", 1)
        .select("id")

    throwIfError(error)
    assertAffected(data)
}

type UpdateRegrasInput = {
    intervaloMin: number
    antecedenciaAvulsoDias: number
    antecedenciaAssinanteDias: number
    cancelamentoMinHoras: number
    maxAgendamentosAbertos: number
    toleranciaAtrasoDias: number
    descontoTrimestral: number
}

/** As regras que o `agendamentos_criar` e o `mensalidades_criar` aplicam. */
export async function updateRegras(input: UpdateRegrasInput): Promise<void> {
    const { data, error } = await supabase
        .from("configuracoes")
        .update({
            intervalo_min: input.intervaloMin,
            antecedencia_avulso_dias: input.antecedenciaAvulsoDias,
            antecedencia_assinante_dias: input.antecedenciaAssinanteDias,
            cancelamento_min_horas: input.cancelamentoMinHoras,
            max_agendamentos_abertos: input.maxAgendamentosAbertos,
            tolerancia_atraso_dias: input.toleranciaAtrasoDias,
            desconto_trimestral: input.descontoTrimestral,
        })
        .eq("id", 1)
        .select("id")

    throwIfError(error)
    assertAffected(data)
}
