"use client"

import { useState } from "react"
import { Search } from "lucide-react"

import { useDebouncedCallback } from "~/hooks/use-debounced-callback"
import { ClienteFiltroLabels, ClienteFiltros } from "~/lib/constants"
import { Input } from "~/components/ui/input"
import { Segmentado } from "~/components/segmentado"
import { useClientes } from "./clientes-store"

const OPCOES = Object.values(ClienteFiltros).map((filtro) => ({ value: filtro, label: ClienteFiltroLabels[filtro] }))

export function ClientesActions() {
    const { search, filtro, setSearch, setFiltro } = useClientes()

    // Campo não controlado: o valor inicial vem do store uma vez só, ao montar.
    const [initialSearch] = useState(search)
    const handleSearchChange = useDebouncedCallback((value: string) => setSearch(value))

    return (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full lg:w-80">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    aria-label="Buscar clientes"
                    placeholder="Buscar por nome ou telefone"
                    className="h-10 pl-9"
                    defaultValue={initialSearch}
                    onChange={(event) => handleSearchChange(event.target.value)}
                />
            </div>
            <div className="scrollbar-none -mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
                <Segmentado aria-label="Filtrar clientes" value={filtro} onChange={setFiltro} options={OPCOES} />
            </div>
        </div>
    )
}
