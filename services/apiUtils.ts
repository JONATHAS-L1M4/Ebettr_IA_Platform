
/**
 * Central utility for handling API errors globally
 */

export const SESSION_EXPIRED_EVENT = 'ebettr:session-expired';

export const handleUnauthorized = () => {
    // Dispatch a custom event that App.tsx will listen to
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
};

export interface ApiErrorResponse {
    code?: string;
    message: string;
    [key: string]: any;
}

export const parseApiError = async (response: Response): Promise<ApiErrorResponse | null> => {
    try {
        const clone = response.clone(); // Clone to avoid consuming body if needed elsewhere
        const err = await clone.json();
        
        // New Format: {"detail": {"code": "...", "message": "..."}}
        if (err.detail && typeof err.detail === 'object' && !Array.isArray(err.detail) && err.detail.code) {
            return err.detail as ApiErrorResponse;
        }
        
        return null;
    } catch {
        return null;
    }
};

export const parseError = async (response: Response, defaultMsg: string): Promise<string> => {
    if (response.status === 401) {
        handleUnauthorized();
        return 'Sessão expirada';
    }
    
    try {
        const err = await response.json();
        
        // 1. Standard Error Code Format: {"detail": {"code": "...", "message": "..."}}
        if (err.detail && typeof err.detail === 'object' && !Array.isArray(err.detail)) {
             if (err.detail.message) return err.detail.message;
        }

        // 2. Simple String Detail: {"detail": "Error message"}
        if (typeof err.detail === 'string') return err.detail;

        // 3. Pydantic Validation Errors: {"detail": [{"loc":..., "msg":...}]}
        if (Array.isArray(err.detail)) {
            return err.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
        }

        // 4. Generic Message: {"message": "..."}
        if (err.message) return typeof err.message === 'string' ? err.message : JSON.stringify(err.message);
        
    } catch {}
    
    return defaultMsg;
};
