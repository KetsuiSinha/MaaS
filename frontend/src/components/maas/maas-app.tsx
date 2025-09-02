"use client"

import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { v4 as uuid } from "uuid"
import type { HttpMethod, KeyValue, RequestModel, ResponseModel } from "@/lib/maas/types"
import { loadHistory, saveHistory } from "@/lib/maas/storage"
import { HeadersEditor } from "./parts/headers-editor"
import { ParamsEditor } from "./parts/params-editor"
import { BodyEditor } from "./parts/body-editor"
import { ResponseViewer } from "./parts/response-viewer"
import { Sidebar } from "./parts/sidebar"

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]

function createEmptyKV(): KeyValue {
  return { id: uuid(), key: "", value: "", enabled: true }
}

function initialRequest(): RequestModel {
  return {
    id: uuid(),
    method: "GET",
    url: "",
    params: [createEmptyKV()],
    headers: [createEmptyKV()],
    bodyMode: "none",
    bodyText: "",
    createdAt: Date.now(),
  }
}

export function MaaSApp() {
  const [request, setRequest] = useState<RequestModel>(() => initialRequest())
  const [history, setHistory] = useState<RequestModel[]>(() => loadHistory())
  const [sending, setSending] = useState(false)
  const [response, setResponse] = useState<ResponseModel | null>(null)
  const [activeTab, setActiveTab] = useState<"request" | "response">("request")

  const finalUrl = useMemo(() => {
    try {
      if (!request.url) return ""
      const url = new URL(request.url)
      for (const p of request.params.filter((p) => p.enabled && p.key)) {
        url.searchParams.set(p.key, p.value)
      }
      return url.toString()
    } catch {
      return request.url
    }
  }, [request.url, request.params])

  const effectiveHeaders = useMemo(() => {
    const map = new Map<string, string>()
    for (const h of request.headers.filter((h) => h.enabled && h.key)) {
      map.set(h.key, h.value)
    }
    if (request.bodyMode === "json" && !map.has("Content-Type") && ["POST", "PUT", "PATCH"].includes(request.method)) {
      map.set("Content-Type", "application/json")
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [request.headers, request.bodyMode, request.method])

  const onChangeKV = useCallback(
    (key: "params" | "headers", rows: KeyValue[]) => {
      setRequest((r) => ({ ...r, [key]: rows }))
    },
    [setRequest],
  )

  const resetRequest = () => {
    setResponse(null)
    setRequest(initialRequest())
    setActiveTab("request")
  }

  const sendRequest = async () => {
    if (!finalUrl) return
    setSending(true)
    setResponse(null)
    const started = performance.now()
    try {
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: request.method,
          url: finalUrl,
          headers: effectiveHeaders,
          bodyText: request.bodyText,
          bodyMode: request.bodyMode,
        }),
      })
      const data = (await res.json()) as ResponseModel
      const durationMs = Math.round(performance.now() - started)
      setResponse({ ...data, durationMs })
      setActiveTab("response")

      const entry: RequestModel = {
        ...request,
        id: uuid(),
        url: finalUrl,
        createdAt: Date.now(),
      }
      const updated = [entry, ...history].slice(0, 100)
      setHistory(updated)
      saveHistory(updated)
    } catch (e) {
      const durationMs = Math.round(performance.now() - started)
      setResponse({
        ok: false,
        status: 0,
        statusText: "Request failed",
        durationMs,
        sizeBytes: 0,
        headers: [],
        bodyText: String(e),
        bodyIsJson: false,
      })
      setActiveTab("response")
    } finally {
      setSending(false)
    }
  }

  const loadFromHistory = (item: RequestModel) => {
    setRequest({
      id: uuid(),
      method: item.method,
      url: item.url,
      params: item.params.length ? item.params.map((r) => ({ ...r, id: uuid() })) : [createEmptyKV()],
      headers: item.headers.length ? item.headers.map((r) => ({ ...r, id: uuid() })) : [createEmptyKV()],
      bodyMode: item.bodyMode,
      bodyText: item.bodyText,
      createdAt: Date.now(),
    })
    setResponse(null)
    setActiveTab("request")
  }

  const clearHistory = () => {
    setHistory([])
    saveHistory([])
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
      <aside className="bg-card border border-border rounded-lg">
        <Sidebar items={history} onSelect={loadFromHistory} onClear={clearHistory} />
      </aside>

      <section className="flex flex-col gap-4">
        <Card className="bg-card border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Select
                value={request.method}
                onValueChange={(v) => setRequest((r) => ({ ...r, method: v as HttpMethod }))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                value={request.url}
                onChange={(e) => setRequest((r) => ({ ...r, url: e.target.value }))}
                placeholder="https://api.example.com/v1/resource"
                aria-label="Request URL"
              />

              <Button onClick={sendRequest} disabled={sending || !request.url} className="whitespace-nowrap">
                {sending ? "Sending…" : "Send"}
              </Button>

              <Button variant="outline" onClick={resetRequest}>
                Reset
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="grid grid-cols-2 w-[260px]">
                <TabsTrigger value="request">Build</TabsTrigger>
                <TabsTrigger value="response" disabled={!response}>
                  Response
                </TabsTrigger>
              </TabsList>

              <TabsContent value="request" className="space-y-4">
                <Card className="bg-card border border-border">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Query Params</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ParamsEditor rows={request.params} onChange={(rows) => onChangeKV("params", rows)} />
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Headers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <HeadersEditor rows={request.headers} onChange={(rows) => onChangeKV("headers", rows)} />
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Body</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BodyEditor
                      method={request.method}
                      mode={request.bodyMode}
                      text={request.bodyText}
                      onChangeMode={(mode) => setRequest((r) => ({ ...r, bodyMode: mode }))}
                      onChangeText={(text) => setRequest((r) => ({ ...r, bodyText: text }))}
                    />
                  </CardContent>
                </Card>

                <div className="text-xs text-muted-foreground">
                  Final URL: <code className="bg-muted px-1 py-0.5 rounded">{finalUrl || "—"}</code>
                </div>
              </TabsContent>

              <TabsContent value="response">
                <ResponseViewer response={response} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
