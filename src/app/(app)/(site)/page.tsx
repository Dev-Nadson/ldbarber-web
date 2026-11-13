import { InicioCliente } from "./inicio-cliente"
import { InicioHero } from "./inicio-hero"
import { InicioServicos } from "./inicio-servicos"

/** Anônimo: a apresentação da casa. Logado: o próximo horário e o plano, antes do resto. */
export default function InicioPage() {
    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 py-8 lg:px-8 lg:py-12">
            <InicioCliente />
            <InicioHero />
            <InicioServicos />
        </div>
    )
}
