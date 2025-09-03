"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Sidebar } from "@/components/maas/sidebar"
import { RequestBuilder } from "@/components/maas/request-builder/request-builder"
import { ResponseViewer } from "@/components/maas/response-viewer/response-viewer"

export default function MaaSPage() {
  const [request, setRequest] = useState({
    method: "GET",
    url: "",
    params: [],
    headers: [],
    bodyMode: "raw", // raw | json | none
    bodyText: "",
  })

  const [result, setResult] = useState(null)
  const [isSending, setIsSending] = useState(false)

  // History in localStorage
  const [history, setHistory] = useState([])
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("maas_history") || "[]")
      setHistory(saved)
    } catch {}
  }, [])
  const saveHistory = useCallback(
    (entry) => {
      const newItem = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...entry,
      }
      const next = [newItem, ...history].slice(0, 50)
      setHistory(next)
      try {
        localStorage.setItem("maas_history", JSON.stringify(next))
      } catch {}
    },
    [history],
  )

  const onLoadFromHistory = useCallback((h) => {
    setRequest({
      method: h.method,
      url: h.url,
      params: h.params || [],
      headers: h.headers || [],
      bodyMode: h.bodyMode || "raw",
      bodyText: h.bodyText || "",
    })
    setResult(null)
  }, [])

  const handleSend = useCallback(async () => {
    if (!request.url) return
    setIsSending(true)
    setResult(null)
    try {
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      })
      const data = await res.json()
      setResult(data)
      saveHistory({
        ...request,
        durationMs: data?.meta?.durationMs,
        status: data?.status,
      })
    } catch (e) {
      setResult({
        error: e?.message || "Unknown error",
      })
    } finally {
      setIsSending(false)
    }
  }, [request, saveHistory])

  const onRequestChange = useCallback((patch) => {
    setRequest((prev) => ({ ...prev, ...patch }))
  }, [])

  return (
    <main className="flex h-[calc(100dvh-0px)]">
      <Sidebar history={history} onSelect={onLoadFromHistory} />
      <div className="flex-1 flex flex-col">
        <header className="border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-lg font-semibold text-pretty">MaaS</h1>
          </div>
        </header>

        <div className="flex-1 grid grid-rows-[auto,1fr]">
          <Card className="rounded-none border-0 border-b">
            <RequestBuilder value={request} onChange={onRequestChange} onSend={handleSend} isSending={isSending} />
          </Card>

          <div className="min-h-0">
            <ResponseViewer result={result} isSending={isSending} />
          </div>
        </div>
      </div>
    </main>
  )
}
