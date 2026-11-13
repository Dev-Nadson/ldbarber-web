import {
    MESES_POR_PERIODICIDADE,
    Periodicidades,
    SITUACOES_COM_BENEFICIO,
    Situacoes,
    type AssinaturaStatus,
    type Categoria,
    type Periodicidade,
    type Situacao,
} from "~/lib/constants"
import { addDays, addMonths, dateKeyOf } from "~/lib/utils"

/**
 * Regras do plano vistas do navegador. São a **prévia** do banco:
 * `situacao_assinatura()`, a cota do `agendamentos_criar` e o cálculo do
 * `mensalidades_criar` (schema.sql, seção 5). Mudou um, muda o outro.
 */

type SituacaoInput = {
    status: AssinaturaStatus
    vence_em: string | null
    encerra_em: string | null
}

/** Em dia até o vencimento; pendente até `tolerancia` dias depois; atrasado depois disso. */
export function situacaoAssinatura({ status, vence_em, encerra_em }: SituacaoInput, hoje: string, tolerancia: number): Situacao {
    if (status === "cancelada") return Situacoes.CANCELADA
    if (status === "solicitada" || !vence_em) return Situacoes.SOLICITADA
    if (encerra_em && hoje > encerra_em) return Situacoes.ENCERRADA
    if (hoje <= vence_em) return Situacoes.EM_DIA
    if (hoje <= addDays(vence_em, tolerancia)) return Situacoes.PENDENTE

    return Situacoes.ATRASADO
}

export function temBeneficio(situacao: Situacao | null | undefined) {
    return Boolean(situacao && SITUACOES_COM_BENEFICIO.includes(situacao))
}

function arredondar(valor: number) {
    return Math.round(valor * 100) / 100
}

/** O valor de um pagamento: o mês, ou o trimestre com desconto. */
export function valorPeriodo(valorMensal: number, periodicidade: Periodicidade, descontoTrimestral: number) {
    const meses = MESES_POR_PERIODICIDADE[periodicidade]
    const desconto = periodicidade === Periodicidades.TRIMESTRAL ? 1 - descontoTrimestral / 100 : 1

    return arredondar(valorMensal * meses * desconto)
}

/** O preço por mês no trimestral (o que o card mostra com a chave "Trimestral −10%"). */
export function valorMensalEquivalente(valorMensal: number, periodicidade: Periodicidade, descontoTrimestral: number) {
    return arredondar(valorPeriodo(valorMensal, periodicidade, descontoTrimestral) / MESES_POR_PERIODICIDADE[periodicidade])
}

type ProximoVencimentoInput = {
    venceEm: string | null
    diaVencimento: number | null
    periodicidade: Periodicidade
    hoje: string
}

/**
 * Até quando vale o próximo pagamento. O primeiro conta de hoje; os seguintes, do vencimento
 * anterior (mesmo pago com atraso). Igual ao `mensalidades_criar`.
 */
export function proximoVencimento({ venceEm, diaVencimento, periodicidade, hoje }: ProximoVencimentoInput) {
    const dia = diaVencimento ?? Math.min(Number(hoje.slice(8, 10)), 28)
    const base = venceEm ?? hoje

    return addDays(addMonths(base, MESES_POR_PERIODICIDADE[periodicidade]), dia - 1)
}

export type Cota = {
    categoria: Categoria
    /** null = ilimitado. */
    limite: number | null
}

export type UsoDoMes = Partial<Record<Categoria, number>>

type AgendamentoDoUso = {
    inicio: string
    status: string
    incluso_plano: boolean
    categorias: Categoria[]
}

/** O que o cliente já gastou da cota no mês de `dia` (mês do calendário, hora da barbearia). */
export function usoDoMes(agendamentos: AgendamentoDoUso[], dia: string): UsoDoMes {
    const mes = dia.slice(0, 7)
    const uso: UsoDoMes = {}

    for (const agendamento of agendamentos) {
        if (!agendamento.incluso_plano || agendamento.status === "cancelado") continue
        if (dateKeyOf(agendamento.inicio).slice(0, 7) !== mes) continue

        for (const categoria of agendamento.categorias) uso[categoria] = (uso[categoria] ?? 0) + 1
    }

    return uso
}

/**
 * O serviço entra no plano se **todas** as categorias dele têm cota sobrando. Serviço sem
 * categoria nunca entra. Igual ao laço do `agendamentos_criar`.
 */
export function coberturaPlano(categorias: Categoria[], cotas: Cota[], uso: UsoDoMes) {
    if (!categorias.length) return false

    return categorias.every((categoria) => {
        const cota = cotas.find((item) => item.categoria === categoria)

        if (!cota) return false

        return cota.limite === null || (uso[categoria] ?? 0) < cota.limite
    })
}

/** "4 cortes" / "Barba ilimitada" — o que sobra da cota, para o início do cliente. */
export function restanteDaCota(cota: Cota, uso: UsoDoMes) {
    if (cota.limite === null) return null

    return Math.max(0, cota.limite - (uso[cota.categoria] ?? 0))
}
