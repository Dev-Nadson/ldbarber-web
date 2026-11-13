import { create } from "zustand"

type MeusHorariosStore = {
    page: number
    setPage: (page: number) => void
}

/** Página do histórico. */
const useMeusHorarios = create<MeusHorariosStore>((set) => ({
    page: 1,
    setPage: (page) => set({ page }),
}))

export { useMeusHorarios }
