import { create } from "zustand"

import { ClienteFiltros, type ClienteFiltro } from "~/lib/constants"

type ClientesFilters = {
    page: number
    search: string
    filtro: ClienteFiltro
}

type ClientesStore = ClientesFilters & {
    setPage: (page: number) => void
    setSearch: (search: string) => void
    setFiltro: (filtro: ClienteFiltro) => void
}

/** Todo filtro volta para a primeira página. */
const useClientes = create<ClientesStore>((set) => ({
    page: 1,
    search: "",
    filtro: ClienteFiltros.TODOS,

    setPage: (page) => set({ page }),
    setSearch: (search) => set({ search, page: 1 }),
    setFiltro: (filtro) => set({ filtro, page: 1 }),
}))

export { useClientes }
