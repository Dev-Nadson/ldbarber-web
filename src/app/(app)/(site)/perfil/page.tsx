import type { Metadata } from "next"

import { PageHeader } from "~/components/page-header"
import { PerfilDados } from "./perfil-dados"
import { PerfilPlano } from "./perfil-plano"
import { PerfilSenha } from "./perfil-senha"

export const metadata: Metadata = {
    title: "Perfil",
}

export default function PerfilPage() {
    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 pb-24 md:pb-12 lg:py-10">
            <PageHeader eyebrow="Conta" title="Perfil" variant="marca" />
            <PerfilPlano />
            <PerfilDados />
            <PerfilSenha />
        </div>
    )
}
