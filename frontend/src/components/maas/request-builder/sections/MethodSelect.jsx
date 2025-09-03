"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]

export function MethodSelect({ value, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-32">
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
  )
}
