import { APP_NAME } from "~/lib/constants"
import { dateKeyOf, firstName, formatLongDay, formatTime } from "~/lib/utils"

/** Link `wa.me`. O número vai só com dígitos e o 55 do Brasil (`configuracoes.whatsapp`). */
export function buildWhatsAppUrl(numero: string, texto?: string) {
    const base = `https://wa.me/${numero.replace(/\D/g, "")}`

    return texto ? `${base}?text=${encodeURIComponent(texto)}` : base
}

/** O telefone do cliente é gravado sem o 55 (DDD + número). */
export function whatsAppDoCliente(telefone: string) {
    return `55${telefone.replace(/\D/g, "")}`
}

export type AgendamentoMensagem = {
    inicio: string
    cliente_nome: string
    barbeiro_nome: string
    servico_nome: string
}

/**
 * O lembrete que a equipe manda pelo botão do painel. Sai do agendamento gravado (dia, hora,
 * barbeiro e serviço do retrato), nunca do que está na tela.
 */
export function buildLembreteMensagem(agendamento: AgendamentoMensagem) {
    const dia = formatLongDay(dateKeyOf(agendamento.inicio)).toLowerCase()

    return [
        `Olá, ${firstName(agendamento.cliente_nome)}! Passando para lembrar do seu horário na ${APP_NAME}:`,
        "",
        `*${dia}, às ${formatTime(agendamento.inicio)}*`,
        `${agendamento.servico_nome} com ${agendamento.barbeiro_nome}`,
        "",
        "Se precisar remarcar, é só responder esta mensagem. Até lá!",
    ].join("\n")
}
