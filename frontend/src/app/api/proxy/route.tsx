import type { NextRequest } from "next/server"

type Incoming = {
  method: string
  url: string
  headers?: { name: string; value: string }[]
  bodyText?: string
  bodyMode?: "none" | "json" | "text"
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as Incoming

    const method = (payload.method || "GET").toUpperCase()
    const url = payload.url
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "Invalid URL" }), { status: 400 })
    }

    const forbidden = new Set([
      "connection",
      "keep-alive",
      "proxy-authenticate",
      "proxy-authorization",
      "te",
      "trailer",
      "transfer-encoding",
      "upgrade",
      "host",
    ])
    const outHeaders: Record<string, string> = {}
    for (const h of payload.headers || []) {
      const name = String(h.name || "").toLowerCase()
      if (!name || forbidden.has(name)) continue
      outHeaders[name] = h.value ?? ""
    }

    let body: BodyInit | undefined = undefined
    if (payload.bodyMode === "json" && payload.bodyText && ["POST", "PUT", "PATCH"].includes(method)) {
      body = payload.bodyText
      if (!outHeaders["content-type"]) {
        outHeaders["content-type"] = "application/json"
      }
    } else if (payload.bodyMode === "text" && payload.bodyText && ["POST", "PUT", "PATCH"].includes(method)) {
      body = payload.bodyText
      if (!outHeaders["content-type"]) {
        outHeaders["content-type"] = "text/plain"
      }
    }

    const started = Date.now()
    const targetRes = await fetch(url, {
      method,
      headers: outHeaders,
      body,
      redirect: "follow",
    })
    const buf = await targetRes.arrayBuffer()
    const durationMs = Date.now() - started
    const sizeBytes = buf.byteLength

    const headers: { name: string; value: string }[] = []
    targetRes.headers.forEach((value, name) => {
      headers.push({ name, value })
    })

    const contentType = targetRes.headers.get("content-type") || ""
    let bodyText = ""
    try {
      bodyText = new TextDecoder("utf-8").decode(new Uint8Array(buf))
    } catch {
      bodyText = ""
    }
    const bodyIsJson = contentType.includes("application/json")

    const responsePayload = {
      ok: targetRes.ok,
      status: targetRes.status,
      statusText: targetRes.statusText,
      durationMs,
      sizeBytes,
      headers,
      bodyText,
      bodyIsJson,
    }

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (e: any) {
    return new Response(
      JSON.stringify({
        ok: false,
        status: 0,
        statusText: "Proxy Error",
        durationMs: 0,
        sizeBytes: 0,
        headers: [],
        bodyText: String(e?.message || e),
        bodyIsJson: false,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  }
}
