import type { Metadata } from "next"

import { AuthLayout } from "~/components/auth-layout"
import { SigninForm } from "~/components/forms/signin-form"
import { AuthLink } from "../auth-link"

export const metadata: Metadata = {
    title: "Entrar",
}

export default function SigninPage() {
    return (
        <AuthLayout
            title="Entrar"
            description="Bem-vindo de volta à cadeira."
            footer={
                <>
                    Primeira vez? <AuthLink href="/cadastrar">Criar conta</AuthLink>
                </>
            }
        >
            <SigninForm />
        </AuthLayout>
    )
}
