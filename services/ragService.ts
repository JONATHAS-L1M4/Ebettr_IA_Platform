import { RagDocument, BulkDeleteResponse, RagUsage } from '../types';

const API_BASE_URL = process.env.API_BASE || (import.meta.env.DEV ? '/api/rag' : 'https://bkd.ebettr.com');

export const ragService = {
  getUsage: async (agentId: string): Promise<RagUsage> => {
    if (!agentId) {
      throw new Error('Agent ID is required for RAG usage fetch');
    }

    const token = localStorage.getItem('ebettr_access_token');
    const headers: Record<string, string> = {
      'accept': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/knowledge/usage?agent_id=${agentId}`, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Failed to fetch RAG usage: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const json = await response.json();
      return json.data;
    } catch (error) {
      console.error('Error fetching RAG usage:', error);
      throw error;
    }
  },

  list: async (agentId: string): Promise<RagDocument[]> => {
    if (!agentId) {
      console.warn('Agent ID is missing for RAG document fetch');
      return [];
    }

    const token = localStorage.getItem('ebettr_access_token');
    const headers: Record<string, string> = {
      'accept': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/knowledge?agent_id=${agentId}`, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Failed to fetch RAG documents: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching RAG documents:', error);
      throw error;
    }
  },

  get: async (agentId: string, docId: number): Promise<RagDocument> => {
    if (!agentId || !docId) {
      throw new Error('Agent ID and Document ID are required');
    }

    const token = localStorage.getItem('ebettr_access_token');
    const headers: Record<string, string> = {
      'accept': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/knowledge/${docId}?agent_id=${agentId}`, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Failed to fetch document details: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching document details:', error);
      throw error;
    }
  },

  delete: async (agentId: string, docId: number): Promise<void> => {
    if (!agentId || !docId) {
      throw new Error('Agent ID and Document ID are required');
    }

    const token = localStorage.getItem('ebettr_access_token');
    const headers: Record<string, string> = {
      'accept': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/knowledge/${docId}?agent_id=${agentId}`, {
        method: 'DELETE',
        headers: headers,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Failed to delete document: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },

  deleteBulk: async (agentId: string, docIds: number[]): Promise<BulkDeleteResponse> => {
    if (!agentId || !docIds || docIds.length === 0) {
      throw new Error('Agent ID and Document IDs are required');
    }

    const token = localStorage.getItem('ebettr_access_token');
    const headers: Record<string, string> = {
      'accept': 'application/json',
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/knowledge?agent_id=${agentId}`, {
        method: 'DELETE',
        headers: headers,
        body: JSON.stringify({ doc_ids: docIds }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Failed to delete documents in bulk: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting documents in bulk:', error);
      throw error;
    }
  },

  upload: async (agentId: string, file: File): Promise<void> => {
    if (!agentId || !file) {
      throw new Error('Agent ID and File are required');
    }

    const token = localStorage.getItem('ebettr_access_token');
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('agent_id', agentId);
    formData.append('file_name', file.name);

    try {
      const response = await fetch(`${API_BASE_URL}/knowledge?agent_id=${agentId}`, {
        method: 'POST',
        headers: headers,
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Failed to upload document: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }
};
