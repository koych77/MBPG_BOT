import { getDevTelegramId, getInitData } from "./telegram";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

function authHeaders() {
  const headers: Record<string, string> = {
    "x-telegram-init-data": getInitData()
  };
  const devId = getDevTelegramId();
  if (devId) headers["x-dev-telegram-id"] = devId;
  return headers;
}

export async function apiJson<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers ?? {})
    }
  });
  if (!response.ok) throw new Error((await response.json()).error ?? "Request failed");
  return response.json() as Promise<T>;
}

export async function apiForm<T>(path: string, body: FormData) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body
  });
  if (!response.ok) throw new Error((await response.json()).error ?? "Request failed");
  return response.json() as Promise<T>;
}

export function receiptFileUrl(id: string) {
  return `${API_BASE}/api/receipts/${id}/file`;
}

export function contentPostImageUrl(id: string) {
  return `${API_BASE}/api/content/posts/${id}/image`;
}

export function coachPhotoUrl(id: string) {
  return `${API_BASE}/api/content/coaches/${id}/photo`;
}
