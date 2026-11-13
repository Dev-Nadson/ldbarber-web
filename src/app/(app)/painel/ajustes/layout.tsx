import { ADMIN_ROLES } from "~/lib/constants"
import { RequireRole } from "~/components/require-role"

type AjustesLayoutProps = {
    children: React.ReactNode
}

/** Só o admin: dados da casa, regras da agenda e papéis da equipe. */
export default function AjustesLayout({ children }: AjustesLayoutProps) {
    return <RequireRole roles={ADMIN_ROLES}>{children}</RequireRole>
}
