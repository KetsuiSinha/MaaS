"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ResponseModel } from "@/lib/maas/types"

export function ResponseViewer({ response }: { response: ResponseModel | null }) {
  const prettyBody = useMemo(() => {
    if (!response?.bodyIsJson) return null
    try {
      return JSON.stringify(JSON.parse(response.bodyText || "null"), null, 2)
    } catch {
      return response.bodyText
    }
  }, [response?.bodyIsJson, response?.bodyText])

  const statusColor =
    response?.status >= 200 && response?.status < 300
      ? "bg-green-600 text-white"
      : response?.status >= 400
        ? "bg-red-600 text-white"
        : "bg-amber-600 text-white"

  if (!response) {
    return <p className="text-sm text-muted-foreground">No response yet.</p>
  }

  return (
    <Card className="bg-card border border-border">
      <CardContent className="pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={statusColor}>
            {response.status} {response.statusText}
          </Badge>
          <Separator orientation="vertical" className="h-5" />
          <span className="text-xs text-muted-foreground">Time: {response.durationMs} ms</span>
          <Separator orientation="vertical" className="h-5" />
          <span className="text-xs text-muted-foreground">
            Size: {(response.sizeBytes / (1024 * 1024)).toFixed(1)} MB
          </span>
        </div>

        <Tabs defaultValue="body" className="mt-4">
          <TabsList>
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
          </TabsList>

          <TabsContent value="body">
            <ScrollArea className="h-[360px] rounded border border-border bg-muted/30">
              <pre className="p-3 text-sm leading-relaxed">{response.bodyIsJson ? prettyBody : response.bodyText}</pre>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="headers">
            <div className="rounded border border-border bg-muted/30">
              <div className="p-3 grid gap-2">
                {response.headers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No headers.</p>
                ) : (
                  response.headers.map((h) => (
                    <div key={h.name + h.value} className="grid grid-cols-[200px_1fr] gap-2 items-center">
                      <div className="text-xs text-muted-foreground">{h.name}</div>
                      <div className="text-sm">{h.value}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
