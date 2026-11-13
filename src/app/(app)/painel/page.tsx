import { redirect } from "next/navigation"

/** O painel começa pela agenda (de todos para a gestão, a própria para o barbeiro). */
export default function PainelPage() {
    redirect("/painel/agenda")
}
