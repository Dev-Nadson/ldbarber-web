import { GESTAO_ROLES } from "~/lib/constants"
import { RequireRole } from "~/components/require-role"

type GestaoLayoutProps = {
    children: React.ReactNode
}

/** Só gerente e admin. O barbeiro que cair aqui volta para a agenda. */
export default function GestaoLayout({ children }: GestaoLayoutProps) {
    return <RequireRole roles={GESTAO_ROLES}>{children}</RequireRole>
}
