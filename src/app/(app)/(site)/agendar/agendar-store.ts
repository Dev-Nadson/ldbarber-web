import { create } from "zustand"

/** "Tanto faz": o banco recebe o primeiro barbeiro livre naquele horário, na ordem da casa. */
export const QUALQUER_BARBEIRO = "qualquer"

type AgendarState = {
    servicoId: string | null
    /** Id do barbeiro ou `QUALQUER_BARBEIRO`. */
    barbeiroId: string | null
    dia: string | null
    hora: string | null
    /** Passo do celular (1 serviço, 2 barbeiro, 3 dia e hora, 4 resumo). No computador, tudo junto. */
    passo: number
}

type AgendarStore = AgendarState & {
    reset: (dia: string | null) => void
    setServico: (servicoId: string) => void
    setBarbeiro: (barbeiroId: string) => void
    setDia: (dia: string) => void
    setHora: (hora: string) => void
    setPasso: (passo: number) => void
}

/** Trocar dia limpa a hora: o horário escolhido pode não existir no outro dia. */
const useAgendar = create<AgendarStore>((set) => ({
    servicoId: null,
    barbeiroId: null,
    dia: null,
    hora: null,
    passo: 1,

    reset: (dia) => set({ servicoId: null, barbeiroId: null, dia, hora: null, passo: 1 }),
    setServico: (servicoId) => set({ servicoId }),
    setBarbeiro: (barbeiroId) => set({ barbeiroId }),
    setDia: (dia) => set({ dia, hora: null }),
    setHora: (hora) => set({ hora }),
    setPasso: (passo) => set({ passo }),
}))

export { useAgendar }
