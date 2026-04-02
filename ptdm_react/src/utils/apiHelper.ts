import { db } from './db';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const authChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('auth_channel') : null;

if (authChannel && typeof window !== 'undefined') {
  authChannel.onmessage = (event) => {
    if (event.data === 'LOGOUT') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tenant');
        localStorage.removeItem('permissions');
      }
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/stock/login';
      }
    }
  };
}

export async function checkConnectivity(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;

  try {
    // Use a lightweight endpoint to check connectivity
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`/stock/api/Login/request`, {
      method: 'HEAD',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return res.ok || res.status === 401; // 401 means reached the server but unauthorized
  } catch {
    return false;
  }
}

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function getTenant(): string {
  if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const payload = parseJwt(token);
      if (payload && payload.tenant) return payload.tenant;
    }
    const tenant = localStorage.getItem('tenant');
    if (tenant) return tenant;
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
    localStorage.setItem('tenant', tenant);
  }
  await db.auth.put({ id: 'current_auth', accessToken, refreshToken, tenant });
}

export async function clearAuthData() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tenant');
    localStorage.removeItem('permissions');
  }
  await db.auth.delete('current_auth');
  
  if (authChannel) {
    authChannel.postMessage('LOGOUT');
  }
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
  console.log('🔄 Init refreshTokens()');
  const auth = await getAuthData();
  if (auth) {
    const { accessToken, refreshToken } = auth;
    const url = `/stock/api/Login/refresh`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessToken, refreshToken }),
    });

    console.log('🔄 refreshTokens() response status:', res.status);

    if (res.ok) {
      const data: TokenResponse = await res.json();
      console.log('🔄 refreshTokens() success');
      // Tenant remains the same
      await saveAuthData(data.accessToken, data.refreshToken, auth.tenant);
      return data;
    }
    
    if (res.status === 401 || res.status === 400 || res.status === 403) {
      console.log('🚨 refreshTokens() returned 401/400/403! Clearing auth data...');
      await clearAuthData();
      console.log(typeof window);
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        console.log('🚨 Redirecting to /stock/login');
        window.location.href = `/stock/login`;
      }

      throw new Error('Sessão expirada. Faça login novamente.');
    }

    return null;
  }
  console.log('🚨 No auth data in refreshTokens, logging out...');
  await clearAuthData();
  console.log(typeof window);
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
    window.location.href = `/stock/login`;
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

  const cleanRoute = route.replace(/^\//, '');
  const url = `/stock/api/${cleanRoute}`;

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
