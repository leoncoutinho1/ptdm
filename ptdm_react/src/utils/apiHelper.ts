export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export function getTenant(): string {
  const hostname = window.location.hostname;
  console.log(hostname);
  // Verifica se é um IP ou localhost para usar tenant padrão
  const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname);
  if (isIp || hostname === 'localhost') {
    return 'master';
  }

  // Se tiver subdomínio, assume que é o tenant (ex: tenant.dominio.com)
  const parts = hostname.split('.');
  console.log(parts);
  if (parts.length >= 2) {
    return parts[0];
  }

  return 'master';
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

async function refreshTokens(): Promise<TokenResponse | null> {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const tenant = getTenant();

  // Assume refresh endpoint is at /Login/refresh or similar, constructed with tenant
  const url = `/api/${tenant}/Login/refresh`;

  if (!accessToken || !refreshToken) return null;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ accessToken, refreshToken })
    });

    if (res.ok) {
      const data: TokenResponse = await res.json();
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return data;
    }
  } catch (error) {
    console.error("Token refresh failed", error);
  }
  return null;
}

export async function apiRequest<T>(
  route: string,
  method: HttpMethod = 'GET',
  body?: unknown
): Promise<T> {
  let token = localStorage.getItem('accessToken');
  const tenant = getTenant();
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

  let res = await fetch(url, {
    method,
    headers: getHeaders(token),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

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
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
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
