
import { Agent, ConfigSection, AccessRule, ApiAgent } from '../types';
import { companyService } from './companyService';
import { parseError } from './apiUtils';

const API_BASE = process.env.API_BASE;

const getAuthHeaders = () => {
    const token = localStorage.getItem('ebettr_access_token');
    return {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

const sanitizeUuid = (val?: string | null) => {
    if (!val || val.trim() === '') return null;
    return val.trim();
};

export const agentService = {
    async list(): Promise<Agent[]> {
        const response = await fetch(`${API_BASE}/agents?limit=500&offset=0`, {
            headers: {
                ...getAuthHeaders(),
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(await parseError(response, 'Falha ao buscar agentes'));
        }

        const json = await response.json();
        const data: ApiAgent[] = Array.isArray(json.data) ? json.data : [];

        let companies: any[] = [];
        try {
            companies = await companyService.list();
        } catch (e: any) {
            if (e.message && !e.message.includes('403') && !e.message.includes('Permissão') && !e.message.includes('Falha ao buscar empresas')) {
                console.debug("Could not load companies for mapping", e);
            }
        }

        return data.map((item) => {
            const sections: ConfigSection[] = (item.config_sections || []).map((s) => {
                if (typeof s === 'string') {
                    try { return JSON.parse(s); } catch { return null; }
                }
                return s;
            }).filter(Boolean);

            const company = companies.find(c => c.id === item.company_id);

            return {
                id: item.id || item.uuid || '',
                name: item.name,
                description: item.description,
                active: item.active,
                maintenance: item.maintenance,
                isBlocked: item.is_blocked,
                wasActiveBeforeBlock: item.was_active_before_block,
                workflowId: item.workflow_id,
                hasTestMode: item.has_test_mode,
                testWebhookUrl: item.test_webhook_url,
                allowAudio: true, // Sempre verdadeiro na listagem para a UI
                allowAttachments: true, // Sempre verdadeiro na listagem para a UI
                ragEnabled: item.rag_enabled ?? true, // Default true se não existir
                ragUploadUrl: item.rag_upload_url,
                rag_storage_limit_mb: item.rag_storage_limit_mb,
                lastActive: item.last_active,
                createdAt: item.created_at,
                updatedAt: item.updated_at,
                companyId: item.company_id,
                client: company ? company.name : (item.company_id ? 'Desconhecido' : ''),
                email: company?.contactEmail,
                phone: company?.contactPhone,
                configSections: sections,
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random&color=fff`,
                accessControl: undefined 
            };
        });
    },

    async fetchVisibility(agentId: string): Promise<AccessRule[]> {
        const response = await fetch(`${API_BASE}/admin/agents/${agentId}/visibility`, {
            method: 'GET',
            headers: getAuthHeaders(),
            credentials: 'include'
        });

        if (!response.ok) {
            return [];
        }

        const json = await response.json();
        const users = Array.isArray(json.users) ? json.users : [];

        return users.map((u: any) => ({
            email: u.email,
            role: u.role || 'client',
            addedAt: u.created_at
        }));
    },

    async updateVisibility(agentId: string, emails: string[]): Promise<void> {
        const payload = { emails };
        const response = await fetch(`${API_BASE}/admin/agents/${agentId}/visibility`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(await parseError(response, 'Falha ao atualizar permissões de acesso'));
        }
    },

    async create(agent: Agent): Promise<Agent> {
        const serializedSections = agent.configSections.map(s => JSON.stringify(s));

        const payload: Partial<ApiAgent> = {
            name: agent.name,
            description: agent.description,
            active: agent.active,
            maintenance: agent.maintenance,
            is_blocked: agent.isBlocked || false,
            was_active_before_block: agent.wasActiveBeforeBlock || false,
            workflow_id: agent.workflowId,
            // Fix: Changed agent.has_test_mode to agent.hasTestMode to match Agent interface
            has_test_mode: agent.hasTestMode,
            // Fix: Changed agent.test_webhook_url to agent.testWebhookUrl to match Agent interface
            test_webhook_url: agent.testWebhookUrl,
            allow_audio: true, // Força true
            allow_attachments: true, // Força true
            rag_enabled: agent.ragEnabled ?? true,
            rag_upload_url: agent.ragUploadUrl,
            rag_storage_limit_mb: agent.rag_storage_limit_mb,
            config_sections: serializedSections,
            company_id: sanitizeUuid(agent.companyId),
            last_active: new Date().toISOString()
        };

        const response = await fetch(`${API_BASE}/agents`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(await parseError(response, 'Falha ao criar agente'));
        }

        const json = await response.json();
        const createdData = json.agent || json.data || json;
        const newId = createdData.id || createdData.uuid || agent.id;

        if (agent.accessControl && agent.accessControl.length > 0) {
            const emails = agent.accessControl.map(r => r.email);
            try {
                await this.updateVisibility(newId, emails);
            } catch (e) {
                console.error('Erro ao salvar permissões iniciais', e);
            }
        }

        return {
            ...agent,
            id: newId,
            allowAudio: true,
            allowAttachments: true
        };
    },

    async update(agent: Agent): Promise<void> {
        const serializedSections = agent.configSections.map(s => JSON.stringify(s));

        const payload: Partial<ApiAgent> = {
            name: agent.name,
            description: agent.description,
            active: agent.active,
            maintenance: agent.maintenance,
            is_blocked: agent.isBlocked,
            was_active_before_block: agent.wasActiveBeforeBlock,
            workflow_id: agent.workflowId,
            // Fix: Changed agent.has_test_mode to agent.hasTestMode to match Agent interface
            has_test_mode: agent.hasTestMode,
            // Fix: Changed agent.test_webhook_url to agent.testWebhookUrl to match Agent interface
            test_webhook_url: agent.testWebhookUrl,
            allow_audio: true, // Força true
            allow_attachments: true, // Força true
            rag_enabled: agent.ragEnabled ?? true,
            rag_upload_url: agent.ragUploadUrl,
            rag_storage_limit_mb: agent.rag_storage_limit_mb,
            config_sections: serializedSections,
            company_id: sanitizeUuid(agent.companyId),
            last_active: new Date().toISOString()
        };

        const response = await fetch(`${API_BASE}/agents/${agent.id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(await parseError(response, 'Falha ao atualizar agente'));
        }

        if (agent.accessControl !== undefined) {
            const emails = agent.accessControl.map(r => r.email);
            await this.updateVisibility(agent.id, emails);
        }
    },

    async delete(id: string): Promise<void> {
        const response = await fetch(`${API_BASE}/admin/agents/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(await parseError(response, 'Falha ao excluir agente'));
        }
    }
};
