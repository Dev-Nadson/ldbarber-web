"use client"

import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Pencil } from "lucide-react"
import { toast } from "sonner"

import { DIAS_SEMANA_CURTOS } from "~/lib/constants"
import { describeMutationError } from "~/lib/errors"
import { QUERIES, invalidateBarbeiros } from "~/lib/queries"
import { listBarbeiros, listExpedientes, updateBarbeiroAtivo, type Barbeiro } from "~/services/barbeiros"
import { Button } from "~/components/ui/button"
import {
    ListBody,
    ListCell,
    ListEmpty,
    ListHead,
    ListHeader,
    ListRoot,
    ListRow,
    ListSkeletonRows,
    ListTable,
} from "~/components/ui/list"
import { Switch } from "~/components/ui/switch"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "~/components/ui/tooltip"
import { Selo } from "~/components/badges"
import { Iniciais } from "~/components/iniciais"
import { DeleteBarbeiroDialog } from "./delete-barbeiro-dialog"

const COLUMNS = 5

function AtivoSwitch({ barbeiro }: { barbeiro: Barbeiro }) {
    const queryClient = useQueryClient()

    const { mutateAsync, isPending } = useMutation({
        mutationFn: updateBarbeiroAtivo,
        onSuccess: () => invalidateBarbeiros(queryClient),
    })

    function alternar(ativo: boolean) {
        if (isPending) return

        toast.promise(mutateAsync({ barbeiroId: barbeiro.id, ativo }), {
            loading: "Salvando...",
            success: ativo ? `${barbeiro.nome} voltou para a agenda.` : `${barbeiro.nome} saiu da agenda e do site.`,
            error: (error: unknown) => describeMutationError(error),
        })
    }

    return <Switch checked={barbeiro.ativo} onCheckedChange={alternar} disabled={isPending} aria-label={`${barbeiro.nome} atendendo`} />
}

export function BarbeirosList() {
    const { data: barbeiros, isPending } = useQuery({
        queryKey: [QUERIES.LIST_BARBEIROS, { incluirInativos: true }],
        queryFn: () => listBarbeiros({ incluirInativos: true }),
    })
    const { data: expedientes } = useQuery({
        queryKey: [QUERIES.LIST_EXPEDIENTES],
        queryFn: () => listExpedientes(),
    })

    return (
        <ListRoot>
            <ListTable>
                <ListHeader>
                    <ListRow className="hover:bg-transparent">
                        <ListHead className="letreiro">Barbeiro</ListHead>
                        <ListHead className="letreiro hidden md:table-cell">Atende</ListHead>
                        <ListHead className="letreiro hidden sm:table-cell">Painel</ListHead>
                        <ListHead className="letreiro">Ativo</ListHead>
                        <ListHead className="letreiro text-right">Ações</ListHead>
                    </ListRow>
                </ListHeader>
                <ListBody>
                    {isPending && <ListSkeletonRows cols={COLUMNS} rows={3} />}
                    {!isPending && !barbeiros?.length && (
                        <ListEmpty cols={COLUMNS}>Nenhum barbeiro ainda. Cadastre o primeiro para abrir a agenda.</ListEmpty>
                    )}
                    {barbeiros?.map((barbeiro) => {
                        const dias = (expedientes ?? [])
                            .filter((expediente) => expediente.barbeiro_id === barbeiro.id)
                            .map((expediente) => DIAS_SEMANA_CURTOS[expediente.dia_semana])

                        return (
                            <ListRow key={barbeiro.id} className={barbeiro.ativo ? undefined : "opacity-60"}>
                                <ListCell>
                                    <Link href={`/painel/barbeiros/${barbeiro.id}`} className="flex items-center gap-3 hover:underline">
                                        <Iniciais nome={barbeiro.nome} />
                                        <span>
                                            <span className="block font-medium">{barbeiro.nome}</span>
                                            {barbeiro.especialidade && (
                                                <span className="block text-xs text-muted-foreground">{barbeiro.especialidade}</span>
                                            )}
                                        </span>
                                    </Link>
                                </ListCell>
                                <ListCell className="hidden text-muted-foreground md:table-cell">
                                    {dias.length ? dias.join(", ") : "Sem expediente"}
                                </ListCell>
                                <ListCell className="hidden sm:table-cell">
                                    {barbeiro.profile_id ? <Selo variant="default">Com conta</Selo> : <Selo variant="secondary">Sem conta</Selo>}
                                </ListCell>
                                <ListCell>
                                    <AtivoSwitch barbeiro={barbeiro} />
                                </ListCell>
                                <ListCell>
                                    <div className="flex items-center justify-end gap-1">
                                        <Tooltip>
                                            <TooltipTrigger
                                                render={
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        aria-label={`Editar ${barbeiro.nome}`}
                                                        render={<Link href={`/painel/barbeiros/${barbeiro.id}`} />}
                                                    />
                                                }
                                            >
                                                <Pencil />
                                            </TooltipTrigger>
                                            <TooltipContent>Editar</TooltipContent>
                                        </Tooltip>
                                        <DeleteBarbeiroDialog barbeiro={barbeiro} />
                                    </div>
                                </ListCell>
                            </ListRow>
                        )
                    })}
                </ListBody>
            </ListTable>
        </ListRoot>
    )
}
