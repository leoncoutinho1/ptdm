import { db } from './db';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export function getTenant(): string {
  // Extract tenant from path: /tenant/resource...
  const pathParts = window.location.pathname.split('/');
  // pathParts[0] is empty because path starts with /
  // pathParts[1] should be the tenant
  if (pathParts.length >= 2 && pathParts[1]) {
    return pathParts[1];
  }
  return 'master';
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export async function saveAuthData(accessToken: string, refreshToken: string, tenant: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  await db.auth.put({ id: 'current_auth', accessToken, refreshToken, tenant });
}

export async function clearAuthData() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  await db.auth.delete('current_auth');
}

export async function getAuthData() {
  let auth = await db.auth.get('current_auth');
  if (!auth) {
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
  // Se estiver offline, não tenta o refresh
  if (!navigator.onLine) return null;

  const auth = await getAuthData();
  if (!auth) return null;

  const { accessToken, refreshToken, tenant } = auth;
  const url = `/api/${tenant}/Login/refresh`;

  try {
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
  } catch (error) {
    console.error('Token refresh failed', error);
  }
  return null;
}

export async function apiRequest<T>(
  route: string,
  method: HttpMethod = 'GET',
  body?: unknown
): Promise<T> {
  const auth = await getAuthData();
  const token = auth?.accessToken || null;
  const tenant = auth?.tenant || getTenant();
  //   console.log(tenant);
  // Garante que a URL base termine sem barra para consistência

  const cleanRoute = route.replace(/^\//, '');

  // Constrói a URL no formato: API_URL/{tenant}/{route}
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
  try {
    res = await fetch(url, {
      method,
      headers: getHeaders(token),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (!navigator.onLine) {
      throw new Error('Você está offline. Verifique sua conexão.');
    }
    throw error;
  }

  if (!res.ok) {
    // Se receber 401 (não autorizado), tenta refresh
    if (res.status === 401) {
      const newTokens = await refreshTokens();
      if (newTokens) {
        // Retry com novos tokens
        const newRes = await fetch(url, {
          method,
          headers: getHeaders(newTokens.accessToken),
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });

        // Se passar agora, retorna o resultado
        if (newRes.ok) {
          const ct = newRes.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            return (await newRes.json()) as T;
          }
          const text = await newRes.text();
          return text as unknown as T;
        }
        // Se falhar novamente no retry, throw original ou novo erro?
        // Geralmente se falhar novamente, é logout
      }

      // Se refresh falhar ou retry falhar
      // Mas se estiver offline, NÃO desloga. Apenas lança erro de conexão.
      if (!navigator.onLine) {
        throw new Error('Você está offline. Algumas operações podem não estar disponíveis.');
      }

      await clearAuthData();
      const currentTenant = getTenant();
      window.location.href = `/${currentTenant}/login`;
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    const msg = await res.text();
    throw new Error(msg || `HTTP ${res.status}`);
  }

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return (await res.json()) as T;
  }
  const text = await res.text();
  return text as unknown as T;
}
