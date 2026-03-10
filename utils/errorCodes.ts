
/**
 * Standard Error Codes Definition
 * Format: <DOMAIN>-<RESOURCE>-<NN>
 */

export enum ErrorDomain {
  AUTH = 'AU',
  CORE = 'CO',
  ADMIN = 'AD'
}

export enum ErrorResource {
  // Auth
  LOGIN = 'LG',
  TWO_FACTOR = '2F',
  REGISTER = 'RG',
  RESET = 'RS',

  // Core
  PROFILE = 'PR',
  AGENT = 'AG',
  COMPANY = 'CP',
  WORKFLOW = 'WF',
  SERVER = 'SV',
  EXECUTION = 'EX',
  CREDENTIAL = 'CR',

  // Admin
  USER = 'US'
}

export const ErrorCodes = {
  // --- AUTH (AU) ---
  AUTH: {
    LOGIN: {
      INVALID_CREDENTIALS: 'AU-LG-01',
      USER_BLOCKED: 'AU-LG-02'
    },
    TWO_FACTOR: {
      PREAUTH_MISSING: 'AU-2F-01',
      PREAUTH_INVALID: 'AU-2F-02',
      PREAUTH_INVALID_ALT: 'AU-2F-03',
      USER_NOT_FOUND: 'AU-2F-04',
      USER_BLOCKED: 'AU-2F-05',
      USERNAME_MISMATCH: 'AU-2F-06',
      ALREADY_ENABLED: 'AU-2F-07',
      INVALID_FORMAT: 'AU-2F-08',
      INVALID_CODE_SETUP: 'AU-2F-09',
      NOT_CONFIGURED: 'AU-2F-10',
      INVALID_CODE_LOGIN: 'AU-2F-11',
      SECRET_RECOVERY_FAILED: 'AU-2F-12'
    },
    REGISTER: {
      DISABLED: 'AU-RG-01',
      DOMAIN_NOT_ALLOWED: 'AU-RG-02',
      USER_EXISTS: 'AU-RG-03'
    },
    RESET: {
      EMAIL_NOT_FOUND: 'AU-RS-01',
      USER_BLOCKED: 'AU-RS-02',
      LIMIT_EXCEEDED: 'AU-RS-03',
      SEND_FAILED: 'AU-RS-04',
      INVALID_CODE: 'AU-RS-05',
      PASSWORDS_MISMATCH: 'AU-RS-06',
      INVALID_TOKEN: 'AU-RS-07',
      SAME_PASSWORD: 'AU-RS-08'
    }
  },

  // --- CORE (CO) ---
  CORE: {
    PROFILE: {
      USER_NOT_FOUND: 'CO-PR-01',
      CURRENT_PASSWORD_REQUIRED: 'CO-PR-02',
      CURRENT_PASSWORD_INVALID: 'CO-PR-03',
      NEW_PASSWORD_MISSING: 'CO-PR-04',
      PASSWORDS_MISMATCH: 'CO-PR-05',
      SAME_PASSWORD: 'CO-PR-06',
      NOTHING_TO_UPDATE: 'CO-PR-07'
    },
    AGENT: {
      MISSING_COMPANY: 'CO-AG-01',
      WRONG_COMPANY: 'CO-AG-02',
      BLOCKED_CREATION: 'CO-AG-03',
      COMPANY_REQUIRED: 'CO-AG-04',
      DUPLICATE_NAME: 'CO-AG-05',
      NOT_FOUND: 'CO-AG-06',
      UNAVAILABLE: 'CO-AG-07',
      BLOCKED_UPDATE: 'CO-AG-08',
      FORBIDDEN_FIELDS: 'CO-AG-09',
      ADMIN_ONLY_COMPANY: 'CO-AG-10',
      NOTHING_TO_UPDATE: 'CO-AG-11',
      VALIDATION_ERROR: 'CO-AG-12'
    },
    COMPANY: {
      NOT_FOUND: 'CO-CP-01'
    },
    WORKFLOW: {
      IN_USE: 'CO-WF-01',
      NO_SERVER: 'CO-WF-02',
      SERVER_VALIDATION_FAILED: 'CO-WF-03',
      NOT_FOUND: 'CO-WF-05',
      BLOCKED: 'CO-WF-06',
      UNAVAILABLE: 'CO-WF-07',
      ID_REQUIRED: 'CO-WF-08',
      INVALID_N8N_RESPONSE: 'CO-WF-09',
      INVALID_PAYLOAD: 'CO-WF-10',
      INSUFFICIENT_PERMISSION: 'CO-WF-11'
    },
    SERVER: {
      URL_MISSING: 'CO-SV-01',
      API_KEY_MISSING: 'CO-SV-02',
      NOT_FOUND: 'CO-SV-03'
    },
    EXECUTION: {
      INVALID_N8N_RESPONSE: 'CO-EX-01',
      UNEXPECTED_N8N_RESPONSE: 'CO-EX-02',
      WORKFLOW_VALIDATION_FAILED: 'CO-EX-03'
    },
    CREDENTIAL: {
      NOT_LINKED: 'CO-CR-01',
      ID_REQUIRED: 'CO-CR-02'
    }
  },

  // --- ADMIN (AD) ---
  ADMIN: {
    AGENT: {
      NOT_FOUND: 'AD-AG-01'
    },
    USER: {
      NOT_FOUND: 'AD-US-01',
      NOT_CLIENT: 'AD-US-02',
      WRONG_COMPANY: 'AD-US-03',
      INVALID_DOMAIN_ADMIN: 'AD-US-04',
      INVALID_DOMAIN_CLIENT: 'AD-US-05',
      EXISTS: 'AD-US-06'
    },
    COMPANY: {
      NAME_EXISTS: 'AD-CP-01',
      EMAIL_EXISTS: 'AD-CP-02',
      NO_COMPANY_ID_LIST: 'AD-CP-03',
      NO_COMPANY_ID_ACCESS: 'AD-CP-04',
      NOT_FOUND: 'AD-CP-05',
      NOTHING_TO_UPDATE: 'AD-CP-06'
    },
    SERVER: {
      DUPLICATE_URL: 'AD-SV-01',
      NOT_FOUND: 'AD-SV-02'
    }
  }
};

export const getErrorMessage = (code: string): string | null => {
  // This function could map codes to localized strings if needed
  // For now, we rely on the backend message, but this structure allows future expansion
  return null;
};
