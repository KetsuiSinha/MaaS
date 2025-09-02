import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { HttpMethod } from "@/lib/maas/types"
import { useMemo } from "react"

export function BodyEditor({
  method,
  mode,
  text,
  onChangeMode,
  onChangeText,
}: {
  method: HttpMethod
  mode: "none" | "json" | "text"
  text: string
  onChangeMode: (m: "none" | "json" | "text") => void
  onChangeText: (v: string) => void
}) {
  const isBodyAllowed = useMemo(
    () => ["POST", "PUT", "PATCH"].includes(method),
    [method]
  )

  if (!isBodyAllowed) {
    return (
      <p className="text-sm text-muted-foreground">
        Body is not used with {method} requests.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <Tabs
        value={mode}
        onValueChange={(v) => onChangeMode(v as "none" | "json" | "text")}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="none">None</TabsTrigger>
          <TabsTrigger value="json">JSON</TabsTrigger>
          <TabsTrigger value="text">Text</TabsTrigger>
        </TabsList>
        <TabsContent value="none">
          <p className="text-sm text-muted-foreground">No request body.</p>
        </TabsContent>
        <TabsContent value="json">
          <Textarea
            value={text}
            onChange={(e) => onChangeText(e.target.value)}
            placeholder='{"name":"MaaS"}'
            className="min-h-[180px]"
            aria-label="JSON body"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Content-Type will be set to application/json automatically unless overridden.
          </p>
        </TabsContent>
        <TabsContent value="text">
          <Textarea
            value={text}
            onChange={(e) => onChangeText(e.target.value)}
            placeholder="Raw text body"
            className="min-h-[180px]"
            aria-label="Text body"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
