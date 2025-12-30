import { apiConstants } from '@/constants/apiConstants';

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

export async function apiRequest<T>(
  route: string,
  method: HttpMethod = 'GET',
  body?: unknown
): Promise<T> {
  const token = localStorage.getItem('token');
  const tenant = getTenant();
  console.log(tenant);
  // Garante que a URL base termine sem barra para consistência
  const baseUrl = apiConstants.API_URL.replace(/\/$/, '');
  const cleanRoute = route.replace(/^\//, '');

  // Constrói a URL no formato: API_URL/{tenant}/{route}
  const url = `${baseUrl}/${tenant}/${cleanRoute}`;

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    // Se receber 401 (não autorizado), remove o token e redireciona para login
    if (res.status === 401) {
      localStorage.removeItem('token');
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
