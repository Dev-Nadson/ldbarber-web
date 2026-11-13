"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { LoaderCircle, Search } from "lucide-react"

import { useDebouncedCallback } from "~/hooks/use-debounced-callback"
import { QUERIES } from "~/lib/queries"
import { formatPhone } from "~/lib/utils"
import { searchClientes, type ClienteBusca as Cliente } from "~/services/clientes"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Iniciais } from "~/components/iniciais"

type ClienteBuscaProps = {
    id: string
    value: Cliente | null
    onChange: (cliente: Cliente | null) => void
    disabled?: boolean
    invalid?: boolean
}

/** Busca de cliente do encaixe (nome, e-mail ou telefone). Todo cliente tem conta. */
export function ClienteBusca({ id, value, onChange, disabled = false, invalid = false }: ClienteBuscaProps) {
    const [termo, setTermo] = useState("")
    const buscar = useDebouncedCallback((texto: string) => setTermo(texto))

    const { data: resultados, isFetching } = useQuery({
        queryKey: [QUERIES.SEARCH_CLIENTES, { search: termo }],
        queryFn: () => searchClientes({ search: termo }),
        enabled: termo.trim().length >= 2,
    })

    if (value) {
        return (
            <div className="flex items-center gap-3 rounded-md border bg-secondary px-3 py-2.5">
                <Iniciais nome={value.nome} destaque />
                <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{value.nome ?? value.email}</p>
                    <p className="truncate text-sm text-muted-foreground">{formatPhone(value.telefone)}</p>
                </div>
                <Button type="button" variant="link" disabled={disabled} onClick={() => onChange(null)}>
                    Trocar
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    id={id}
                    size="xl"
                    placeholder="Nome, e-mail ou WhatsApp"
                    className="pl-10"
                    autoComplete="off"
                    disabled={disabled}
                    aria-invalid={invalid}
                    onChange={(event) => buscar(event.target.value)}
                />
                {isFetching && <LoaderCircle className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
            </div>
            {termo.trim().length >= 2 && resultados && (
                <ul className="divide-y overflow-hidden rounded-md border bg-card">
                    {resultados.map((cliente) => (
                        <li key={cliente.id}>
                            <button
                                type="button"
                                onClick={() => onChange(cliente)}
                                className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted"
                            >
                                <Iniciais nome={cliente.nome} />
                                <span className="min-w-0">
                                    <span className="block truncate font-medium">{cliente.nome ?? cliente.email}</span>
                                    <span className="block truncate text-sm text-muted-foreground">
                                        {formatPhone(cliente.telefone)} · {cliente.email}
                                    </span>
                                </span>
                            </button>
                        </li>
                    ))}
                    {!resultados.length && (
                        <li className="px-3 py-4 text-sm text-muted-foreground">
                            Nenhum cliente encontrado. A pessoa precisa criar a conta no site antes.
                        </li>
                    )}
                </ul>
            )}
        </div>
    )
}
