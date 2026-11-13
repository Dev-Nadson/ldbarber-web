import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"

import { APP_DESCRIPTION, APP_NAME } from "~/lib/constants"

export const alt = `${APP_NAME} · Studio`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/**
 * A prévia do link no WhatsApp e no Instagram: o logotipo sobre o preto da casa, com a listra
 * do barber pole. Gerada no build (estática), com a fonte da marca lida do pacote.
 */
export default async function Image() {
    const marca = await readFile(
        join(process.cwd(), "node_modules/@fontsource/unifrakturcook/files/unifrakturcook-latin-700-normal.woff")
    )

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#0a0a0b",
                    padding: "0 110px",
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                    <div style={{ fontFamily: "UnifrakturCook", fontSize: 150, color: "#ecebe8", lineHeight: 1 }}>{APP_NAME}</div>
                    <div style={{ fontSize: 30, color: "#a1a1aa", maxWidth: 640 }}>{APP_DESCRIPTION}</div>
                </div>
                <div
                    style={{
                        width: 150,
                        height: 330,
                        borderRadius: 10,
                        backgroundImage: "repeating-linear-gradient(-45deg, #2f54ff 0 22px, #ecebe8 22px 44px)",
                    }}
                />
            </div>
        ),
        { ...size, fonts: [{ name: "UnifrakturCook", data: marca, weight: 700, style: "normal" }] }
    )
}
