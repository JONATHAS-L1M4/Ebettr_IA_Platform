
import { UserProfile } from '../types';
import { parseError } from './apiUtils';

const API_BASE = process.env.API_BASE;

export interface AuthResponse {
  csrf_token?: string;
  access_token?: string;
  preauth_token?: string; // Token temporário para validar 2FA
  two_factor_enabled?: boolean;
  message?: string;
  [key: string]: any;
}

export interface Setup2FAResponse {
  username: string;
  qr_base64: string;
  secret: string;
  otpauth_url: string;
  csrf_token: string;
}

// Helper para headers de autenticação
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

export const authService = {
  /**
   * Obtém o token CSRF inicial para o login
   */
  async getLoginCsrf(): Promise<string> {
    try {
        const response = await fetch(`${API_BASE}/login`, {
          method: 'GET',
          headers: { 'accept': 'application/json' },
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Erro de conexão inicial.');
        const data = await response.json();
        if (!data.csrf_token) throw new Error('Token de segurança não recebido.');
        return data.csrf_token;
    } catch (e) {
        throw new Error("Não foi possível conectar ao servidor de autenticação.");
    }
  },

  /**
   * Realiza a tentativa de login. Retorna dados para decisão de 2FA.
   */
  async login(email: string, password: string, csrfToken: string): Promise<AuthResponse> {
    const params = new URLSearchParams();
    params.append('csrf_token', csrfToken);
    params.append('email', email);
    params.append('password', password);

    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRF-Token': csrfToken
      },
      body: params,
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Credenciais inválidas'));
    }

    const data: AuthResponse = await response.json();
    
    // Armazena o token imediatamente se disponível (login direto sem 2FA)
    if (data.access_token) {
        localStorage.setItem('ebettr_access_token', data.access_token);
    }

    // IMPORTANTE: Se o servidor não retornar um novo csrf_token na resposta do login (comum em 2FA flow),
    // reutilizamos o token enviado, pois ele ainda é necessário para a próxima requisição (/authenticator).
    if (!data.csrf_token) {
        data.csrf_token = csrfToken;
    }
    
    return data;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('ebettr_access_token');
    try {
      await fetch(`${API_BASE}/logout`, {
        method: 'GET',
        headers: { 'accept': 'application/json' },
        credentials: 'include'
      });
    } catch (e) {
      console.warn('Erro ao encerrar sessão no servidor', e);
    }
  },

  /**
   * Verifica requisito de 2FA (Legado/Alternativo)
   */
  async check2FARequirement(email: string): Promise<{ required: boolean; csrfToken?: string }> {
    const response = await fetch(`${API_BASE}/authenticator?username=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      return { required: true, csrfToken: data.csrf_token };
    }
    return { required: false };
  },

  /**
   * Valida o código 2FA durante o LOGIN
   */
  async verify2FA(email: string, csrfToken: string, code: string, preauthToken?: string): Promise<boolean> {
    const params = new URLSearchParams();
    params.append('csrf_token', csrfToken);
    params.append('username', email);
    params.append('code', code);
    
    if (preauthToken) {
        params.append('preauth_token', preauthToken);
    }

    // Usa getAuthHeaders para garantir que headers padrão sejam enviados
    const response = await fetch(`${API_BASE}/authenticator`, {
      method: 'POST',
      headers: getAuthHeaders({
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRF-Token': csrfToken
      }),
      body: params,
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Código inválido ou expirado.'));
    }

    const data = await response.json().catch(() => ({}));
    if (data.access_token) {
        localStorage.setItem('ebettr_access_token', data.access_token);
    }

    return true;
  },

  async setup2FA(email: string): Promise<Setup2FAResponse> {
    const response = await fetch(`${API_BASE}/authenticator/setup?username=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
       throw new Error(await parseError(response, 'Falha ao iniciar configuração 2FA'));
    }

    return await response.json();
  },

  async confirm2FASetup(email: string, code: string, csrfToken: string): Promise<boolean> {
    const params = new URLSearchParams();
    params.append('csrf_token', csrfToken);
    params.append('username', email);
    params.append('code', code);
    
    const response = await fetch(`${API_BASE}/authenticator/confirm`, {
      method: 'POST',
      headers: getAuthHeaders({
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRF-Token': csrfToken
      }),
      body: params,
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Código incorreto ou expirado.'));
    }

    return true;
  },

  async updatePassword(current: string, newPass: string, confirmPass: string): Promise<void> {
    const response = await fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
            current_password: current,
            new_password: newPass,
            confirm_password: confirmPass
        }),
        credentials: 'include'
    });

    if (!response.ok) {
         throw new Error(await parseError(response, 'Falha ao atualizar senha'));
    }
  },

  async reset2FA(password: string): Promise<void> {
    const response = await fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
            current_password: password,
            reset_2fa: true
        }),
        credentials: 'include'
    });

    if (!response.ok) {
         throw new Error(await parseError(response, 'Falha ao desativar 2FA'));
    }
  },

  async getProfile(): Promise<UserProfile> {
    const response = await fetch(`${API_BASE}/profile`, {
        method: 'GET',
        headers: getAuthHeaders({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }),
        credentials: 'include'
    });

    if (!response.ok) {
         throw new Error(await parseError(response, 'Falha ao carregar perfil'));
    }

    const json = await response.json();
    const p = json.profile;

    return {
        name: p.name,
        email: p.email,
        role: p.role,
        companyId: p.company_id,
        twoFactorEnabled: p.two_factor_enabled,
        avatarUrl: undefined
    };
  },

  // --- PASSWORD RESET FLOW ---

  async requestPasswordReset(email: string): Promise<void> {
      const csrfToken = await this.getLoginCsrf();
      const params = new URLSearchParams();
      params.append('csrf_token', csrfToken);
      params.append('email', email);

      const response = await fetch(`${API_BASE}/reset`, {
          method: 'POST',
          headers: {
              'accept': 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded',
              'X-CSRF-Token': csrfToken
          },
          body: params,
          credentials: 'include'
      });

      if (!response.ok) {
          throw new Error(await parseError(response, 'Falha ao solicitar recuperação.'));
      }
  },

  async verifyResetCode(email: string, code: string): Promise<string> {
      const csrfToken = await this.getLoginCsrf();
      const params = new URLSearchParams();
      params.append('csrf_token', csrfToken);
      params.append('email', email);
      params.append('code', code);

      const response = await fetch(`${API_BASE}/reset/code`, {
          method: 'POST',
          headers: {
              'accept': 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded',
              'X-CSRF-Token': csrfToken
          },
          body: params,
          credentials: 'include'
      });

      if (!response.ok) {
          throw new Error(await parseError(response, 'Código inválido.'));
      }

      const data = await response.json();
      return data.reset_token; 
  },

  async completePasswordReset(email: string, resetToken: string, newPassword: string): Promise<void> {
      const csrfToken = await this.getLoginCsrf();
      const params = new URLSearchParams();
      params.append('csrf_token', csrfToken);
      params.append('email', email);
      params.append('reset_token', resetToken);
      params.append('new_password', newPassword);
      params.append('confirm_password', newPassword);

      const response = await fetch(`${API_BASE}/reset/confirm`, {
          method: 'POST',
          headers: {
              'accept': 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded',
              'X-CSRF-Token': csrfToken
          },
          body: params,
          credentials: 'include'
      });

      if (!response.ok) {
          throw new Error(await parseError(response, 'Erro ao confirmar nova senha.'));
      }
  }
};
