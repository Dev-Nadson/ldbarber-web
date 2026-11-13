/**
 * Espelho de `supabase/schema.sql`, no formato do `supabase gen types typescript`. Se o
 * schema mudar, regenere com:
 *
 *   npx supabase gen types typescript --project-id <id> > src/typings/database.ts
 *
 * e troque de novo as colunas de "enum" pelos tipos de `lib/constants`. Diferença do gerado:
 * as colunas que os triggers preenchem (o retrato do agendamento, da assinatura e da
 * mensalidade) ficam opcionais no `Insert`, porque o navegador não manda.
 */

import type {
    AgendamentoStatus,
    AssinaturaStatus,
    Categoria,
    FormaPagamento,
    Periodicidade,
    Role,
    Situacao,
} from "~/lib/constants"

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    nome: string | null
                    email: string | null
                    telefone: string | null
                    nascimento: string | null
                    lembrete_whatsapp: boolean
                    role: Role
                    criado_em: string
                }
                Insert: {
                    id: string
                    nome?: string | null
                    email?: string | null
                    telefone?: string | null
                    nascimento?: string | null
                    lembrete_whatsapp?: boolean
                    role?: Role
                    criado_em?: string
                }
                Update: {
                    id?: string
                    nome?: string | null
                    email?: string | null
                    telefone?: string | null
                    nascimento?: string | null
                    lembrete_whatsapp?: boolean
                    role?: Role
                    criado_em?: string
                }
                Relationships: []
            }
            configuracoes: {
                Row: {
                    id: number
                    endereco: string | null
                    whatsapp: string | null
                    instagram: string | null
                    aviso: string | null
                    chave_pix: string | null
                    intervalo_min: number
                    antecedencia_avulso_dias: number
                    antecedencia_assinante_dias: number
                    cancelamento_min_horas: number
                    max_agendamentos_abertos: number
                    tolerancia_atraso_dias: number
                    desconto_trimestral: number
                    atualizado_em: string
                }
                Insert: {
                    id?: number
                    endereco?: string | null
                    whatsapp?: string | null
                    instagram?: string | null
                    aviso?: string | null
                    chave_pix?: string | null
                    intervalo_min?: number
                    antecedencia_avulso_dias?: number
                    antecedencia_assinante_dias?: number
                    cancelamento_min_horas?: number
                    max_agendamentos_abertos?: number
                    tolerancia_atraso_dias?: number
                    desconto_trimestral?: number
                    atualizado_em?: string
                }
                Update: {
                    id?: number
                    endereco?: string | null
                    whatsapp?: string | null
                    instagram?: string | null
                    aviso?: string | null
                    chave_pix?: string | null
                    intervalo_min?: number
                    antecedencia_avulso_dias?: number
                    antecedencia_assinante_dias?: number
                    cancelamento_min_horas?: number
                    max_agendamentos_abertos?: number
                    tolerancia_atraso_dias?: number
                    desconto_trimestral?: number
                    atualizado_em?: string
                }
                Relationships: []
            }
            barbeiros: {
                Row: {
                    id: string
                    nome: string
                    especialidade: string | null
                    profile_id: string | null
                    ativo: boolean
                    ordem: number
                    criado_em: string
                }
                Insert: {
                    id?: string
                    nome: string
                    especialidade?: string | null
                    profile_id?: string | null
                    ativo?: boolean
                    ordem?: number
                    criado_em?: string
                }
                Update: {
                    id?: string
                    nome?: string
                    especialidade?: string | null
                    profile_id?: string | null
                    ativo?: boolean
                    ordem?: number
                    criado_em?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "barbeiros_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: true
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            expedientes: {
                Row: {
                    id: string
                    barbeiro_id: string
                    dia_semana: number
                    abre: string
                    fecha: string
                    pausa_inicio: string | null
                    pausa_fim: string | null
                }
                Insert: {
                    id?: string
                    barbeiro_id: string
                    dia_semana: number
                    abre: string
                    fecha: string
                    pausa_inicio?: string | null
                    pausa_fim?: string | null
                }
                Update: {
                    id?: string
                    barbeiro_id?: string
                    dia_semana?: number
                    abre?: string
                    fecha?: string
                    pausa_inicio?: string | null
                    pausa_fim?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "expedientes_barbeiro_id_fkey"
                        columns: ["barbeiro_id"]
                        isOneToOne: false
                        referencedRelation: "barbeiros"
                        referencedColumns: ["id"]
                    },
                ]
            }
            bloqueios: {
                Row: {
                    id: string
                    barbeiro_id: string
                    inicio: string
                    fim: string
                    motivo: string | null
                    criado_por: string | null
                    criado_em: string
                }
                Insert: {
                    id?: string
                    barbeiro_id: string
                    inicio: string
                    fim: string
                    motivo?: string | null
                    criado_por?: string | null
                    criado_em?: string
                }
                Update: {
                    id?: string
                    barbeiro_id?: string
                    inicio?: string
                    fim?: string
                    motivo?: string | null
                    criado_por?: string | null
                    criado_em?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "bloqueios_barbeiro_id_fkey"
                        columns: ["barbeiro_id"]
                        isOneToOne: false
                        referencedRelation: "barbeiros"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "bloqueios_criado_por_fkey"
                        columns: ["criado_por"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            fichas: {
                Row: {
                    profile_id: string
                    apelido: string | null
                    barbeiro_preferido_id: string | null
                    observacoes: string | null
                    atualizado_em: string
                }
                Insert: {
                    profile_id: string
                    apelido?: string | null
                    barbeiro_preferido_id?: string | null
                    observacoes?: string | null
                    atualizado_em?: string
                }
                Update: {
                    profile_id?: string
                    apelido?: string | null
                    barbeiro_preferido_id?: string | null
                    observacoes?: string | null
                    atualizado_em?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "fichas_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: true
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "fichas_barbeiro_preferido_id_fkey"
                        columns: ["barbeiro_preferido_id"]
                        isOneToOne: false
                        referencedRelation: "barbeiros"
                        referencedColumns: ["id"]
                    },
                ]
            }
            servicos: {
                Row: {
                    id: string
                    nome: string
                    descricao: string | null
                    duracao_min: number
                    preco: number
                    categorias: Categoria[]
                    ativo: boolean
                    ordem: number
                    criado_em: string
                }
                Insert: {
                    id?: string
                    nome: string
                    descricao?: string | null
                    duracao_min: number
                    preco: number
                    categorias?: Categoria[]
                    ativo?: boolean
                    ordem?: number
                    criado_em?: string
                }
                Update: {
                    id?: string
                    nome?: string
                    descricao?: string | null
                    duracao_min?: number
                    preco?: number
                    categorias?: Categoria[]
                    ativo?: boolean
                    ordem?: number
                    criado_em?: string
                }
                Relationships: []
            }
            planos: {
                Row: {
                    id: string
                    nome: string
                    resumo: string | null
                    preco_mensal: number
                    beneficios: string[]
                    nao_inclui: string[]
                    destaque: boolean
                    ativo: boolean
                    ordem: number
                    criado_em: string
                    atualizado_em: string
                }
                Insert: {
                    id?: string
                    nome: string
                    resumo?: string | null
                    preco_mensal: number
                    beneficios?: string[]
                    nao_inclui?: string[]
                    destaque?: boolean
                    ativo?: boolean
                    ordem?: number
                    criado_em?: string
                    atualizado_em?: string
                }
                Update: {
                    id?: string
                    nome?: string
                    resumo?: string | null
                    preco_mensal?: number
                    beneficios?: string[]
                    nao_inclui?: string[]
                    destaque?: boolean
                    ativo?: boolean
                    ordem?: number
                    criado_em?: string
                    atualizado_em?: string
                }
                Relationships: []
            }
            plano_cotas: {
                Row: {
                    plano_id: string
                    categoria: Categoria
                    limite: number | null
                }
                Insert: {
                    plano_id: string
                    categoria: Categoria
                    limite?: number | null
                }
                Update: {
                    plano_id?: string
                    categoria?: Categoria
                    limite?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "plano_cotas_plano_id_fkey"
                        columns: ["plano_id"]
                        isOneToOne: false
                        referencedRelation: "planos"
                        referencedColumns: ["id"]
                    },
                ]
            }
            assinaturas: {
                Row: {
                    id: string
                    cliente_id: string
                    plano_id: string
                    plano_nome: string
                    valor_mensal: number
                    periodicidade: Periodicidade
                    dia_vencimento: number | null
                    status: AssinaturaStatus
                    vence_em: string | null
                    encerra_em: string | null
                    criado_em: string
                    ativada_em: string | null
                    cancelada_em: string | null
                }
                Insert: {
                    id?: string
                    cliente_id: string
                    plano_id: string
                    plano_nome?: string
                    valor_mensal?: number
                    periodicidade?: Periodicidade
                    dia_vencimento?: number | null
                    status?: AssinaturaStatus
                    vence_em?: string | null
                    encerra_em?: string | null
                    criado_em?: string
                    ativada_em?: string | null
                    cancelada_em?: string | null
                }
                Update: {
                    id?: string
                    cliente_id?: string
                    plano_id?: string
                    plano_nome?: string
                    valor_mensal?: number
                    periodicidade?: Periodicidade
                    dia_vencimento?: number | null
                    status?: AssinaturaStatus
                    vence_em?: string | null
                    encerra_em?: string | null
                    criado_em?: string
                    ativada_em?: string | null
                    cancelada_em?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "assinaturas_cliente_id_fkey"
                        columns: ["cliente_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "assinaturas_plano_id_fkey"
                        columns: ["plano_id"]
                        isOneToOne: false
                        referencedRelation: "planos"
                        referencedColumns: ["id"]
                    },
                ]
            }
            mensalidades: {
                Row: {
                    id: string
                    assinatura_id: string
                    cliente_id: string | null
                    cliente_nome: string
                    plano_nome: string
                    meses: number
                    periodo_inicio: string
                    periodo_fim: string
                    vence_em_anterior: string | null
                    valor: number
                    forma_pagamento: FormaPagamento
                    recebido_por: string | null
                    recebido_em: string
                    estornada: boolean
                    estornada_em: string | null
                }
                Insert: {
                    id?: string
                    assinatura_id: string
                    cliente_id?: string | null
                    cliente_nome?: string
                    plano_nome?: string
                    meses?: number
                    periodo_inicio?: string
                    periodo_fim?: string
                    vence_em_anterior?: string | null
                    valor?: number
                    forma_pagamento: FormaPagamento
                    recebido_por?: string | null
                    recebido_em?: string
                    estornada?: boolean
                    estornada_em?: string | null
                }
                Update: {
                    id?: string
                    assinatura_id?: string
                    cliente_id?: string | null
                    cliente_nome?: string
                    plano_nome?: string
                    meses?: number
                    periodo_inicio?: string
                    periodo_fim?: string
                    vence_em_anterior?: string | null
                    valor?: number
                    forma_pagamento?: FormaPagamento
                    recebido_por?: string | null
                    recebido_em?: string
                    estornada?: boolean
                    estornada_em?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "mensalidades_assinatura_id_fkey"
                        columns: ["assinatura_id"]
                        isOneToOne: false
                        referencedRelation: "assinaturas"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "mensalidades_cliente_id_fkey"
                        columns: ["cliente_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            agendamentos: {
                Row: {
                    id: string
                    cliente_id: string | null
                    barbeiro_id: string
                    servico_id: string | null
                    inicio: string
                    fim: string
                    status: AgendamentoStatus
                    cliente_nome: string
                    cliente_telefone: string | null
                    barbeiro_nome: string
                    servico_nome: string
                    categorias: Categoria[]
                    duracao_min: number
                    preco: number
                    incluso_plano: boolean
                    assinatura_id: string | null
                    plano_nome: string | null
                    valor: number
                    encaixe: boolean
                    observacao: string | null
                    forma_pagamento: FormaPagamento | null
                    valor_recebido: number | null
                    concluido_em: string | null
                    cancelado_em: string | null
                    cancelado_por: string | null
                    criado_por: string | null
                    criado_em: string
                    atualizado_em: string
                }
                Insert: {
                    id?: string
                    cliente_id?: string | null
                    barbeiro_id: string
                    servico_id?: string | null
                    inicio: string
                    fim?: string
                    status?: AgendamentoStatus
                    cliente_nome?: string
                    cliente_telefone?: string | null
                    barbeiro_nome?: string
                    servico_nome?: string
                    categorias?: Categoria[]
                    duracao_min?: number
                    preco?: number
                    incluso_plano?: boolean
                    assinatura_id?: string | null
                    plano_nome?: string | null
                    valor?: number
                    encaixe?: boolean
                    observacao?: string | null
                    forma_pagamento?: FormaPagamento | null
                    valor_recebido?: number | null
                    concluido_em?: string | null
                    cancelado_em?: string | null
                    cancelado_por?: string | null
                    criado_por?: string | null
                    criado_em?: string
                    atualizado_em?: string
                }
                Update: {
                    id?: string
                    cliente_id?: string | null
                    barbeiro_id?: string
                    servico_id?: string | null
                    inicio?: string
                    fim?: string
                    status?: AgendamentoStatus
                    cliente_nome?: string
                    cliente_telefone?: string | null
                    barbeiro_nome?: string
                    servico_nome?: string
                    categorias?: Categoria[]
                    duracao_min?: number
                    preco?: number
                    incluso_plano?: boolean
                    assinatura_id?: string | null
                    plano_nome?: string | null
                    valor?: number
                    encaixe?: boolean
                    observacao?: string | null
                    forma_pagamento?: FormaPagamento | null
                    valor_recebido?: number | null
                    concluido_em?: string | null
                    cancelado_em?: string | null
                    cancelado_por?: string | null
                    criado_por?: string | null
                    criado_em?: string
                    atualizado_em?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "agendamentos_cliente_id_fkey"
                        columns: ["cliente_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "agendamentos_barbeiro_id_fkey"
                        columns: ["barbeiro_id"]
                        isOneToOne: false
                        referencedRelation: "barbeiros"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "agendamentos_servico_id_fkey"
                        columns: ["servico_id"]
                        isOneToOne: false
                        referencedRelation: "servicos"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "agendamentos_assinatura_id_fkey"
                        columns: ["assinatura_id"]
                        isOneToOne: false
                        referencedRelation: "assinaturas"
                        referencedColumns: ["id"]
                    },
                ]
            }
            ocupacoes: {
                Row: {
                    id: string
                    barbeiro_id: string
                    inicio: string
                    fim: string
                    periodo: unknown
                    agendamento_id: string | null
                    bloqueio_id: string | null
                }
                Insert: {
                    id?: string
                    barbeiro_id: string
                    inicio: string
                    fim: string
                    periodo?: never
                    agendamento_id?: string | null
                    bloqueio_id?: string | null
                }
                Update: {
                    id?: string
                    barbeiro_id?: string
                    inicio?: string
                    fim?: string
                    periodo?: never
                    agendamento_id?: string | null
                    bloqueio_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "ocupacoes_barbeiro_id_fkey"
                        columns: ["barbeiro_id"]
                        isOneToOne: false
                        referencedRelation: "barbeiros"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "ocupacoes_agendamento_id_fkey"
                        columns: ["agendamento_id"]
                        isOneToOne: true
                        referencedRelation: "agendamentos"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "ocupacoes_bloqueio_id_fkey"
                        columns: ["bloqueio_id"]
                        isOneToOne: true
                        referencedRelation: "bloqueios"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            clientes_resumo: {
                Row: {
                    id: string | null
                    nome: string | null
                    email: string | null
                    telefone: string | null
                    nascimento: string | null
                    lembrete_whatsapp: boolean | null
                    criado_em: string | null
                    apelido: string | null
                    assinatura_id: string | null
                    plano_id: string | null
                    plano_nome: string | null
                    assinatura_status: AssinaturaStatus | null
                    periodicidade: Periodicidade | null
                    vence_em: string | null
                    encerra_em: string | null
                    situacao: Situacao | null
                    ultima_visita: string | null
                    proximo_horario: string | null
                }
                Relationships: []
            }
            caixa: {
                Row: {
                    id: string | null
                    tipo: "atendimento" | "mensalidade" | null
                    data: string | null
                    momento: string | null
                    barbeiro_id: string | null
                    barbeiro_nome: string | null
                    cliente_id: string | null
                    cliente_nome: string | null
                    descricao: string | null
                    forma_pagamento: FormaPagamento | null
                    valor: number | null
                    incluso_plano: boolean | null
                }
                Relationships: []
            }
        }
        Functions: {
            papel_atual: { Args: Record<PropertyKey, never>; Returns: string }
            is_equipe: { Args: Record<PropertyKey, never>; Returns: boolean }
            is_gestao: { Args: Record<PropertyKey, never>; Returns: boolean }
            is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
            meu_barbeiro_id: { Args: Record<PropertyKey, never>; Returns: string }
            hoje: { Args: Record<PropertyKey, never>; Returns: string }
            formatar_real: { Args: { valor: number }; Returns: string }
            situacao_assinatura: { Args: { p_status: string; p_vence_em: string; p_encerra_em: string }; Returns: string }
        }
        Enums: Record<never, never>
        CompositeTypes: Record<never, never>
    }
}
