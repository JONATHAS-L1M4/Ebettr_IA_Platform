import { Alert, AlertCreatePayload, AlertUpdatePayload } from '../types';

const API_BASE = process.env.API_BASE;

export const alertService = {
  list: async (): Promise<Alert[]> => {
    const token = localStorage.getItem('ebettr_access_token');
    if (!token) throw new Error('No access token');

    const response = await fetch(`${API_BASE}/alert`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to list alerts');
    }

    const data = await response.json();
    return data.data || [];
  },

  create: async (payload: AlertCreatePayload): Promise<Alert> => {
    const token = localStorage.getItem('ebettr_access_token');
    if (!token) throw new Error('No access token');

    const response = await fetch(`${API_BASE}/alert`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Failed to create alert');
    }

    const data = await response.json();
    return data.alert;
  },

  get: async (id: string): Promise<Alert> => {
    const token = localStorage.getItem('ebettr_access_token');
    if (!token) throw new Error('No access token');

    const response = await fetch(`${API_BASE}/alert/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get alert');
    }

    const data = await response.json();
    return data.alert;
  },

  update: async (id: string, payload: AlertUpdatePayload): Promise<Alert> => {
    const token = localStorage.getItem('ebettr_access_token');
    if (!token) throw new Error('No access token');

    const response = await fetch(`${API_BASE}/alert/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Failed to update alert');
    }

    const data = await response.json();
    return data.alert;
  },

  delete: async (id: string): Promise<void> => {
    const token = localStorage.getItem('ebettr_access_token');
    if (!token) throw new Error('No access token');

    const response = await fetch(`${API_BASE}/alert/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete alert');
    }
  }
};
