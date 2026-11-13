import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { FUSO, FUSO_OFFSET } from "~/lib/constants"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function toNullable(value: string | null | undefined) {
    if (value === null || value === undefined) return null

    return value.trim() === "" ? null : value.trim()
}

export function onlyDigits(value: string) {
    return value.replace(/\D/g, "")
}

function pad(value: number) {
    return String(value).padStart(2, "0")
}

/** Data local → `YYYY-MM-DD` (o formato das colunas `date` e do `<input type="date">`). */
export function toDateKey(date: Date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
})

/**
 * O dia (`YYYY-MM-DD`) de um instante na barbearia, e não no fuso do aparelho: quem abre o
 * site de outro estado ou do exterior vê a agenda da casa.
 */
export function dateKeyOf(value: string | Date) {
    return dateKeyFormatter.format(typeof value === "string" ? new Date(value) : value)
}

/** Hoje na barbearia (o `public.hoje()` do banco). */
export function today() {
    return dateKeyOf(new Date())
}

function parseDateKey(dateKey: string) {
    const [year, month, day] = dateKey.split("-").map(Number)

    return { year, month, day }
}

/** Soma dias a uma data `YYYY-MM-DD`. Conta em UTC, então horário de verão nenhum atrapalha. */
export function addDays(dateKey: string, amount: number) {
    const { year, month, day } = parseDateKey(dateKey)
    const date = new Date(Date.UTC(year, month - 1, day + amount))

    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

/** Soma meses e devolve o dia 1 do mês: `addMonths("2026-10-16", 1)` → "2026-11-01". */
export function addMonths(dateKey: string, amount: number) {
    const { year, month } = parseDateKey(dateKey)
    const date = new Date(Date.UTC(year, month - 1 + amount, 1))

    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-01`
}

/** Dia da semana de uma data `YYYY-MM-DD`: 0 = domingo (igual ao `extract(dow)` do banco). */
export function weekday(dateKey: string) {
    const { year, month, day } = parseDateKey(dateKey)

    return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

/** Quantos dias de `from` até `to` (datas `YYYY-MM-DD`). */
export function diffDays(from: string, to: string) {
    const a = parseDateKey(from)
    const b = parseDateKey(to)

    return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86_400_000)
}

/** Dia e hora da barbearia → instante ISO: `toInstant("2026-10-16", "14:30")`. */
export function toInstant(dateKey: string, time: string) {
    return `${dateKey}T${time.slice(0, 5)}:00${FUSO_OFFSET}`
}

/** "09:00:00" (coluna `time`) ou "09:00" → minutos desde a meia-noite. */
export function timeToMinutes(time: string) {
    const [hours, minutes] = time.split(":").map(Number)

    return hours * 60 + minutes
}

export function minutesToTime(total: number) {
    return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
}

const timeFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, hour: "2-digit", minute: "2-digit" })

/** Instante → "14:30" na hora da barbearia. */
export function formatTime(value: string | null | undefined) {
    if (!value) return "—"

    return timeFormatter.format(new Date(value))
}

/** Minutos do dia na barbearia (o eixo da agenda). */
export function minutesOfDay(value: string) {
    return timeToMinutes(formatTime(value))
}

const MESES = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
]

const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"]

/** "2026-10" → "Outubro". */
export function monthName(dateKey: string) {
    const nome = MESES[parseDateKey(dateKey).month - 1]

    return nome[0].toUpperCase() + nome.slice(1)
}

/** "2026-10-16" → "16 de outubro". */
export function formatDayMonth(dateKey: string) {
    const { month, day } = parseDateKey(dateKey)

    return `${day} de ${MESES[month - 1]}`
}

/** "2026-10-16" → "Sexta, 16 de outubro". */
export function formatLongDay(dateKey: string) {
    const nome = DIAS[weekday(dateKey)]

    return `${nome[0].toUpperCase()}${nome.slice(1)}, ${formatDayMonth(dateKey)}`
}

/** "2026-10-16" → "Sex, 16 out". */
export function formatShortDay(dateKey: string) {
    const { month, day } = parseDateKey(dateKey)
    const nome = DIAS[weekday(dateKey)].slice(0, 3)

    return `${nome[0].toUpperCase()}${nome.slice(1)}, ${day} ${MESES[month - 1].slice(0, 3)}`
}

/** "Sexta-feira" para o cabeçalho do dia. */
export function weekdayName(dateKey: string) {
    const nome = DIAS[weekday(dateKey)]
    const completo = ["segunda", "terça", "quarta", "quinta", "sexta"].includes(nome) ? `${nome}-feira` : nome

    return completo[0].toUpperCase() + completo.slice(1)
}

/** 40 → "40 min"; 90 → "1h30". */
export function formatDuration(minutes: number) {
    if (minutes < 60) return `${minutes} min`

    const rest = minutes % 60

    return rest ? `${Math.floor(minutes / 60)}h${pad(rest)}` : `${minutes / 60}h`
}

/** "há 6 dias", "hoje", "ontem" — para a última visita. */
export function formatDaysAgo(value: string | null | undefined) {
    if (!value) return "—"

    const dias = diffDays(dateKeyOf(value), today())

    if (dias <= 0) return "hoje"
    if (dias === 1) return "ontem"

    return `há ${dias} dias`
}

/** "Rafael Nunes" → "Rafael", para as saudações. */
export function firstName(value: string | null | undefined) {
    return value?.trim().split(/\s+/)[0] ?? ""
}

/** `pluralize(1, "corte", "cortes")` → "1 corte"; `pluralize(3, ...)` → "3 cortes". */
export function pluralize(count: number, singular: string, plural: string) {
    return `${count} ${count === 1 ? singular : plural}`
}

/**
 * `YYYY-MM-DD` (coluna `date`) → `DD/MM/AAAA`. Separa a string em vez de usar `new Date`, que
 * leria a data como meia-noite UTC e mostraria o dia anterior no Brasil.
 */
export function formatDay(value: string | null | undefined) {
    if (!value) return "—"

    const [year, month, day] = value.slice(0, 10).split("-")

    if (!year || !month || !day) return value

    return `${day}/${month}/${year}`
}

/** ISO 8601 com hora (`criado_em` e afins) → data e hora da barbearia. */
export function formatTimestamp(value: string | null | undefined) {
    if (!value) return "—"

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return value

    return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: FUSO })
}


const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
})

export function formatCurrency(value: number | null | undefined) {
    if (value === null || value === undefined) return "—"

    return currencyFormatter.format(value)
}

const wholeCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
})

/** Preço de vitrine: sem centavos quando é redondo ("R$ 149"), como no design. */
export function formatPrice(value: number | null | undefined) {
    if (value === null || value === undefined) return "—"

    return Number.isInteger(value) ? wholeCurrencyFormatter.format(value) : currencyFormatter.format(value)
}

/**
 * Aceita "1.234,56", "1234,56", "1234.56" e "R$ 10". Com vírgula, o ponto é separador de
 * milhar; sem vírgula, o ponto é decimal.
 */
export function parseCurrency(value: string) {
    let normalized = value.trim().replace(/[R$\s]/g, "")

    if (normalized.includes(",")) {
        normalized = normalized.replace(/\./g, "").replace(",", ".")
    }

    const parsed = Number.parseFloat(normalized)

    return Number.isFinite(parsed) ? parsed : Number.NaN
}

/** Só aceita caminhos internos, para o `?redirect=` não virar redirecionamento aberto. */
export function sanitizeRedirect(value: string | null | undefined, fallback: string) {
    if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback

    return value
}

/** Tira o que quebraria o filtro `.or()` do PostgREST (vírgula, parênteses, curingas). */
export function sanitizeSearch(value: string) {
    return value.replace(/[,()*%\\]/g, " ").trim()
}

/** "81991649060" → "(81) 99164-9060". O banco guarda só os dígitos (DDD + número). */
export function formatPhone(value: string | null | undefined) {
    if (!value) return "—"

    const digits = onlyDigits(value)

    if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`

    return value
}

/** Valor do campo de dinheiro enquanto digita: só dígitos, lidos como centavos. */
export function maskCurrencyInput(value: string) {
    const digits = onlyDigits(value).replace(/^0+/, "").slice(0, 11)

    if (!digits) return ""

    return formatCurrency(Number(digits) / 100)
}

/** Número do banco → texto do campo de dinheiro ("R$ 4.500,00"). */
export function toCurrencyInput(value: number | null | undefined) {
    if (value === null || value === undefined) return ""

    return formatCurrency(value)
}

/** Primeira letra de cada nome, para avatares e monogramas. */
export function initials(value: string | null | undefined) {
    const parts = (value ?? "").trim().split(/\s+/).filter(Boolean)

    if (!parts.length) return ""

    return `${parts[0][0]}${parts.length > 1 ? parts.at(-1)![0] : ""}`.toUpperCase()
}


/** Máscara do telefone enquanto digita: "(81) 99999-0000". */
export function maskPhoneInput(value: string) {
    const digits = onlyDigits(value).slice(0, 11)

    if (digits.length <= 2) return digits.length ? `(${digits}` : ""
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}


/** Sem acento e em minúsculas, para a busca achar "joão" digitando "joao". */
export function normalizeSearch(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
}

