"use client"

import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { LoaderCircle, LogOut } from "lucide-react"

import { QUERIES } from "~/lib/queries"
import { deleteSession } from "~/services/sessions"
import { Button } from "~/components/ui/button"
import { Section } from "~/components/detail-section"
import { ResetPasswordForm } from "~/components/forms/reset-password-form"

export function PerfilSenha() {
    const router = useRouter()
    const queryClient = useQueryClient()

    const { mutate: signOut, isPending } = useMutation({
        mutationFn: deleteSession,
        onSettled: () => {
            queryClient.clear()
            queryClient.setQueryData([QUERIES.GET_SESSION], null)
            router.replace("/")
        },
    })

    return (
        <Section
            title="Trocar senha"
            action={
                <Button variant="outline" size="sm" onClick={() => signOut()} disabled={isPending}>
                    {isPending ? <LoaderCircle className="animate-spin" /> : <LogOut />}
                    Sair
                </Button>
            }
        >
            <ResetPasswordForm homePath="/perfil" className="max-w-md" />
        </Section>
    )
}
