"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import type { RequestModel } from "@/lib/maas/types"

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export function Sidebar({
  items,
  onSelect,
  onClear,
}: {
  items: RequestModel[]
  onSelect: (item: RequestModel) => void
  onClear: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="text-sm font-medium">History</div>
        <Button variant="outline" size="sm" onClick={onClear}>
          Clear
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <ul className="p-2 space-y-2">
          {items.length === 0 ? (
            <li className="text-xs text-muted-foreground px-1">No history yet.</li>
          ) : (
            items.map((it) => (
              <li key={it.id}>
                <button
                  onClick={() => onSelect(it)}
                  className="w-full text-left px-2 py-2 rounded-md hover:bg-muted/50 border border-transparent hover:border-border transition"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {it.method}
                    </Badge>
                    <span className="truncate text-sm">{it.url || "Untitled"}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">{timeAgo(it.createdAt)}</div>
                </button>
              </li>
            ))
          )}
        </ul>
      </ScrollArea>
    </div>
  )
}
