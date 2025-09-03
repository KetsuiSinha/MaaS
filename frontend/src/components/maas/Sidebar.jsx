"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

export function Sidebar({ items = [], onSelect }) {
  return (
    <aside className="w-64 border-r flex flex-col">
      <div className="px-2 py-2">
        <h2 className="text-sm font-medium">History</h2>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <ul className="space-y-1">
          {items.length === 0 ? (
            <li className="text-sm text-muted-foreground px-2">No requests yet</li>
          ) : (
            items.map((h) => (
              <li key={h.id}>
                <button
                  className="w-full text-left px-2 py-2 rounded hover:bg-muted transition"
                  onClick={() => onSelect(h)}
                  title={h.url}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono px-1 py-0.5 rounded bg-secondary/50">
                      {h.method}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(h.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="truncate text-sm">{h.url}</div>
                </button>
              </li>
            ))
          )}
        </ul>
      </ScrollArea>
    </aside>
  )
}
