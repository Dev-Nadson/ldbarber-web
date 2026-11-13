import { create } from "zustand"

import { addMonths, today } from "~/lib/utils"

type DisponibilidadeState = {
    /** Dia 1 do mês aberto no calendário (`YYYY-MM-01`). */
    mes: string
    /** O dia escolhido (`YYYY-MM-DD`). */
    dia: string
}

type DisponibilidadeStore = DisponibilidadeState & {
    shiftMonth: (amount: number) => void
    setDia: (dia: string) => void
}

/** Trocar de mês leva a escolha para o dia 1 dele (ou hoje, se for o mês atual). */
const useDisponibilidade = create<DisponibilidadeStore>((set, get) => ({
    mes: `${today().slice(0, 7)}-01`,
    dia: today(),

    shiftMonth: (amount) => {
        const mes = addMonths(get().mes, amount)

        set({ mes, dia: mes.slice(0, 7) === today().slice(0, 7) ? today() : mes })
    },
    setDia: (dia) => set({ dia }),
}))

export { useDisponibilidade }
