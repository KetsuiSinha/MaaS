import { Suspense } from "react"
import { MaaSApp } from "@/components/maas/maas-app"

export const metadata = {
  title: "MaaS — Minimal API client",
  description: "A minimal Postman-like API client built with React + TypeScript.",
}

export default function Page() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight text-pretty">MaaS</h1>
          <p className="text-sm text-muted-foreground">Minimal API client</p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-4">
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading MaaS…</div>}>
          <MaaSApp />
        </Suspense>
      </div>
    </main>
  )
}
