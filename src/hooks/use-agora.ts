import { useEffect, useState } from "react"

/**
 * "Agora" que anda sozinho a cada minuto: a grade de horários esconde os que acabaram de
 * passar sem precisar recarregar. Começa em 0 no servidor e na hidratação, para o HTML do
 * servidor e o do navegador baterem; a tela trata 0 como "carregando".
 */
export function useAgora(intervaloMs = 60_000) {
    const [agora, setAgora] = useState(0)

    useEffect(() => {
        const atualizar = () => setAgora(Date.now())
        const primeiro = setTimeout(atualizar, 0)
        const timer = setInterval(atualizar, intervaloMs)

        return () => {
            clearTimeout(primeiro)
            clearInterval(timer)
        }
    }, [intervaloMs])

    return agora
}
