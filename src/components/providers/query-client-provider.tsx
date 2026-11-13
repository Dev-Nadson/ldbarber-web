"use client"

import { useState } from "react"
import {
    QueryClient,
    QueryClientProvider as QueryClientProviderPrimitive,
} from "@tanstack/react-query"

type QueryClientProviderProps = {
    children: React.ReactNode
}

export function QueryClientProvider({ children }: QueryClientProviderProps) {
    const [client] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60_000,
                        retry: 1,
                    },
                },
            })
    )

    return <QueryClientProviderPrimitive client={client}>{children}</QueryClientProviderPrimitive>
}
