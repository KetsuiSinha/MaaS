"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function UrlBar({ url, onChange, onSend, isSending }) {
  return (
    <div className="flex-1 flex items-center gap-2">
      <Input value={url} onChange={(e) => onChange(e.target.value)} placeholder="https://api.example.com/resource" />
      <Button onClick={onSend} disabled={isSending}>
        {isSending ? "Sending..." : "Send"}
      </Button>
    </div>
  )
}
