
import { Company } from '../types';
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

// Helper para converter string vazia em null (padrão API)
const sanitizeValue = (val?: string) => {
    if (!val || val.trim() === '') return null;
    return val.trim();
};

export const companyService = {
    // GET /admin/companies
    async list(): Promise<Company[]> {
        const response = await fetch(`${API_BASE}/admin/companies`, {
            method: 'GET',
            headers: getAuthHeaders(),
            credentials: 'include'
        });

        if (!response.ok) {
                throw new Error(await parseError(response, 'Falha ao buscar empresas'));
        }

        const json = await response.json();
        // Suporta tanto array direto quanto { data: [...] }
        const list = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);

        return list.map((c: any) => ({
            id: c.id,
            name: c.name,
            contactEmail: c.contact_email || undefined,
            contactPhone: c.contact_phone || undefined,
            website: c.website || undefined,
            createdAt: c.created_at,
            agentCount: c.agent_count || 0,
            userCount: c.user_count || 0
        }));
    },

    // GET /admin/companies/{company_id}
    async getById(id: string): Promise<Company> {
        const response = await fetch(`${API_BASE}/admin/companies/${id}`, {
            method: 'GET',
            headers: getAuthHeaders(),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(await parseError(response, 'Falha ao obter empresa'));
        }

        const c = await response.json();
        return {
            id: c.id,
            name: c.name,
            contactEmail: c.contact_email || undefined,
            contactPhone: c.contact_phone || undefined,
            website: c.website || undefined,
            createdAt: c.created_at
        };
    },

    // POST /admin/companies
    async create(payload: { name: string; contact_email?: string; contact_phone?: string; website?: string }): Promise<void> {
        const cleanPayload = {
            name: payload.name.trim(),
            contact_email: sanitizeValue(payload.contact_email),
            contact_phone: sanitizeValue(payload.contact_phone),
            website: sanitizeValue(payload.website)
        };

        const response = await fetch(`${API_BASE}/admin/companies`, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(cleanPayload),
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(await parseError(response, 'Falha ao criar empresa'));
        }
    },

    // PUT /admin/companies/{company_id}
    async update(id: string, payload: { name?: string; contact_email?: string; contact_phone?: string; website?: string }): Promise<void> {
        const cleanPayload: any = {};
        if (payload.name !== undefined) cleanPayload.name = payload.name.trim();
        if (payload.contact_email !== undefined) cleanPayload.contact_email = sanitizeValue(payload.contact_email);
        if (payload.contact_phone !== undefined) cleanPayload.contact_phone = sanitizeValue(payload.contact_phone);
        if (payload.website !== undefined) cleanPayload.website = sanitizeValue(payload.website);

        const response = await fetch(`${API_BASE}/admin/companies/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(cleanPayload),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(await parseError(response, 'Falha ao atualizar empresa'));
        }
    },

    // DELETE /admin/companies/{company_id}
    async delete(id: string): Promise<void> {
        const response = await fetch(`${API_BASE}/admin/companies/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(await parseError(response, 'Falha ao excluir empresa'));
        }
    }
};
