import type { FormaPagamento } from "~/lib/constants"

/**
 * Totais do caixa a partir dos lançamentos do período (view `caixa`). O volume de uma
 * barbearia cabe inteiro na tela, então a soma é feita aqui, e não em mais uma view.
 */

export type Lancamento = {
    tipo: "atendimento" | "mensalidade" | null
    barbeiro_id: string | null
    barbeiro_nome: string | null
    forma_pagamento: FormaPagamento | null
    valor: number | null
    incluso_plano: boolean | null
}

export type TotalBarbeiro = {
    barbeiroId: string
    nome: string
    atendimentos: number
    inclusos: number
    valor: number
}

export function resumoCaixa(lancamentos: Lancamento[]) {
    const porForma: Partial<Record<FormaPagamento, number>> = {}
    const porBarbeiro = new Map<string, TotalBarbeiro>()
    let total = 0
    let atendimentos = 0
    let valorAtendimentos = 0
    let mensalidades = 0
    let valorMensalidades = 0
    let inclusos = 0

    for (const lancamento of lancamentos) {
        const valor = lancamento.valor ?? 0

        total += valor

        if (lancamento.forma_pagamento) {
            porForma[lancamento.forma_pagamento] = (porForma[lancamento.forma_pagamento] ?? 0) + valor
        }

        if (lancamento.tipo === "mensalidade") {
            mensalidades += 1
            valorMensalidades += valor
            continue
        }

        atendimentos += 1
        valorAtendimentos += valor
        if (lancamento.incluso_plano) inclusos += 1

        if (lancamento.barbeiro_id) {
            const atual = porBarbeiro.get(lancamento.barbeiro_id) ?? {
                barbeiroId: lancamento.barbeiro_id,
                nome: lancamento.barbeiro_nome ?? "Barbeiro",
                atendimentos: 0,
                inclusos: 0,
                valor: 0,
            }

            atual.atendimentos += 1
            atual.valor += valor
            if (lancamento.incluso_plano) atual.inclusos += 1
            porBarbeiro.set(lancamento.barbeiro_id, atual)
        }
    }

    return {
        total,
        atendimentos,
        valorAtendimentos,
        mensalidades,
        valorMensalidades,
        inclusos,
        porForma,
        porBarbeiro: [...porBarbeiro.values()].sort((a, b) => b.valor - a.valor),
    }
}
