"use client"

import { useQuery } from "@tanstack/react-query"

import { CategoriaLabels } from "~/lib/constants"
import { QUERIES } from "~/lib/queries"
import { formatCurrency, formatDuration } from "~/lib/utils"
import { listServicos } from "~/services/servicos"
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
import { Selo } from "~/components/badges"
import { DeleteServicoDialog } from "./delete-servico-dialog"
import { ServicoDialog } from "./servico-dialog"

const COLUMNS = 5

export function ServicosList() {
    const { data: servicos, isPending } = useQuery({
        queryKey: [QUERIES.LIST_SERVICOS, { incluirInativos: true }],
        queryFn: () => listServicos({ incluirInativos: true }),
    })

    return (
        <ListRoot>
            <ListTable>
                <ListHeader>
                    <ListRow className="hover:bg-transparent">
                        <ListHead className="letreiro">Serviço</ListHead>
                        <ListHead className="letreiro hidden sm:table-cell">Duração</ListHead>
                        <ListHead className="letreiro hidden md:table-cell">Cota do plano</ListHead>
                        <ListHead className="letreiro text-right">Preço</ListHead>
                        <ListHead className="letreiro text-right">Ações</ListHead>
                    </ListRow>
                </ListHeader>
                <ListBody>
                    {isPending && <ListSkeletonRows cols={COLUMNS} rows={4} />}
                    {!isPending && !servicos?.length && (
                        <ListEmpty cols={COLUMNS}>Nenhum serviço ainda. Sem serviço, ninguém consegue marcar.</ListEmpty>
                    )}
                    {servicos?.map((servico) => (
                        <ListRow key={servico.id} className={servico.ativo ? undefined : "opacity-60"}>
                            <ListCell>
                                <span className="font-medium">{servico.nome}</span>
                                {!servico.ativo && <Selo variant="secondary" className="ml-2">Fora do site</Selo>}
                                <span className="block text-xs text-muted-foreground sm:hidden">{formatDuration(servico.duracao_min)}</span>
                            </ListCell>
                            <ListCell className="hidden text-muted-foreground sm:table-cell">{formatDuration(servico.duracao_min)}</ListCell>
                            <ListCell className="hidden text-muted-foreground md:table-cell">
                                {servico.categorias.length ? servico.categorias.map((categoria) => CategoriaLabels[categoria]).join(" + ") : "Não entra"}
                            </ListCell>
                            <ListCell className="text-right font-display text-base tabular-nums">{formatCurrency(servico.preco)}</ListCell>
                            <ListCell>
                                <div className="flex items-center justify-end gap-1">
                                    <ServicoDialog servico={servico} />
                                    <DeleteServicoDialog servico={servico} />
                                </div>
                            </ListCell>
                        </ListRow>
                    ))}
                </ListBody>
            </ListTable>
        </ListRoot>
    )
}
