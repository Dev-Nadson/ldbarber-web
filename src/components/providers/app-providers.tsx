"use client"

import { useAuthListener } from "~/hooks/use-auth-listener"
import { isSupabaseConfigured } from "~/lib/supabase"
import { Toaster } from "~/components/ui/sonner"
import { MissingConfig } from "~/components/missing-config"
import { QueryClientProvider } from "~/components/providers/query-client-provider"

function AuthListener() {
    useAuthListener()

    return null
}

type AppProvidersProps = {
    children: React.ReactNode
}

/** Equivalente ao `main.tsx` + `app.tsx` dos irmãos: React Query, sessão e toasts. */
export function AppProviders({ children }: AppProvidersProps) {
    return (
        <>
            {isSupabaseConfigured ? (
                <QueryClientProvider>
                    <AuthListener />
                    {children}
                </QueryClientProvider>
            ) : (
                <MissingConfig />
            )}
            <Toaster position="top-center" richColors theme="dark" />
        </>
    )
}
