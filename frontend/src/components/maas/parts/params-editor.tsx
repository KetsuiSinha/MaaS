"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Trash2 } from "lucide-react"
import { v4 as uuid } from "uuid"
import type { KeyValue } from "@/lib/maas/types"

export function ParamsEditor({
  rows,
  onChange,
}: {
  rows: KeyValue[]
  onChange: (rows: KeyValue[]) => void
}) {
  const addRow = () => onChange([...rows, { id: uuid(), key: "", value: "", enabled: true }])
  const update = (id: string, patch: Partial<KeyValue>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const remove = (id: string) => onChange(rows.filter((r) => r.id !== id))

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[24px_1fr_1fr_32px] gap-2 items-center text-xs text-muted-foreground">
        <div className="sr-only">Enabled</div>
        <div>Key</div>
        <div>Value</div>
        <div className="sr-only">Actions</div>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="grid grid-cols-[24px_1fr_1fr_32px] gap-2 items-center">
            <Checkbox
              checked={r.enabled}
              onCheckedChange={(v) => update(r.id, { enabled: Boolean(v) })}
              aria-label="Enable param"
            />
            <Input
              value={r.key}
              onChange={(e) => update(r.id, { key: e.target.value })}
              placeholder="search"
              aria-label="Param key"
            />
            <Input
              value={r.value}
              onChange={(e) => update(r.id, { value: e.target.value })}
              placeholder="cats"
              aria-label="Param value"
            />
            <Button variant="ghost" size="icon" onClick={() => remove(r.id)} aria-label="Remove param">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <div>
        <Button variant="outline" onClick={addRow}>
          Add param
        </Button>
      </div>
    </div>
  )
}
