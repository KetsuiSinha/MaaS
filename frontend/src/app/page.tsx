import { Suspense } from "react"
import { MaaSApp } from "@/components/maas/maas-app"

export const metadata = {
  title: "MaaS — API client",
  description: "",
}

export default function Page() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading MaaS…</div>}>
          <MaaSApp />
        </Suspense>
      </div>
    </main>
  )
}
