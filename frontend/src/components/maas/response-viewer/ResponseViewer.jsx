"use client"

import { useMemo } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

function StatusBadge({ status }) {
  const color =
    status >= 200 && status < 300
      ? "bg-green-600"
      : status >= 300 && status < 400
        ? "bg-blue-600"
        : status >= 400 && status < 500
          ? "bg-yellow-600"
          : status >= 500
            ? "bg-red-600"
            : "bg-muted-foreground"
  return <span className={`text-xs text-white px-2 py-0.5 rounded ${color}`}>{status ?? "-"}</span>
}

function formatBytes(n) {
  if (!n && n !== 0) return "-"
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export function ResponseViewer({ result, isSending }) {
  const headerPairs = result?.headers || []
  const bodyText = result?.bodyText || ""
  const meta = result?.meta || {}
  const isJson = !!meta?.isJson

  const prettyBody = useMemo(() => {
    if (isJson) {
      try {
        return JSON.stringify(JSON.parse(bodyText), null, 2)
      } catch {
        return bodyText
      }
    }
    return bodyText
  }, [isJson, bodyText])

  return (
    <div className="h-full grid grid-rows-[auto,1fr]">
      <div className="flex items-center gap-3 px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status</span>
          <StatusBadge status={result?.status} />
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="text-sm text-muted-foreground">
          Time: <span className="text-foreground">{meta?.durationMs ? `${meta.durationMs} ms` : "-"}</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="text-sm text-muted-foreground">
          Size: <span className="text-foreground">{formatBytes(meta?.size)}</span>
        </div>
        {isSending && <div className="text-sm text-muted-foreground">Sending...</div>}
        {result?.error && <div className="text-sm text-red-600">Error: {result.error}</div>}
      </div>

      <Tabs defaultValue="body" className="min-h-0">
        <TabsList className="mx-4 mt-3">
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
        </TabsList>

        <TabsContent value="body" className="min-h-0 h-[calc(100%-56px)]">
          <ScrollArea className="h-full px-4 pb-4">
            <pre className="text-sm font-mono whitespace-pre-wrap break-words">{prettyBody}</pre>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="headers" className="min-h-0 h-[calc(100%-56px)]">
          <ScrollArea className="h-full px-4 pb-4">
            <div className="text-sm">
              {headerPairs.length === 0 ? (
                <div className="text-muted-foreground">No headers</div>
              ) : (
                headerPairs.map(([k, v], i) => (
                  <div key={`${k}-${i}`} className="grid grid-cols-[200px,1fr] gap-2 py-1 border-b">
                    <div className="font-medium">{k}</div>
                    <div className="text-muted-foreground">{v}</div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
