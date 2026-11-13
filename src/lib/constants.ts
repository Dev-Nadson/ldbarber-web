export const APP_NAME = "LD Barber"

export const APP_TAGLINE = "Studio"

export const APP_DESCRIPTION = "Agende seu corte em segundos. Assinantes têm prioridade na agenda."

export type SelectOption<TValue> = {
    value: TValue
    label: string
}

export const Roles = {
    CLIENTE: "cliente",
    BARBEIRO: "barbeiro",
    GERENTE: "gerente",
    ADMIN: "admin",
} as const

export type Role = (typeof Roles)[keyof typeof Roles]

export const RoleLabels: Record<Role, string> = {
    [Roles.CLIENTE]: "Cliente",
    [Roles.BARBEIRO]: "Barbeiro",
    [Roles.GERENTE]: "Gerente",
    [Roles.ADMIN]: "Administrador",
}

/** Quem entra no painel. O barbeiro vê só a própria agenda. */
export const EQUIPE_ROLES: readonly Role[] = [Roles.BARBEIRO, Roles.GERENTE, Roles.ADMIN]

/** Agenda de todos, clientes, barbeiros, serviços, planos e caixa. */
export const GESTAO_ROLES: readonly Role[] = [Roles.GERENTE, Roles.ADMIN]

/** Ajustes da casa, regras da agenda e papéis da equipe. */
export const ADMIN_ROLES: readonly Role[] = [Roles.ADMIN]

export const EQUIPE_ROLE_OPTIONS: SelectOption<Role>[] = EQUIPE_ROLES.map((role) => ({
    value: role,
    label: RoleLabels[role],
}))

export function isEquipe(role: Role | undefined) {
    return role !== undefined && EQUIPE_ROLES.includes(role)
}

export function isGestao(role: Role | undefined) {
    return role !== undefined && GESTAO_ROLES.includes(role)
}

export function isAdmin(role: Role | undefined) {
    return role === Roles.ADMIN
}

export const AgendamentoStatuses = {
    CONFIRMADO: "confirmado",
    CONCLUIDO: "concluido",
    FALTA: "falta",
    CANCELADO: "cancelado",
} as const

export type AgendamentoStatus = (typeof AgendamentoStatuses)[keyof typeof AgendamentoStatuses]

export const AgendamentoStatusLabels: Record<AgendamentoStatus, string> = {
    [AgendamentoStatuses.CONFIRMADO]: "Confirmado",
    [AgendamentoStatuses.CONCLUIDO]: "Concluído",
    [AgendamentoStatuses.FALTA]: "Faltou",
    [AgendamentoStatuses.CANCELADO]: "Cancelado",
}

export const AssinaturaStatuses = {
    SOLICITADA: "solicitada",
    ATIVA: "ativa",
    CANCELADA: "cancelada",
} as const

export type AssinaturaStatus = (typeof AssinaturaStatuses)[keyof typeof AssinaturaStatuses]

/**
 * Situação do plano, calculada (nunca gravada): `situacao_assinatura()` no banco e
 * `situacaoAssinatura` em `lib/plano.ts`.
 */
export const Situacoes = {
    SOLICITADA: "solicitada",
    EM_DIA: "em_dia",
    PENDENTE: "pendente",
    ATRASADO: "atrasado",
    ENCERRADA: "encerrada",
    CANCELADA: "cancelada",
} as const

export type Situacao = (typeof Situacoes)[keyof typeof Situacoes]

export const SituacaoLabels: Record<Situacao, string> = {
    [Situacoes.SOLICITADA]: "Aguardando pagamento",
    [Situacoes.EM_DIA]: "Em dia",
    [Situacoes.PENDENTE]: "Pendente",
    [Situacoes.ATRASADO]: "Atrasado",
    [Situacoes.ENCERRADA]: "Encerrado",
    [Situacoes.CANCELADA]: "Cancelado",
}

/** Em dia e pendente (dentro da tolerância) dão direito ao plano. */
export const SITUACOES_COM_BENEFICIO: readonly Situacao[] = [Situacoes.EM_DIA, Situacoes.PENDENTE]

export const Periodicidades = {
    MENSAL: "mensal",
    TRIMESTRAL: "trimestral",
} as const

export type Periodicidade = (typeof Periodicidades)[keyof typeof Periodicidades]

export const PeriodicidadeLabels: Record<Periodicidade, string> = {
    [Periodicidades.MENSAL]: "Mensal",
    [Periodicidades.TRIMESTRAL]: "Trimestral",
}

export const MESES_POR_PERIODICIDADE: Record<Periodicidade, number> = {
    [Periodicidades.MENSAL]: 1,
    [Periodicidades.TRIMESTRAL]: 3,
}

/** O que um serviço consome da cota do plano. Igual ao `check` de `servicos.categorias`. */
export const Categorias = {
    CORTE: "corte",
    BARBA: "barba",
    PIGMENTACAO: "pigmentacao",
} as const

export type Categoria = (typeof Categorias)[keyof typeof Categorias]

export const CategoriaLabels: Record<Categoria, string> = {
    [Categorias.CORTE]: "Corte",
    [Categorias.BARBA]: "Barba",
    [Categorias.PIGMENTACAO]: "Pigmentação",
}

export const CATEGORIA_OPTIONS: SelectOption<Categoria>[] = Object.values(Categorias).map((categoria) => ({
    value: categoria,
    label: CategoriaLabels[categoria],
}))

export const FormasPagamento = {
    PIX: "pix",
    CREDITO: "credito",
    DEBITO: "debito",
    DINHEIRO: "dinheiro",
} as const

export type FormaPagamento = (typeof FormasPagamento)[keyof typeof FormasPagamento]

export const FormaPagamentoLabels: Record<FormaPagamento, string> = {
    [FormasPagamento.PIX]: "Pix",
    [FormasPagamento.CREDITO]: "Crédito",
    [FormasPagamento.DEBITO]: "Débito",
    [FormasPagamento.DINHEIRO]: "Dinheiro",
}

export const FORMA_PAGAMENTO_OPTIONS: SelectOption<FormaPagamento>[] = Object.values(FormasPagamento).map(
    (forma) => ({ value: forma, label: FormaPagamentoLabels[forma] })
)

/** Filtro da lista de clientes do painel. */
export const ClienteFiltros = {
    TODOS: "todos",
    ASSINANTES: "assinantes",
    AVULSOS: "avulsos",
    INADIMPLENTES: "inadimplentes",
} as const

export type ClienteFiltro = (typeof ClienteFiltros)[keyof typeof ClienteFiltros]

export const ClienteFiltroLabels: Record<ClienteFiltro, string> = {
    [ClienteFiltros.TODOS]: "Todos",
    [ClienteFiltros.ASSINANTES]: "Assinantes",
    [ClienteFiltros.AVULSOS]: "Avulsos",
    [ClienteFiltros.INADIMPLENTES]: "Inadimplentes",
}

/** Período do caixa. */
export const PeriodosCaixa = {
    HOJE: "hoje",
    SETE_DIAS: "7-dias",
    MES: "mes",
    TRINTA_DIAS: "30-dias",
} as const

export type PeriodoCaixa = (typeof PeriodosCaixa)[keyof typeof PeriodosCaixa]

export const PeriodoCaixaLabels: Record<PeriodoCaixa, string> = {
    [PeriodosCaixa.HOJE]: "Hoje",
    [PeriodosCaixa.SETE_DIAS]: "Últimos 7 dias",
    [PeriodosCaixa.MES]: "Este mês",
    [PeriodosCaixa.TRINTA_DIAS]: "Últimos 30 dias",
}

/** Status do dia no calendário de disponibilidade. */
export const StatusDias = {
    VAGAS: "vagas",
    POUCOS: "poucos",
    LOTADO: "lotado",
    FECHADO: "fechado",
} as const

export type StatusDia = (typeof StatusDias)[keyof typeof StatusDias]

export const StatusDiaLabels: Record<StatusDia, string> = {
    [StatusDias.VAGAS]: "Com vagas",
    [StatusDias.POUCOS]: "Poucos horários",
    [StatusDias.LOTADO]: "Lotado",
    [StatusDias.FECHADO]: "Fechado",
}

/** Até quantos horários livres o dia (ou o barbeiro) conta como "poucos". */
export const POUCOS_HORARIOS = 3

export const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"] as const

export const DIAS_SEMANA_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const

/** Limites de texto e quantidade, iguais aos `check` do `schema.sql`: mudou aqui, muda lá. */
export const LIMITS = {
    NOME_PESSOA: 80,
    APELIDO: 40,
    OBSERVACOES_FICHA: 500,
    OBSERVACAO_AGENDAMENTO: 200,
    BARBEIRO_NOME: 60,
    BARBEIRO_ESPECIALIDADE: 60,
    SERVICO_NOME: 60,
    SERVICO_DESCRICAO: 200,
    PLANO_NOME: 40,
    PLANO_RESUMO: 60,
    PLANO_LINHAS: 10,
    BLOQUEIO_MOTIVO: 80,
    ENDERECO: 160,
    AVISO: 200,
    CHAVE_PIX: 100,
} as const

export const INTERVALO_OPTIONS = [10, 15, 20, 30, 60] as const

/** Fuso da barbearia. O Brasil não tem horário de verão desde 2019: o deslocamento é fixo. */
export const FUSO = "America/Sao_Paulo"
export const FUSO_OFFSET = "-03:00"

export const PAGE_SIZE = 10

export const MIN_PASSWORD_LENGTH = 8
