
import { UserSession } from '../types';
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

// Helper simples para extrair informações do User Agent
const parseUserAgent = (ua: string) => {
    let browser = 'Genérico';
    let os = 'Desconhecido';
    let device = 'Desktop';

    if (!ua) return { browser, os, device };

    // Browser Detection
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('OPR')) browser = 'Opera';

    // OS Detection
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) { os = 'Android'; device = 'Mobile'; }
    else if (ua.includes('iPhone') || ua.includes('iPad')) { os = 'iOS'; device = 'Mobile'; }

    return { browser, os, device };
};

export const fetchSessions = async (page: number = 1, limit: number = 50): Promise<{ sessions: UserSession[], onlineTracking?: any }> => {
    const response = await fetch(`${API_BASE}/admin/sessions?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error(await parseError(response, `Erro API: ${response.status}`));
    }

    const json = await response.json();
    const data = Array.isArray(json.data) ? json.data : [];
    const onlineTracking = json.online_tracking;

    const sessions = data.map((item: any) => {
        const uaInfo = parseUserAgent(item.user_agent);
        
        let browserDisplay = item.browser;
        if (browserDisplay && item.os) {
             browserDisplay = `${browserDisplay} (${item.os})`;
        }
        if (!browserDisplay) {
             browserDisplay = `${uaInfo.browser} (${uaInfo.os})`;
        }

        return {
            id: item.id,
            email: item.user_email || item.user_id || 'Usuário Desconhecido', 
            ip: item.ip_address || '0.0.0.0',
            device: item.device || uaInfo.device,
            browser: browserDisplay,
            location: item.location || 'Desconhecido',
            location_json: item.location_json,
            loginTime: item.login_time,
            lastActive: item.last_active,
            status: item.status, 
            riskScore: item.risk_score || 0,
            isOnline: item.is_online,
            lastSeenSecondsAgo: item.last_seen_seconds_ago
        };
    });

    return { sessions, onlineTracking };
};

export const revokeSession = async (sessionId: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/admin/sessions/${sessionId}/revoke`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({}), 
      credentials: 'include'
  });

  if (!response.ok) {
      throw new Error(await parseError(response, `Erro ao revogar sessão (${response.status})`));
  }
};

/**
 * Revogação em massa utilizando os métodos recomendados.
 * Suporta filtros por status, risco mínimo, ID de usuário e limite.
 */
export const revokeSessionsBulk = async (params: { 
    status?: string, 
    min_risk?: number, 
    user_id?: string, 
    limit?: number, 
    include_current_session?: boolean 
}): Promise<{ revoked_count: number }> => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.min_risk !== undefined) query.append('min_risk', params.min_risk.toString());
    if (params.user_id) query.append('user_id', params.user_id);
    if (params.limit) query.append('limit', (params.limit || 10000).toString());
    if (params.include_current_session !== undefined) 
        query.append('include_current_session', params.include_current_session.toString());

    const response = await fetch(`${API_BASE}/admin/sessions/revoke-bulk?${query.toString()}`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({}),
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error(await parseError(response, `Erro ao revogar em lote (${response.status})`));
    }

    return await response.json();
};

export const blockUserSessions = async (email: string): Promise<void> => {
  console.log(`[Mock] Blocking user ${email}`);
};

export const unblockUserSessions = async (email: string): Promise<void> => {
  console.log(`[Mock] Unblocking user ${email}`);
};
