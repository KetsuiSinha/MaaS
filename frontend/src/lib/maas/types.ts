import type { RequestModel } from "./types"

const HISTORY_KEY = "maas_history:v1"

export function loadHistory(): RequestModel[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RequestModel[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveHistory(items: RequestModel[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 100)))
  } catch {
    // no-op
  }
}
