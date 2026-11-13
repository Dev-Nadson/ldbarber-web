import { AppProviders } from "~/components/providers/app-providers"

type AppLayoutProps = {
    children: React.ReactNode
}

/** Tudo o que é tela: React Query, sessão e toasts. */
export default function AppLayout({ children }: AppLayoutProps) {
    return <AppProviders>{children}</AppProviders>
}
