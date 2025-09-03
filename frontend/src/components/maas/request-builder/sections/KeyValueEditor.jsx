"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

export function KeyValueEditor({ rows, onChange, emptyLabel }) {
  const [data, setData] = useState(rows || [])

  useEffect(() => {
    setData(rows || [])
  }, [rows])

  const update = (next) => {
    setData(next)
    onChange(next)
  }

  const addRow = () => {
    update([...(data || []), { key: "", value: "", disabled: false }])
  }

  const removeRow = (idx) => {
    const next = data.slice()
    next.splice(idx, 1)
    update(next)
  }

  const setCell = (idx, patch) => {
    const next = data.slice()
    next[idx] = { ...(next[idx] || {}), ...patch }
    update(next)
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{emptyLabel}</span>
        <Button size="sm" variant="secondary" onClick={addRow}>
          Add
        </Button>
      </div>

      <div className="border rounded">
        <div className="grid grid-cols-[24px,1fr,1fr,64px] items-center px-2 py-2 text-xs text-muted-foreground border-b">
          <div className="pl-1">On</div>
          <div>Key</div>
          <div>Value</div>
          <div></div>
        </div>
        {(data || []).length === 0 ? (
          <div className="px-3 py-4 text-sm text-muted-foreground">No rows</div>
        ) : (
          (data || []).map((row, idx) => (
            <div key={idx} className="grid grid-cols-[24px,1fr,1fr,64px] items-center gap-2 px-2 py-2 border-t">
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={!row.disabled}
                  onCheckedChange={(c) => setCell(idx, { disabled: !c })}
                  aria-label="Toggle row"
                />
              </div>
              <Input value={row.key || ""} onChange={(e) => setCell(idx, { key: e.target.value })} placeholder="key" />
              <Input
                value={row.value || ""}
                onChange={(e) => setCell(idx, { value: e.target.value })}
                placeholder="value"
              />
              <div className="flex justify-end">
                <Button size="sm" variant="ghost" onClick={() => removeRow(idx)}>
                  Remove
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
