
import { ServerCredential } from '../types';
import { parseError } from './apiUtils';

const API_BASE = process.env.API_BASE;

const getAuthHeaders = (extraHeaders: Record<string, string> = {}) => {
    const headers: Record<string, string> = { 
        'accept': 'application/json',
        ...extraHeaders
    };
    const token = localStorage.getItem('ebettr_access_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const parseJsonOrText = async (response: Response) => {
    const text = await response.text();
    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
};

export const serverManagementService = {
  async list(): Promise<ServerCredential[]> {
    const res = await fetch(`${API_BASE}/admin/servers`, {
        headers: getAuthHeaders(),
        credentials: 'include'
    });
    if (!res.ok) {
        throw new Error(await parseError(res, 'Falha ao buscar servidores'));
    }
    const data = await res.json();
    
    return data.map((s: any) => ({
        id: String(s.id),
        name: s.name,
        url: s.url,
        apiKey: s.api_key,
        cookie: s.cookie || '',
        browserId: s.browser_id || '',
        isActive: s.is_active
    }));
  },

  async create(server: Omit<ServerCredential, 'id'>): Promise<void> {
    const payload = {
        name: server.name,
        url: server.url,
        api_key: server.apiKey,
        cookie: server.cookie,
        browser_id: server.browserId,
        is_active: server.isActive
    };
    const res = await fetch(`${API_BASE}/admin/servers`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
        credentials: 'include'
    });
    if (!res.ok) {
        throw new Error(await parseError(res, 'Falha ao criar servidor'));
    }
  },

  async test(server: Pick<ServerCredential, 'url' | 'apiKey' | 'cookie' | 'browserId'>): Promise<any> {
    const payload = {
        url: server.url,
        api_key: server.apiKey,
        cookie: server.cookie,
        browser_id: server.browserId,
    };

    const res = await fetch(`${API_BASE}/admin/servers/test`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
        credentials: 'include'
    });

    if (!res.ok) {
        const parsed = await parseJsonOrText(res);
        const detail = parsed && typeof parsed === 'object' ? (parsed as any).detail ?? parsed : null;
        const message =
            (detail && typeof detail.message === 'string' && detail.message) ||
            (parsed && typeof parsed === 'object' && typeof (parsed as any).message === 'string' && (parsed as any).message) ||
            'Falha ao testar servidor';

        const error = new Error(message) as Error & { detail?: any; response?: any };
        error.detail = detail;
        error.response = parsed;
        throw error;
    }

    return await parseJsonOrText(res);
  },

  async update(idOrUrl: string, server: Partial<ServerCredential>): Promise<void> {
    const payload: any = {};
    if (server.name !== undefined) payload.name = server.name;
    if (server.url !== undefined) payload.url = server.url;
    if (server.apiKey !== undefined) payload.api_key = server.apiKey;
    if (server.cookie !== undefined) payload.cookie = server.cookie;
    if (server.browserId !== undefined) payload.browser_id = server.browserId;
    if (server.isActive !== undefined) payload.is_active = server.isActive;

    // Codifica a URL/ID para usar na rota, conforme padrão da API (ex: .../servers/https%3A%2F%2F...)
    const res = await fetch(`${API_BASE}/admin/servers/${encodeURIComponent(idOrUrl)}`, {
        method: 'PUT', 
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
        credentials: 'include'
    });
    if (!res.ok) {
        throw new Error(await parseError(res, 'Falha ao atualizar servidor'));
    }
  },

  async delete(idOrUrl: string): Promise<void> {
    // Codifica a URL/ID para usar na rota
    const res = await fetch(`${API_BASE}/admin/servers/${encodeURIComponent(idOrUrl)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
    });
    if (!res.ok) {
        throw new Error(await parseError(res, 'Falha ao excluir servidor'));
    }
  }
};
