
import { parseError } from './apiUtils';

const API_BASE = process.env.API_BASE;

const getAuthHeaders = (extraHeaders: Record<string, string> = {}) => {
    const token = localStorage.getItem('ebettr_access_token');
    const headers: Record<string, string> = {
        'accept': 'application/json',
        ...extraHeaders
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

export interface ApiUser {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'client' | 'support';
    company_id?: string;
    is_blocked: boolean;
    two_factor_enabled: boolean;
    last_login?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateUserPayload {
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'client' | 'support';
    company_id?: string | null;
    is_blocked?: boolean;
}

export interface UpdateUserPayload {
    password?: string;
    name: string;
    role: string;
    company_id?: string | null;
    is_blocked: boolean;
}

export const userService = {
    async list(): Promise<ApiUser[]> {
        const response = await fetch(`${API_BASE}/admin/users?limit=500&offset=0`, {
            method: 'GET',
            headers: getAuthHeaders(),
            credentials: 'include'
        });

        if (!response.ok) {
                throw new Error(await parseError(response, 'Falha ao buscar usuários'));
        }

        const json = await response.json();
        const data = Array.isArray(json.data) ? json.data : [];
        
        // Garante que o ID esteja presente verificando múltiplas propriedades comuns
        return data.map((u: any) => ({
            ...u,
            id: u.id || u._id || u.uuid // Fallback robusto para ID
        }));
    },

    async create(payload: CreateUserPayload): Promise<void> {
        const response = await fetch(`${API_BASE}/admin/users`, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(await parseError(response, 'Falha ao criar usuário'));
        }
    },

    async update(id: string, payload: UpdateUserPayload): Promise<void> {
        const response = await fetch(`${API_BASE}/admin/users/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(await parseError(response, 'Falha ao atualizar usuário'));
        }
    },

    async delete(id: string): Promise<void> {
        console.log(`[UserService] Deleting user with ID: ${id}`);
        const response = await fetch(`${API_BASE}/admin/users/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
            credentials: 'include'
        });

        // 204 No Content é sucesso para DELETE
        if (response.status === 204) return;

        if (!response.ok) {
            throw new Error(await parseError(response, 'Falha ao excluir usuário'));
        }
    },

    async block(id: string): Promise<void> {
        const response = await fetch(`${API_BASE}/admin/users/${id}/block`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: '', 
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(await parseError(response, 'Falha ao bloquear usuário'));
        }
    },

    async unblock(id: string): Promise<void> {
        const response = await fetch(`${API_BASE}/admin/users/${id}/unblock`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: '', 
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(await parseError(response, 'Falha ao desbloquear usuário'));
        }
    }
};
