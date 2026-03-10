
import { SupabaseServer } from '../types';

const API_BASE = process.env.API_BASE;

const getAuthHeaders = () => {
    const token = localStorage.getItem('ebettr_access_token');
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'accept': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const handleResponse = async (response: Response, errorMsg: string) => {
    if (!response.ok) {
        const text = await response.text().catch(() => response.statusText);
        let errMsg = `${errorMsg} (${response.status})`;
        try {
            const errJson = JSON.parse(text);
            if (errJson.detail) errMsg = errJson.detail;
            else if (errJson.message) errMsg = errJson.message;
        } catch {}
        throw new Error(errMsg);
    }
    return response.json();
};

export const supabaseServerService = {
    list: async (): Promise<SupabaseServer[]> => {
        const response = await fetch(`${API_BASE}/admin/knowledge/servers`, {
            method: 'GET',
            headers: getAuthHeaders(),
            credentials: 'include'
        });
        const json = await handleResponse(response, 'Falha ao listar servidores Supabase');
        return json.data || [];
    },

    create: async (payload: Omit<SupabaseServer, 'id' | 'created_at' | 'updated_at'>): Promise<SupabaseServer> => {
        const response = await fetch(`${API_BASE}/admin/knowledge/servers`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(response, 'Falha ao criar servidor Supabase');
    },

    update: async (id: string, payload: Partial<SupabaseServer>): Promise<SupabaseServer> => {
        const response = await fetch(`${API_BASE}/admin/knowledge/servers/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(response, 'Falha ao atualizar servidor Supabase');
    },

    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/admin/knowledge/servers/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            const text = await response.text().catch(() => response.statusText);
            throw new Error(`Falha ao excluir servidor Supabase: ${text}`);
        }
    }
};
