import { db } from './db';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function checkConnectivity(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;

  try {
    const auth = await getAuthData();
    const tenant = auth?.tenant || 'master';
    // Use a lightweight endpoint to check connectivity
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`/api/${tenant}/Login/request`, {
      method: 'HEAD',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return res.ok || res.status === 401; // 401 means reached the serve but unauthorized
  } catch {
    return false;
  }
}

export function getTenant(): string {
  // Use self.location which works in both window and service worker context
  const path = typeof window !== 'undefined' ? window.location.pathname : (typeof self !== 'undefined' ? self.location.pathname : '');
  const pathParts = path.split('/');

  if (pathParts.length >= 2 && pathParts[1] && pathParts[1] !== 'api') {
    return pathParts[1];
  }
  return 'master';
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export async function saveAuthData(accessToken: string, refreshToken: string, tenant: string) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }
  await db.auth.put({ id: 'current_auth', accessToken, refreshToken, tenant });
}

export async function clearAuthData() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
  await db.auth.delete('current_auth');
}

export async function getAuthData() {
  let auth = await db.auth.get('current_auth');
  if (!auth && typeof localStorage !== 'undefined') {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const tenant = getTenant();
    if (accessToken && refreshToken) {
      auth = { id: 'current_auth', accessToken, refreshToken, tenant };
      await db.auth.put(auth);
    }
  }
  return auth;
}

async function refreshTokens(): Promise<TokenResponse | null> {
  const auth = await getAuthData();
  if (auth) {
    const { accessToken, refreshToken, tenant } = auth;
    const url = `/api/${tenant}/Login/refresh`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessToken, refreshToken }),
    });

    if (res.ok) {
      const data: TokenResponse = await res.json();
      await saveAuthData(data.accessToken, data.refreshToken, tenant);
      return data;
    }
  }

  await clearAuthData();
  if (typeof window !== 'undefined') {
    const currentTenant = getTenant();
    window.location.href = `/${currentTenant}/login`;
  }
  throw new Error('Sessão expirada. Faça login novamente.');
}

export async function apiRequest<T>(
  route: string,
  method: HttpMethod = 'GET',
  body?: unknown
): Promise<T> {
  const auth = await getAuthData();
  const token = auth?.accessToken || null;
  const tenant = auth?.tenant || getTenant();

  const cleanRoute = route.replace(/^\//, '');
  const url = `/api/${tenant}/${cleanRoute}`;

  const getHeaders = (t: string | null) => {
    const h: Record<string, string> = {};
    if (t) {
      h.Authorization = `Bearer ${t}`;
    }
    if (body !== undefined) {
      h['Content-Type'] = 'application/json';
    }
    return h;
  };

  let res: Response;

  res = await fetch(url, {
    method,
    headers: getHeaders(token),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.ok) {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      return (await res.json()) as T;
    }
    const text = await res.text();
    return text as unknown as T;
  }

  if (res.status === 401) {
    const newTokens = await refreshTokens();
    if (newTokens) {
      const newRes = await fetch(url, {
        method,
        headers: getHeaders(newTokens.accessToken),
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      if (newRes.ok) {
        const ct = newRes.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          return (await newRes.json()) as T;
        }
        const text = await newRes.text();
        return text as unknown as T;
      }
    }
  }

  const msg = await res.text();
  throw new Error(msg || `HTTP ${res.status}`);
}
