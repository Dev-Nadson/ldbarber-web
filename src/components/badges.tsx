import {
    AgendamentoStatusLabels,
    AgendamentoStatuses,
    AssinaturaStatuses,
    RoleLabels,
    Roles,
    SituacaoLabels,
    Situacoes,
    StatusDias,
    type AgendamentoStatus,
    type AssinaturaStatus,
    type Role,
    type Situacao,
    type StatusDia,
} from "~/lib/constants"
import { pluralize } from "~/lib/utils"
import { Badge } from "~/components/ui/badge"

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

/** O ponto colorido antes do texto, como nos selos do design ("• EM DIA"). */
function Ponto() {
    return <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
}

type SeloProps = {
    variant: BadgeVariant
    children: React.ReactNode
    className?: string
}

export function Selo({ variant, children, className }: SeloProps) {
    return (
        <Badge variant={variant} className={className}>
            <Ponto />
            {children}
        </Badge>
    )
}

type PlanoBadgeProps = {
    planoNome: string | null | undefined
    status: AssinaturaStatus | null | undefined
}

/** "• SOUL" para quem assina, "• AVULSO" para quem não. */
export function PlanoBadge({ planoNome, status }: PlanoBadgeProps) {
    if (status === AssinaturaStatuses.ATIVA && planoNome) return <Selo variant="default">{planoNome}</Selo>
    if (status === AssinaturaStatuses.SOLICITADA && planoNome) return <Selo variant="secondary">{planoNome} · pedido</Selo>

    return <Selo variant="secondary">Avulso</Selo>
}

const situacaoVariants: Record<Situacao, BadgeVariant> = {
    [Situacoes.SOLICITADA]: "secondary",
    [Situacoes.EM_DIA]: "success",
    [Situacoes.PENDENTE]: "warning",
    [Situacoes.ATRASADO]: "danger",
    [Situacoes.ENCERRADA]: "secondary",
    [Situacoes.CANCELADA]: "secondary",
}

export function SituacaoBadge({ situacao }: { situacao: Situacao | null | undefined }) {
    if (!situacao) return <span className="text-subtle">—</span>

    return <Selo variant={situacaoVariants[situacao]}>{SituacaoLabels[situacao]}</Selo>
}

const agendamentoVariants: Record<AgendamentoStatus, BadgeVariant> = {
    [AgendamentoStatuses.CONFIRMADO]: "default",
    [AgendamentoStatuses.CONCLUIDO]: "success",
    [AgendamentoStatuses.FALTA]: "danger",
    [AgendamentoStatuses.CANCELADO]: "secondary",
}

export function AgendamentoStatusBadge({ status }: { status: AgendamentoStatus }) {
    return <Selo variant={agendamentoVariants[status]}>{AgendamentoStatusLabels[status]}</Selo>
}

const roleVariants: Record<Role, BadgeVariant> = {
    [Roles.CLIENTE]: "secondary",
    [Roles.BARBEIRO]: "secondary",
    [Roles.GERENTE]: "default",
    [Roles.ADMIN]: "solid",
}

export function RoleBadge({ role }: { role: Role }) {
    return <Badge variant={roleVariants[role]}>{RoleLabels[role]}</Badge>
}

const statusDiaVariants: Record<StatusDia, BadgeVariant> = {
    [StatusDias.VAGAS]: "success",
    [StatusDias.POUCOS]: "warning",
    [StatusDias.LOTADO]: "danger",
    [StatusDias.FECHADO]: "secondary",
}

/** "• 6 HORÁRIOS", "• LOTADO", "• FECHADO" — o barbeiro (ou o dia) na disponibilidade. */
export function StatusDiaBadge({ status, livres }: { status: StatusDia; livres: number }) {
    const texto =
        status === StatusDias.LOTADO ? "Lotado" : status === StatusDias.FECHADO ? "Fechado" : pluralize(livres, "horário", "horários")

    return <Selo variant={statusDiaVariants[status]}>{texto}</Selo>
}

/** A cor do pontinho do dia no calendário. */
export const STATUS_DIA_DOT: Record<StatusDia, string> = {
    [StatusDias.VAGAS]: "bg-success",
    [StatusDias.POUCOS]: "bg-warning",
    [StatusDias.LOTADO]: "bg-danger",
    [StatusDias.FECHADO]: "bg-subtle",
}
