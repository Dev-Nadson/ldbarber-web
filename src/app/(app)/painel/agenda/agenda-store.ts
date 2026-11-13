import { create } from "zustand"

import { addDays, today } from "~/lib/utils"

export const VisoesAgenda = {
    DIA: "dia",
    SEMANA: "semana",
} as const

export type VisaoAgenda = (typeof VisoesAgenda)[keyof typeof VisoesAgenda]

/** Filtro de barbeiro da lista do celular e da semana. */
export const TODOS_BARBEIROS = "todos"

type AgendaState = {
    dia: string
    visao: VisaoAgenda
    barbeiroFiltro: string
}

type AgendaStore = AgendaState & {
    setDia: (dia: string) => void
    /** Anda um dia (visão dia) ou uma semana (visão semana). */
    shift: (direcao: 1 | -1) => void
    irParaHoje: () => void
    setVisao: (visao: VisaoAgenda) => void
    setBarbeiroFiltro: (barbeiroId: string) => void
}

const useAgenda = create<AgendaStore>((set, get) => ({
    dia: today(),
    visao: VisoesAgenda.DIA,
    barbeiroFiltro: TODOS_BARBEIROS,

    setDia: (dia) => set({ dia }),
    shift: (direcao) => set({ dia: addDays(get().dia, direcao * (get().visao === VisoesAgenda.SEMANA ? 7 : 1)) }),
    irParaHoje: () => set({ dia: today() }),
    setVisao: (visao) => set({ visao }),
    setBarbeiroFiltro: (barbeiroFiltro) => set({ barbeiroFiltro }),
}))

export { useAgenda }
