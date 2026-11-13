import { create } from "zustand"

import { PeriodosCaixa, type PeriodoCaixa } from "~/lib/constants"

type FinanceiroStore = {
    periodo: PeriodoCaixa
    /** Página da lista de lançamentos (paginada na tela: o período inteiro já veio). */
    page: number
    setPeriodo: (periodo: PeriodoCaixa) => void
    setPage: (page: number) => void
}

const useFinanceiro = create<FinanceiroStore>((set) => ({
    periodo: PeriodosCaixa.HOJE,
    page: 1,

    setPeriodo: (periodo) => set({ periodo, page: 1 }),
    setPage: (page) => set({ page }),
}))

export { useFinanceiro }
