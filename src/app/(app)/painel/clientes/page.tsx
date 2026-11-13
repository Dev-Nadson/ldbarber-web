import type { Metadata } from "next"

import { ClientesActions } from "./clientes-actions"
import { ClientesHeader } from "./clientes-header"
import { ClientesList } from "./clientes-list"

export const metadata: Metadata = {
    title: "Clientes",
}

export default function ClientesPage() {
    return (
        <>
            <ClientesHeader />
            <ClientesActions />
            <ClientesList />
        </>
    )
}
