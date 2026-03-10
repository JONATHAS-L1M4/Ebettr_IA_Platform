import axios from 'axios';

export const API_BASE_URL = process.env.API_BASE || '';

export interface SupportAttachment {
  id?: number;
  dataBase64?: string; // For sending
  url?: string; // For receiving
  filename: string;
  mimeType?: string; // For sending
  type?: string; // For receiving
}

export interface SupportMessage {
  id: number;
  content: string;
  isUser: boolean;
  timestamp?: string;
  author?: string;
  attachments?: SupportAttachment[];
}

export interface SendMessagePayload {
  attachments: SupportAttachment[];
  content: string;
}

export interface SendMessageResponse {
  message: SupportMessage;
}

// API Response Types
interface ApiGetMessage {
  id: number;
  author: string;
  content: string;
  timestamp: string;
  isUser: boolean;
  attachments: { id: number; url: string; name: string; type: string }[];
}

interface ApiPostMessage {
  id: number;
  content: string;
  message_type: number;
}

const getAuthToken = () => localStorage.getItem('ebettr_access_token');

export const getAttachmentUrl = (url?: string, dataBase64?: string, mimeType?: string) => {
  if (url) {
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  if (dataBase64 && mimeType) {
    return `data:${mimeType};base64,${dataBase64}`;
  }
  return '#';
};

export const supportChatService = {
  getMessages: async (options?: { limit?: number; after?: string; before?: string }): Promise<SupportMessage[]> => {
    const token = getAuthToken();
    
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.after) params.append('after', options.after);
    if (options?.before) params.append('before', options.before);

    const queryString = params.toString() ? `?${params.toString()}` : '';

    const response = await axios.get(`${API_BASE_URL}/chat/messages${queryString}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    const apiMessages: ApiGetMessage[] = response.data.messages || [];
    
    return apiMessages.map(msg => ({
      id: msg.id,
      content: msg.content,
      isUser: msg.isUser,
      timestamp: msg.timestamp,
      author: msg.author,
      attachments: msg.attachments?.map(a => ({
        id: a.id,
        filename: a.name,
        type: a.type,
        url: a.url
      })) || []
    }));
  },

  sendMessage: async (payload: SendMessagePayload, authorName?: string): Promise<SendMessageResponse> => {
    const token = getAuthToken();
    const response = await axios.post(`${API_BASE_URL}/chat/messages`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const apiMsg: ApiPostMessage = response.data.message;
    
    return {
      message: {
        id: apiMsg.id,
        content: apiMsg.content,
        isUser: apiMsg.message_type === 0,
        timestamp: new Date().toISOString(),
        author: authorName,
        attachments: payload.attachments // Optimistically return sent attachments
      }
    };
  },
};
