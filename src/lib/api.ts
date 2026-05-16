import { disconnectSocket } from "./socket.js";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "https://furacomp-products-nilelock-backend.o9oxxq.easypanel.host";

let onUnauthorized: () => void = () => {
  /* set from App */
};

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

export function getApiBase(): string {
  return API_BASE;
}

export async function apiFetch(
  path: string,
  options: RequestInit & { json?: unknown } = {},
): Promise<Response> {
  const { json, ...init } = options;
  const headers = new Headers(init.headers);
  const token = localStorage.getItem("nilelock_token");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
    init.body = JSON.stringify(json);
  }
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, { ...init, headers });

  if (res.status === 401 && token) {
    localStorage.removeItem("nilelock_token");
    localStorage.removeItem("nilelock_role");
    localStorage.removeItem("nilelock_refresh");
    disconnectSocket();
    onUnauthorized();
  }

  return res;
}
