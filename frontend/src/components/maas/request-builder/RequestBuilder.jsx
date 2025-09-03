"use client"

import { useEffect, useCallback } from "react"
import { MethodSelect } from "./sections/MethodSelect"
import { UrlBar } from "./sections/UrlBar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { KeyValueEditor } from "./sections/KeyValueEditor"
import { BodyEditor } from "./sections/BodyEditor"

export function RequestBuilder({ value = {}, onChange, onSend, isSending }) {
  // Parse params from URL into params list when URL changes and there are no manual params yet
  useEffect(() => {
    if (!value?.url) return
    if (value?.params?.length > 0) return
    try {
      const u = new URL(value.url)
      const arr = []
      u.searchParams.forEach((v, k) => {
        arr.push({ key: k, value: v, disabled: false })
      })
      if (arr.length > 0) onChange?.({ params: arr })
    } catch {}
  }, [value?.url, onChange])

  const onParamsChange = useCallback(
    (rows) => {
      onChange?.({ params: rows })
    },
    [onChange],
  )

  const onHeadersChange = useCallback(
    (rows) => {
      onChange?.({ headers: rows })
    },
    [onChange],
  )

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <MethodSelect
          value={value?.method || "GET"}
          onChange={(method) => onChange?.({ method })}
        />
        <UrlBar
          url={value?.url || ""}
          onChange={(url) => onChange?.({ url })}
          onSend={onSend}
          isSending={isSending}
        />
      </div>

      <Tabs defaultValue="params" className="w-full">
        <TabsList>
          <TabsTrigger value="params">Params</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
        </TabsList>

        <TabsContent value="params">
          <KeyValueEditor
            rows={value?.params || []}
            onChange={onParamsChange}
            emptyLabel="Add query params"
          />
        </TabsContent>

        <TabsContent value="headers">
          <KeyValueEditor
            rows={value?.headers || []}
            onChange={onHeadersChange}
            emptyLabel="Add headers"
          />
        </TabsContent>

        <TabsContent value="body">
          <BodyEditor
            mode={value?.bodyMode}
            text={value?.bodyText}
            onChange={(patch) => onChange?.(patch)}
            method={value?.method || "GET"}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
