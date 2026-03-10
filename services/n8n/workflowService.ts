
import { N8nWorkflow, N8nExecution } from './types';

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

// Response normalization
const parseWorkflowResponse = (json: any): N8nWorkflow[] => {
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json)) return json;

  if (json && typeof json === 'object') {
    if (json.message || json.error) {
      const msg = json.message || json.error;
      throw new Error(typeof msg === 'string' ? msg : 'Resposta inválida da API');
    }
  }

  return [];
};

export const fetchN8nWorkflows = async (forceRefresh = false): Promise<N8nWorkflow[]> => {
  const endpoint = forceRefresh ? '/admin/workflows?excludePinnedData=false' : '/admin/workflows';
  const method = forceRefresh ? 'PUT' : 'GET';
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      credentials: 'include'
  });

  const json = await handleResponse(response, 'Falha ao buscar workflows');
  return parseWorkflowResponse(json);
};

export const toggleN8nWorkflow = async (workflowId: string, active: boolean): Promise<boolean> => {
  const action = active ? 'activate' : 'deactivate';
  const url = `${API_BASE}/workflows/${workflowId}/${action}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include'
  });

  await handleResponse(response, `Falha ao ${active ? 'ativar' : 'desativar'} workflow`);
  return true;
};

export const updateN8nWorkflowConfig = async (
  workflowId: string,
  updates: Array<{ id: string; value: any }>
): Promise<boolean> => {
  const url = `${API_BASE}/workflows/${workflowId}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
    credentials: 'include'
  });

  await handleResponse(response, 'Falha ao atualizar configuração do workflow');
  return true;
};

export interface ExecutionMetric {
  workflowId: string;
  success_rate: number;
  average_duration: number | null;
}

export const fetchExecutionMetrics = async (): Promise<ExecutionMetric[]> => {
  const url = `${API_BASE}/admin/workflows/execution-metrics`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    const json = await handleResponse(response, 'Falha ao buscar métricas de execução');
    return Array.isArray(json) ? json : [];
  } catch (e) {
    console.error("Error fetching execution metrics:", e);
    return [];
  }
};
export const fetchN8nExecutions = async (workflowId: string, cursor?: string | null): Promise<{ data: N8nExecution[], nextCursor: string | null }> => {
  let url = `${API_BASE}/executions?workflowId=${encodeURIComponent(workflowId)}&includeData=false&limit=250`;
  
  if (cursor) {
      url += `&cursor=${encodeURIComponent(cursor)}`;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    const json = await handleResponse(response, 'Falha ao buscar execuções');
    
    const data = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
    const nextCursor = json?.nextCursor || null;
    
    return { data, nextCursor };
  } catch (e) {
    console.error("Error fetching executions:", e);
    return { data: [], nextCursor: null };
  }
};

export const fetchN8nExecutionDetails = async (workflowId: string, executionId: string): Promise<any> => {
  const url = `${API_BASE}/executions/${encodeURIComponent(executionId)}?includeData=true`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await handleResponse(response, 'Falha ao buscar detalhes da execução');
  } catch (e) {
    return { id: executionId, status: 'error', data: { message: 'Failed to fetch execution details' } };
  }
};

// Cache simples em memória para workflows
const workflowCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const pendingWorkflowRequests = new Map<string, Promise<any>>();

export const fetchN8nWorkflowFullJson = async (workflowId: string, forceRefresh = false): Promise<any> => {
  if (!forceRefresh) {
    const cached = workflowCache.get(workflowId);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return cached.data;
    }
    
    if (pendingWorkflowRequests.has(workflowId)) {
        return pendingWorkflowRequests.get(workflowId);
    }
  }

  const url = `${API_BASE}/workflows/${encodeURIComponent(workflowId)}`;

  const promise = (async () => {
      try {
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(),
            credentials: 'include'
        });

        const data = await handleResponse(response, 'Falha ao buscar JSON do workflow');
        
        // Normalização: Garantir que "disabled": false exista na raiz dos nodes se não estiver presente
        // O n8n omite essa propriedade quando o node está ativo (disabled: false)
        if (data && Array.isArray(data.nodes)) {
            data.nodes.forEach((node: any) => {
                if (node.disabled === undefined) {
                    node.disabled = false;
                }
            });
        }
        
        // Atualiza o cache
        workflowCache.set(workflowId, { data, timestamp: Date.now() });
        return data;
      } finally {
        pendingWorkflowRequests.delete(workflowId);
      }
  })();

  if (!forceRefresh) {
      pendingWorkflowRequests.set(workflowId, promise);
  }
  
  return promise;
};
