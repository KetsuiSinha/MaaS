"use client"

import { useState } from "react"

export default function SignOutButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  async function onSignOut() {
    setLoading(true)
    setError("")
    setMessage("")
    try {
      const res = await fetch("/api/signout", { method: "POST" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || "Sign out failed")
      }
      setMessage("Signed out!")
      // Optionally refresh:
      // window.location.reload()
    } catch (err) {
      setError(err?.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button type="button" className="border rounded px-4 py-2" onClick={onSignOut} disabled={loading}>
        {loading ? "Signing out..." : "Sign out"}
      </button>
      {error ? <span className="text-sm text-red-600">{error}</span> : null}
      {message ? <span className="text-sm text-green-600">{message}</span> : null}
    </div>
  )
}
