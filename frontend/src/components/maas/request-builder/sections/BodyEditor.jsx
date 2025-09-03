"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useEffect } from "react"

export function BodyEditor({ mode, text, onChange, method }) {
  // If method becomes GET/HEAD, ensure body is none
  useEffect(() => {
    if (["GET", "HEAD"].includes((method || "").toUpperCase()) && mode !== "none") {
      onChange({ bodyMode: "none" })
    }
  }, [method])

  return (
    <div className="space-y-2">
      <Tabs value={mode} onValueChange={(v) => onChange({ bodyMode: v })}>
        <TabsList>
          <TabsTrigger value="none">None</TabsTrigger>
          <TabsTrigger value="raw" disabled={["GET", "HEAD"].includes((method || "").toUpperCase())}>
            Raw
          </TabsTrigger>
          <TabsTrigger value="json" disabled={["GET", "HEAD"].includes((method || "").toUpperCase())}>
            JSON
          </TabsTrigger>
        </TabsList>

        <TabsContent value="none">
          <p className="text-sm text-muted-foreground">No body will be sent.</p>
        </TabsContent>

        <TabsContent value="raw">
          <Textarea
            className="min-h-40 font-mono text-sm"
            placeholder="Raw body..."
            value={text}
            onChange={(e) => onChange({ bodyText: e.target.value })}
          />
        </TabsContent>

        <TabsContent value="json">
          <Textarea
            className="min-h-40 font-mono text-sm"
            placeholder='{"example": "value"}'
            value={text}
            onChange={(e) => onChange({ bodyText: e.target.value })}
          />
          <p className="text-xs text-muted-foreground mt-1">Content-Type: application/json</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
