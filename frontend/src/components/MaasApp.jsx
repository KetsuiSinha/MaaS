/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useEffect, useMemo, useState } from "react"
import { RequestBuilder } from "@/components/maas/request-builder/RequestBuilder"
import { Sidebar } from "@/components/maas/Sidebar"
import { ResponseViewer } from "@/components/maas/response-viewer/ResponseViewer"

const DEFAULT_HEADERS = [{ key: "", value: "", enabled: true, id: "h-1" }]
const DEFAULT_PARAMS = [{ key: "", value: "", enabled: true, id: "q-1" }]

function rowsToObject(rows) {
  const obj = {}
  for (const r of rows || []) {
    if (!r?.enabled) continue
    const k = (r.key || "").trim()
    if (!k) continue
    obj[k] = r.value ?? ""
  }
  return obj
}

function buildUrlWithParams(baseUrl, paramsRows) {
  try {
    const url = new URL(baseUrl)
    const params = rowsToObject(paramsRows)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
    return url.toString()
  } catch {
    // If invalid or relative, return as-is
    return baseUrl
  }
}

export default function MaaSApp() {
  const [method, setMethod] = useState("GET")
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/todos/1")
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const [headers, setHeaders] = useState(DEFAULT_HEADERS)
  const [bodyMode, setBodyMode] = useState("json") // 'none' | 'json' | 'text'
  const [bodyText, setBodyText] = useState('{\n  "example": true\n}')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState(null)
  const [timeMs, setTimeMs] = useState(null)
  const [sizeBytes, setSizeBytes] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("maas_history") || "[]")
      setHistory(Array.isArray(saved) ? saved : [])
    } catch {
      setHistory([])
    }
  }, [])

  function saveHistoryEntry(entry) {
    try {
      const next = [entry, ...history].slice(0, 100)
      setHistory(next)
      localStorage.setItem("maas_history", JSON.stringify(next))
    } catch {
      // ignore storage errors
    }
  }

  const preparedUrl = useMemo(() => buildUrlWithParams(url, params), [url, params])

  async function sendRequest() {
    setLoading(true)
    setResponse(null)
    setTimeMs(null)
    setSizeBytes(null)
    const started = performance.now()

    let outgoingBody = undefined
    const computedHeaders = rowsToObject(headers)

    if (method !== "GET" && method !== "HEAD") {
      if (bodyMode === "json") {
        if (!Object.keys(computedHeaders).some((h) => h.toLowerCase() === "content-type")) {
          computedHeaders["Content-Type"] = "application/json"
        }
        try {
          outgoingBody = JSON.stringify(JSON.parse(bodyText || "null"))
        } catch {
          outgoingBody = bodyText || ""
        }
      } else if (bodyMode === "text") {
        outgoingBody = bodyText || ""
      }
    }

    try {
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          url: preparedUrl,
          headers: computedHeaders,
          body: outgoingBody,
        }),
      })
      const data = await res.json()
      const ended = performance.now()
      const t = Math.max(0, Math.round(ended - started))
      setTimeMs(t)

      const bodyTextResp = data.body ?? ""
      const size = bodyTextResp ? new TextEncoder().encode(bodyTextResp).length : 0
      setSizeBytes(size)

      setResponse({
        ok: data.ok,
        status: data.status,
        statusText: data.statusText,
        headers: data.headers || {},
        body: bodyTextResp,
        url: data.url,
      })

      saveHistoryEntry({
        id: `${Date.now()}`,
        date: new Date().toISOString(),
        method,
        url: preparedUrl,
        status: data.status,
        timeMs: t,
      })
    } catch (e) {
      const ended = performance.now()
      setTimeMs(Math.round(ended - started))
      setResponse({
        ok: false,
        status: 0,
        statusText: "Request failed",
        headers: {},
        body: String(e?.message || e) || "Unknown error",
        url: preparedUrl,
      })
    } finally {
      setLoading(false)
    }
  }

  function loadFromHistory(item) {
    setMethod(item.method || "GET")
    setUrl(item.url || "")
  }

  function clearHistory() {
    setHistory([])
    try {
      localStorage.removeItem("maas_history")
    } catch {}
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[280px_1fr]">
      <aside className="border-r p-4">
        <Sidebar items={history} onSelect={loadFromHistory} onClear={clearHistory} />
      </aside>

      <main className="p-4 flex flex-col gap-4">
        <RequestBuilder
          method={method}
          setMethod={setMethod}
          url={url}
          setUrl={setUrl}
          params={params}
          setParams={setParams}
          headers={headers}
          setHeaders={setHeaders}
          bodyMode={bodyMode}
          setBodyMode={setBodyMode}
          bodyText={bodyText}
          setBodyText={setBodyText}
          loading={loading}
          onSend={sendRequest}
        />

        <ResponseViewer response={response} timeMs={timeMs} sizeBytes={sizeBytes} />
      </main>
    </div>
  )
}
