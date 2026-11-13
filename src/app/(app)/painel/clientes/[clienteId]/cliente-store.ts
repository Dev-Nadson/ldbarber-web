import { create } from "zustand"

type ClienteStore = {
    /** Página do histórico de horários. */
    page: number
    setPage: (page: number) => void
}

const useCliente = create<ClienteStore>((set) => ({
    page: 1,
    setPage: (page) => set({ page }),
}))

export { useCliente }
