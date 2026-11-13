"use client"

import { CalendarCog, Store, Users } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { AjustesCasa } from "./ajustes-casa"
import { AjustesEquipe } from "./ajustes-equipe"
import { AjustesRegras } from "./ajustes-regras"

const TABS = [
    { value: "casa", label: "Casa", icon: Store, content: AjustesCasa },
    { value: "agenda", label: "Agenda", icon: CalendarCog, content: AjustesRegras },
    { value: "equipe", label: "Equipe", icon: Users, content: AjustesEquipe },
]

export function AjustesTabs() {
    return (
        <Tabs defaultValue="casa" className="gap-5">
            <TabsList className="h-auto w-full flex-wrap justify-start rounded-md border border-line-strong p-0 sm:w-fit">
                {TABS.map((tab) => (
                    <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="h-10 flex-none rounded-none px-4 font-display text-xs tracking-[0.14em] uppercase data-active:bg-primary/15"
                    >
                        <tab.icon />
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>

            {TABS.map((tab) => (
                <TabsContent key={tab.value} value={tab.value}>
                    <tab.content />
                </TabsContent>
            ))}
        </Tabs>
    )
}
