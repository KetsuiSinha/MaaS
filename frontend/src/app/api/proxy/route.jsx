export async function POST(req) {
  const started = Date.now()
  try {
    const { url, method = "GET", params = [], headers = [], bodyMode = "none", bodyText = "" } = await req.json()

    if (!url) {
      return Response.json({ error: "Missing URL" }, { status: 400 })
    }

    // Build final URL with params
    const u = new URL(url)
    const existingParams = new URLSearchParams(u.search)
    for (const row of params) {
      if (!row || row.disabled) continue
      const key = (row.key || "").trim()
      if (!key) continue
      existingParams.set(key, row.value ?? "")
    }
    u.search = existingParams.toString()

    // Normalize headers
    const unsafeHeaders = new Set([
      "host",
      "connection",
      "content-length",
      "accept-encoding",
      "sec-fetch-mode",
      "sec-fetch-dest",
      "sec-fetch-site",
      "origin",
    ])
    const outHeaders = new Headers()
    for (const row of headers) {
      if (!row || row.disabled) continue
      const key = (row.key || "").trim()
      if (!key) continue
      if (unsafeHeaders.has(key.toLowerCase())) continue
      outHeaders.set(key, row.value ?? "")
    }

    // Body handling
    let outgoingBody = undefined
    const upper = (method || "GET").toUpperCase()
    if (!["GET", "HEAD"].includes(upper)) {
      if (bodyMode === "json") {
        // Ensure proper content-type
        if (!outHeaders.has("content-type")) {
          outHeaders.set("content-type", "application/json")
        }
        outgoingBody = bodyText || ""
      } else if (bodyMode === "raw") {
        outgoingBody = bodyText || ""
      } else {
        // none
        outgoingBody = undefined
      }
    }

    const externalRes = await fetch(u.toString(), {
      method: upper,
      headers: outHeaders,
      body: outgoingBody,
      redirect: "follow",
    })

    const durationMs = Date.now() - started

    // Capture headers
    const headerPairs = []
    externalRes.headers.forEach((value, key) => headerPairs.push([key, value]))

    // Determine body
    const contentType = externalRes.headers.get("content-type") || ""
    let text = ""
    let isJson = false
    try {
      if (contentType.includes("application/json")) {
        text = await externalRes.text()
        isJson = true
      } else if (contentType.startsWith("text/") || contentType.includes("xml") || contentType.includes("html")) {
        text = await externalRes.text()
      } else {
        // Binary or unknown; do not attempt to base64 by default
        text = "[binary response omitted]"
      }
    } catch (e) {
      text = `Failed to read response body: ${e?.message || "unknown"}`
    }

    // Compute size
    let size = externalRes.headers.get("content-length")
    if (!size && typeof text === "string") {
      size = new Blob([text]).size.toString()
    }

    return Response.json(
      {
        url: u.toString(),
        status: externalRes.status,
        statusText: externalRes.statusText,
        headers: headerPairs,
        bodyText: text,
        meta: {
          contentType,
          durationMs,
          size: size ? Number(size) : null,
          isJson,
        },
      },
      { status: 200 },
    )
  } catch (e) {
    return Response.json(
      {
        error: e?.message || "Proxy error",
      },
      { status: 500 },
    )
  }
}
