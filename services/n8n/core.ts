
import { ServerCredential } from '../../types';

export const DEFAULT_BASE_URL = process.env.API_BASE;

type ExtendedServerCredential = ServerCredential & {
  token?: string;
  authMode?: 'apiKey' | 'bearer' | 'cookie';
  useCookies?: boolean;
};

export type ActiveConfig = {
  baseUrl: string;
  apiKey: string | null;
  token: string | null;
  useCookies: boolean;
  authMode?: 'apiKey' | 'bearer' | 'cookie';
};

const normalizeBaseUrl = (url: string) => {
  let clean = url.trim().replace(/\/+$/, '');
  
  // Force HTTPS to avoid Mixed Content Error
  if (clean.startsWith('http://')) {
    clean = clean.replace('http://', 'https://');
  } else if (!clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }
  return clean;
};

const readActiveServer = (): ExtendedServerCredential | null => {
  try {
    const stored = localStorage.getItem('ebettr_servers');
    if (!stored) return null;
    const servers: ExtendedServerCredential[] = JSON.parse(stored);
    return servers.find((s) => (s as any).isActive) ?? null;
  } catch (e) {
    console.warn('[N8N] Falha ao ler ebettr_servers do localStorage', e);
    return null;
  }
};

export const getActiveConfig = (): ActiveConfig => {
  const active = readActiveServer();

  const rawUrl = active?.url || DEFAULT_BASE_URL;

  const baseUrl = normalizeBaseUrl(rawUrl);
  const apiKey = (active?.apiKey ?? '').trim() || null;
  
  const legacyToken = localStorage.getItem('ebettr_access_token');
  const token = (active?.token ?? legacyToken ?? '').trim() || null;

  const useCookies = !!(active?.useCookies);
  const authMode = active?.authMode;

  return { baseUrl, apiKey, token, useCookies, authMode };
};

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

const isFailedToFetch = (err: unknown) => {
  return err instanceof TypeError && /Failed to fetch/i.test(err.message);
};

export const safeJsonParse = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

type AuthPlan = {
  name: 'apiKey' | 'bearer' | 'cookie' | 'none';
  headers: Record<string, string>;
  credentials: RequestCredentials; 
};

const buildAuthPlans = (cfg: ActiveConfig): AuthPlan[] => {
  const baseHeaders: Record<string, string> = {
    accept: 'application/json',
  };

  const plans: AuthPlan[] = [];

  const bearerPlan: AuthPlan | null = cfg.token
    ? {
        name: 'bearer',
        headers: { ...baseHeaders, Authorization: `Bearer ${cfg.token}` },
        credentials: 'omit', 
      }
    : null;

  const apiKeyPlan: AuthPlan | null = cfg.apiKey
    ? {
        name: 'apiKey',
        headers: { ...baseHeaders, 'X-N8N-API-KEY': cfg.apiKey },
        credentials: 'omit',
      }
    : null;

  const cookiePlan: AuthPlan | null = cfg.useCookies
    ? {
        name: 'cookie',
        headers: { ...baseHeaders },
        credentials: 'include',
      }
    : null;

  const ordered = (() => {
    // If authMode is explicitly set, use only that one to avoid multiple requests
    if (cfg.authMode === 'apiKey' && apiKeyPlan) return [apiKeyPlan];
    if (cfg.authMode === 'bearer' && bearerPlan) return [bearerPlan];
    if (cfg.authMode === 'cookie' && cookiePlan) return [cookiePlan];
    
    // Fallback: Try Bearer -> API Key -> Cookie
    return [bearerPlan, apiKeyPlan, cookiePlan];
  })();

  ordered.forEach((p) => {
    if (p) plans.push(p);
  });

  if (plans.length === 0) {
    plans.push({ name: 'none', headers: { ...baseHeaders }, credentials: 'omit' });
  }

  return plans;
};

const withTimeout = (ms: number) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { controller, clear: () => clearTimeout(id) };
};

type FetchJsonOptions = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  expectJson?: boolean;
  retries?: number;
  timeoutMs?: number;
  tryNextOnAuthFailure?: boolean;
};

export const fetchJsonWithPlans = async <T>(
  url: string,
  cfg: ActiveConfig,
  options: FetchJsonOptions
): Promise<T> => {
  const plans = buildAuthPlans(cfg);

  const expectJson = options.expectJson ?? true;
  const retries = options.retries ?? 0;
  const timeoutMs = options.timeoutMs ?? 20000;
  const tryNextOnAuthFailure = options.tryNextOnAuthFailure ?? true;

  const baseInit: RequestInit = {
    method: options.method,
    redirect: 'follow',
    cache: 'no-store', // IMPORTANT: Prevents caching stale status responses
  };

  if (options.body !== undefined) {
    baseInit.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  for (const plan of plans) {
    let lastErr: any = null;
    let isNetworkError = false;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const { controller, clear } = withTimeout(timeoutMs);

      try {
        const headers: Record<string, string> = { ...plan.headers };

        if (options.body !== undefined) {
          headers['Content-Type'] = 'application/json';
        }

        const res = await fetch(url, {
          ...baseInit,
          headers,
          credentials: plan.credentials,
          signal: controller.signal,
        });

        clear();

        if (res.ok) {
          if (!expectJson) {
            return (await res.text()) as T;
          }
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            return (await res.json()) as T;
          }
          const text = await res.text();
          const parsed = safeJsonParse(text);
          return (parsed ?? (text as any)) as T;
        }

        const text = await res.text().catch(() => '');
        const parsed = safeJsonParse(text);

        let msg = '';
        if (parsed) {
            if (typeof parsed.detail === 'string') msg = parsed.detail;
            else if (typeof parsed.message === 'string') msg = parsed.message;
            else if (typeof parsed.error === 'string') msg = parsed.error;
            else if (parsed.error?.message) msg = parsed.error.message;
            else if (Array.isArray(parsed.detail)) {
                 msg = parsed.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
            } else if (parsed.detail) {
                 msg = JSON.stringify(parsed.detail);
            }
        }
        
        if (!msg) {
             msg = (text ? text.slice(0, 300) : res.statusText) || `HTTP ${res.status}`;
        }

        if (tryNextOnAuthFailure && (res.status === 401 || res.status === 403 || res.status === 302)) {
          lastErr = new Error(`[N8N] Plano ${plan.name} falhou (HTTP ${res.status}): ${msg}`);
          break; // Stop retries for this plan, move to next plan
        }

        throw new Error(`[N8N] HTTP ${res.status}: ${msg}`);
      } catch (err: any) {
        clear();
        lastErr = err;

        if (isFailedToFetch(err)) {
          isNetworkError = true;
          // Network errors (Mixed Content, CORS, DNS) are fatal for all auth plans.
          break; 
        }

        if (err?.name === 'AbortError') {
          if (attempt < retries) {
            await sleep(500 * (attempt + 1));
            continue;
          }
          break;
        }

        throw err;
      }
    }

    if (lastErr) {
      if (isNetworkError) {
        throw new Error(`[N8N] Erro de Conexão (${url}): Verifique se a URL usa HTTPS e se o servidor permite CORS.`);
      }
      if (!tryNextOnAuthFailure) {
        throw lastErr;
      }
      continue;
    }
  }

  throw new Error('[N8N] Falha na comunicação com o servidor.');
};
