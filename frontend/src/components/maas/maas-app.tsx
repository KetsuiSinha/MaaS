"use client";

import { useCallback, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { HttpMethod, KeyValue, RequestModel, ResponseModel } from "@/lib/maas/types";
import { loadHistory, saveHistory } from "@/lib/maas/storage";
import { HeadersEditor } from "./parts/headers-editor";
import { ParamsEditor } from "./parts/params-editor";
import { BodyEditor } from "./parts/body-editor";
import { ResponseViewer } from "./parts/response-viewer";
import { Sidebar } from "./parts/sidebar";
import { AuthCard } from "./parts/auth-form"; // ✅ shared login/signup form

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
type TabKey = "auth" | "request" | "response";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error((errorData as { message?: string }).message || "Request failed");
  }

  return res.json() as Promise<T>;
}

function createEmptyKV(): KeyValue {
  return { id: uuid(), key: "", value: "", enabled: true };
}

function initialRequest(): RequestModel {
  return {
    id: uuid(),
    method: "GET",
    url: "",
    params: [createEmptyKV()],
    headers: [createEmptyKV()],
    bodyMode: "none",
    bodyText: "",
    createdAt: Date.now(),
  };
}

export function MaaSApp() {
  const [tab, setTab] = useState<TabKey>("auth");
  const [isSignup, setIsSignup] = useState(false); // toggle between sign in/sign up
  const [request, setRequest] = useState<RequestModel>(initialRequest);
  const [history, setHistory] = useState<RequestModel[]>(loadHistory);
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<ResponseModel | null>(null);
  const [activeRequestTab, setActiveRequestTab] = useState<"request" | "response">("request");

  const finalUrl = useMemo(() => {
    try {
      if (!request.url) return "";
      const url = new URL(request.url);
      request.params.filter(p => p.enabled && p.key).forEach(p => url.searchParams.set(p.key, p.value));
      return url.toString();
    } catch {
      return request.url;
    }
  }, [request.url, request.params]);

  const effectiveHeaders = useMemo(() => {
    const map = new Map<string, string>();
    request.headers.filter(h => h.enabled && h.key).forEach(h => map.set(h.key, h.value));
    if (request.bodyMode === "json" && !map.has("Content-Type") && ["POST", "PUT", "PATCH"].includes(request.method)) {
      map.set("Content-Type", "application/json");
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [request.headers, request.bodyMode, request.method]);

  const onChangeKV = useCallback((key: "params" | "headers", rows: KeyValue[]) => {
    setRequest(r => ({ ...r, [key]: rows }));
  }, []);

  const resetRequest = () => {
    setResponse(null);
    setRequest(initialRequest());
    setActiveRequestTab("request");
  };

  const sendRequest = async () => {
    if (!finalUrl) return;
    setSending(true);
    setResponse(null);
    const started = performance.now();

    try {
      const data = await apiRequest<ResponseModel>("/api/proxy", {
        method: "POST",
        body: JSON.stringify({
          method: request.method,
          url: finalUrl,
          headers: effectiveHeaders,
          bodyText: request.bodyText,
          bodyMode: request.bodyMode,
        }),
      });

      const durationMs = Math.round(performance.now() - started);
      setResponse({ ...data, durationMs });
      setActiveRequestTab("response");

      const entry: RequestModel = { ...request, id: uuid(), url: finalUrl, createdAt: Date.now() };
      const updated = [entry, ...history].slice(0, 100);
      setHistory(updated);
      saveHistory(updated);
    } catch (e: unknown) {
      const durationMs = Math.round(performance.now() - started);
      setResponse({
        ok: false,
        status: 0,
        statusText: "Request failed",
        durationMs,
        sizeBytes: 0,
        headers: [],
        bodyText: e instanceof Error ? e.message : String(e),
        bodyIsJson: false,
      });
      setActiveRequestTab("response");
    } finally {
      setSending(false);
    }
  };

  const loadFromHistory = (item: RequestModel) => {
    setRequest({
      id: uuid(),
      method: item.method,
      url: item.url,
      params: item.params.length ? item.params.map(r => ({ ...r, id: uuid() })) : [createEmptyKV()],
      headers: item.headers.length ? item.headers.map(r => ({ ...r, id: uuid() })) : [createEmptyKV()],
      bodyMode: item.bodyMode,
      bodyText: item.bodyText,
      createdAt: Date.now(),
    });
    setResponse(null);
    setActiveRequestTab("request");
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  const handleAuth = async (data: { name?: string; email: string; password: string }) => {
    try {
      const endpoint = isSignup ? "/auth/register" : "/auth/login";
      const res = await apiRequest<{ token: string }>(endpoint, {
        method: "POST",
        body: JSON.stringify(data),
      });
      localStorage.setItem("token", res.token);
      setTab("request"); // switch to request tab after successful auth
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  // ---------- Auth Tab ----------
  if (tab === "auth") {
    return (
      <div className="max-w-sm mx-auto mt-20">
        <Card className="p-4">
          <CardHeader>
            <CardTitle>{isSignup ? "Sign Up" : "Sign In"}</CardTitle>
          </CardHeader>
          <CardContent>
            <AuthCard mode={isSignup ? "signup" : "login"} onSubmit={handleAuth} />
            <div className="text-center mt-2 text-sm text-muted-foreground">
              {isSignup ? (
                <span>
                  Already have an account?{" "}
                  <button className="text-blue-500" onClick={() => setIsSignup(false)}>Sign In</button>
                </span>
              ) : (
                <span>
                  Don’t have an account?{" "}
                  <button className="text-blue-500" onClick={() => setIsSignup(true)}>Sign Up</button>
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------- MaaS Request/Response Tabs ----------
  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
      <aside className="bg-card border border-border rounded-lg">
        <Sidebar items={history} onSelect={loadFromHistory} onClear={clearHistory} />
      </aside>

      <section className="flex flex-col gap-4">
        <Card className="bg-card border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Select value={request.method} onValueChange={v => setRequest(r => ({ ...r, method: v as HttpMethod }))}>
                <SelectTrigger className="w-[120px]"><SelectValue placeholder="Method" /></SelectTrigger>
                <SelectContent>{METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
              <input
                value={request.url}
                onChange={e => setRequest(r => ({ ...r, url: e.target.value }))}
                placeholder="https://api.example.com/v1/resource"
                aria-label="Request URL"
                className="flex-1 px-2 py-1 border rounded"
              />
              <Button onClick={sendRequest} disabled={sending || !request.url}>{sending ? "Sending…" : "Send"}</Button>
              <Button variant="outline" onClick={resetRequest}>Reset</Button>
            </div>

            <Tabs value={activeRequestTab} onValueChange={v => setActiveRequestTab(v as "request" | "response")}>
              <TabsList className="grid grid-cols-2 w-[260px]">
                <TabsTrigger value="request">Build</TabsTrigger>
                <TabsTrigger value="response" disabled={!response}>Response</TabsTrigger>
              </TabsList>

              <TabsContent value="request">
                <Card className="bg-card border border-border">
                  <CardHeader className="py-3"><CardTitle className="text-sm">Query Params</CardTitle></CardHeader>
                  <CardContent><ParamsEditor rows={request.params} onChange={rows => onChangeKV("params", rows)} /></CardContent>
                </Card>

                <Card className="bg-card border border-border">
                  <CardHeader className="py-3"><CardTitle className="text-sm">Headers</CardTitle></CardHeader>
                  <CardContent><HeadersEditor rows={request.headers} onChange={rows => onChangeKV("headers", rows)} /></CardContent>
                </Card>

                <Card className="bg-card border border-border">
                  <CardHeader className="py-3"><CardTitle className="text-sm">Body</CardTitle></CardHeader>
                  <CardContent>
                    <BodyEditor
                      method={request.method}
                      mode={request.bodyMode}
                      text={request.bodyText}
                      onChangeMode={mode => setRequest(r => ({ ...r, bodyMode: mode }))}
                      onChangeText={text => setRequest(r => ({ ...r, bodyText: text }))}
                    />
                  </CardContent>
                </Card>

                <div className="text-xs text-muted-foreground">
                  Final URL: <code className="bg-muted px-1 py-0.5 rounded">{finalUrl || "—"}</code>
                </div>
              </TabsContent>

              <TabsContent value="response">
                <ResponseViewer response={response} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
