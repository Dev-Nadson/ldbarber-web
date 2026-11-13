import { POUCOS_HORARIOS, StatusDias, type StatusDia } from "~/lib/constants"
import { addDays, minutesToTime, timeToMinutes, toInstant, weekday } from "~/lib/utils"

/**
 * A agenda vista do navegador: quais horários estão livres, o status de cada dia e o barbeiro
 * do "tanto faz". É a **prévia** da regra do `agendamentos_criar` (schema.sql, seção 6):
 * grade a partir da abertura, dentro do expediente, fora da pausa, sem sobrepor ocupação e até
 * a antecedência. Mudou um, muda o outro. Quem decide de verdade é o banco.
 */

export type ExpedienteDia = {
    barbeiro_id: string
    dia_semana: number
    /** "09:00:00" (coluna `time`). */
    abre: string
    fecha: string
    pausa_inicio: string | null
    pausa_fim: string | null
}

/** Um intervalo ocupado da agenda (tabela `ocupacoes`): horário marcado ou bloqueio. */
export type Ocupacao = {
    barbeiro_id: string
    inicio: string
    fim: string
}

export type Horario = {
    /** "14:30", hora da barbearia. */
    hora: string
    /** Instante ISO do início, o que vai para o banco. */
    inicio: string
    livre: boolean
}

function overlaps(inicio: number, fim: number, ocupacoes: Ocupacao[]) {
    return ocupacoes.some((ocupacao) => inicio < Date.parse(ocupacao.fim) && fim > Date.parse(ocupacao.inicio))
}

export function expedienteDoDia(expedientes: ExpedienteDia[], barbeiroId: string, dia: string) {
    const dow = weekday(dia)

    return expedientes.find((expediente) => expediente.barbeiro_id === barbeiroId && expediente.dia_semana === dow)
}

type GerarHorariosInput = {
    dia: string
    expediente: ExpedienteDia | undefined
    /** Só as ocupações deste barbeiro. */
    ocupacoes: Ocupacao[]
    duracaoMin: number
    intervaloMin: number
    /** Agora, em ms. Horários que já passaram nem aparecem. */
    agora: number
}

/**
 * A grade do dia de um barbeiro, de `intervaloMin` em `intervaloMin` a partir da abertura. Os
 * horários dentro da pausa não aparecem; os que não cabem (encostam na pausa ou no fechamento)
 * ou já estão ocupados aparecem riscados (`livre: false`), como no design.
 */
export function gerarHorarios({ dia, expediente, ocupacoes, duracaoMin, intervaloMin, agora }: GerarHorariosInput) {
    if (!expediente) return []

    const abre = timeToMinutes(expediente.abre)
    const fecha = timeToMinutes(expediente.fecha)
    const pausaInicio = expediente.pausa_inicio ? timeToMinutes(expediente.pausa_inicio) : null
    const pausaFim = expediente.pausa_fim ? timeToMinutes(expediente.pausa_fim) : null
    const horarios: Horario[] = []

    for (let minuto = abre; minuto < fecha; minuto += intervaloMin) {
        if (pausaInicio !== null && pausaFim !== null && minuto >= pausaInicio && minuto < pausaFim) continue

        const hora = minutesToTime(minuto)
        const inicioIso = toInstant(dia, hora)
        const inicio = Date.parse(inicioIso)

        if (inicio <= agora) continue

        const fimMinuto = minuto + duracaoMin
        const cabe =
            fimMinuto <= fecha &&
            !(pausaInicio !== null && pausaFim !== null && minuto < pausaFim && fimMinuto > pausaInicio)

        horarios.push({
            hora,
            inicio: inicioIso,
            livre: cabe && !overlaps(inicio, inicio + duracaoMin * 60_000, ocupacoes),
        })
    }

    return horarios
}

export function contarLivres(horarios: Horario[]) {
    return horarios.filter((horario) => horario.livre).length
}

/** O status do dia (ou de um barbeiro no dia) pelo número de horários livres. */
export function statusPorLivres(livres: number, atende: boolean): StatusDia {
    if (!atende) return StatusDias.FECHADO
    if (livres === 0) return StatusDias.LOTADO
    if (livres <= POUCOS_HORARIOS) return StatusDias.POUCOS

    return StatusDias.VAGAS
}

type DisponibilidadeInput = {
    dia: string
    barbeiroIds: string[]
    expedientes: ExpedienteDia[]
    ocupacoes: Ocupacao[]
    duracaoMin: number
    intervaloMin: number
    agora: number
}

export type DisponibilidadeBarbeiro = {
    barbeiroId: string
    atende: boolean
    horarios: Horario[]
    livres: number
    status: StatusDia
}

/** Os horários de cada barbeiro num dia, na ordem recebida. */
export function disponibilidadeDoDia({
    dia,
    barbeiroIds,
    expedientes,
    ocupacoes,
    duracaoMin,
    intervaloMin,
    agora,
}: DisponibilidadeInput): DisponibilidadeBarbeiro[] {
    return barbeiroIds.map((barbeiroId) => {
        const expediente = expedienteDoDia(expedientes, barbeiroId, dia)
        const horarios = gerarHorarios({
            dia,
            expediente,
            ocupacoes: ocupacoes.filter((ocupacao) => ocupacao.barbeiro_id === barbeiroId),
            duracaoMin,
            intervaloMin,
            agora,
        })
        const livres = contarLivres(horarios)
        // Hoje depois do expediente não sobra horário nenhum na grade: conta como fechado, e não
        // como lotado (lotado é ter horário e estarem todos ocupados).
        const atende = Boolean(expediente) && horarios.length > 0

        return { barbeiroId, atende, horarios, livres, status: statusPorLivres(livres, atende) }
    })
}

/** O dia inteiro: soma os barbeiros. Fechado quando nenhum atende. */
export function resumoDoDia(barbeiros: DisponibilidadeBarbeiro[]) {
    const atende = barbeiros.some((barbeiro) => barbeiro.atende)
    const livres = barbeiros.reduce((total, barbeiro) => total + barbeiro.livres, 0)

    return { atende, livres, status: statusPorLivres(livres, atende) }
}

/**
 * A grade de "tanto faz": cada hora em que pelo menos um barbeiro está livre. O barbeiro que
 * vai para o banco é o primeiro livre na ordem da casa (`primeiroBarbeiroLivre`).
 */
export function horariosDeQualquer(barbeiros: DisponibilidadeBarbeiro[]) {
    const porHora = new Map<string, Horario>()

    for (const barbeiro of barbeiros) {
        for (const horario of barbeiro.horarios) {
            const atual = porHora.get(horario.hora)

            if (!atual || (!atual.livre && horario.livre)) porHora.set(horario.hora, horario)
        }
    }

    return [...porHora.values()].sort((a, b) => a.hora.localeCompare(b.hora))
}

export function primeiroBarbeiroLivre(barbeiros: DisponibilidadeBarbeiro[], hora: string) {
    return barbeiros.find((barbeiro) => barbeiro.horarios.some((horario) => horario.hora === hora && horario.livre))
        ?.barbeiroId
}

/** O horário de funcionamento do dia ("09–19h"): a abertura mais cedo e o fechamento mais tarde. */
export function funcionamentoDoDia(expedientes: ExpedienteDia[], dia: string) {
    const doDia = expedientes.filter((expediente) => expediente.dia_semana === weekday(dia))

    if (!doDia.length) return null

    const abre = Math.min(...doDia.map((expediente) => timeToMinutes(expediente.abre)))
    const fecha = Math.max(...doDia.map((expediente) => timeToMinutes(expediente.fecha)))

    return { abre, fecha }
}

/**
 * Até que dia o cliente marca: o assinante com plano em dia tem mais antecedência. Igual ao
 * `limite_dias` do `agendamentos_criar`.
 */
export function ultimoDiaAgendavel(hoje: string, antecedenciaDias: number) {
    return addDays(hoje, antecedenciaDias)
}

/** Os dias do mês para o calendário, começando no domingo da primeira semana. */
export function diasDoCalendario(mes: string) {
    const primeiro = `${mes.slice(0, 7)}-01`
    const inicio = addDays(primeiro, -weekday(primeiro))
    const dias: string[] = []

    for (let indice = 0; indice < 42; indice += 1) {
        const dia = addDays(inicio, indice)

        if (indice >= 35 && dia.slice(0, 7) !== mes.slice(0, 7)) break
        dias.push(dia)
    }

    return dias
}
