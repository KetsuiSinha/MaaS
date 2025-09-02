// frontend/src/lib/maas/types.ts

// Allowed HTTP methods
export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS"


export type BodyMode = "none" | "text" | "json"
// A single saved request (for history, collections, etc.)
export interface RequestModel {
  id: string
  method: HttpMethod
  url: string
  createdAt: number // Date.now()
  params: KeyValue[]      // query params
  headers: KeyValue[]     // request headers
  bodyMode: BodyMode      // body type
  bodyText: string        // raw text body (for text/json modes)
}

export interface KeyValue {
  id: string
  key: string
  value: string
  enabled: boolean
}

export interface ResponseHeader {
  name: string
  value: string
}

export interface HeaderPair {
  name: string
  value: string
}

export interface ResponseModel {
  ok: boolean
  status: number
  statusText: string
  durationMs: number
  sizeBytes: number
  headers: HeaderPair[]
  bodyText: string
  bodyIsJson: boolean
}
