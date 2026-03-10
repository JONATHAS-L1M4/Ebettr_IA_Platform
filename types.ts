
export type UserRole = 'client' | 'support' | 'admin' | 'editor';

export interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  companyId?: string;
  twoFactorEnabled?: boolean;
}

export interface AccessRule {
  email: string;
  role: UserRole;
  addedAt?: string;
}

export interface UserSession {
  id: string;
  email: string;
  ip: string;
  device: string;
  browser: string;
  location: string;
  location_json?: {
    latitude: number;
    longitude: number;
    [key: string]: any;
  };
  loginTime: string;
  lastActive: string;
  status: 'active' | 'revoked' | 'blocked';
  riskScore: number; // 0-100 (0 = seguro, 100 = crítico)
  isOnline?: boolean;
  lastSeenSecondsAgo?: number;
}

// --- DOMAIN MODELS (Frontend/Application) ---

export interface Agent {
  id: string;
  name: string;
  description: string;
  active: boolean;
  maintenance?: boolean; // Novo campo para manutenção
  isBlocked?: boolean; // Novo campo para controle administrativo
  wasActiveBeforeBlock?: boolean; // Memoriza o estado anterior para restauração
  avatarUrl: string;
  lastActive?: string;
  createdAt?: string;
  updatedAt?: string;
  configSections: ConfigSection[]; // Objetos estruturados para uso na UI
  accessEmails?: string; 
  accessControl?: AccessRule[]; 
  hasTestMode?: boolean; 
  testWebhookUrl?: string; 
  allowAudio?: boolean; // Permissão de gravação de áudio
  allowAttachments?: boolean; // Permissão de envio de anexos
  ragEnabled?: boolean; // Habilitar/Desabilitar RAG
  ragUploadUrl?: string; // URL para upload de documentos RAG
  rag_storage_limit_mb?: number; // Limite de armazenamento RAG em MB
  client?: string;
  email?: string;
  phone?: string;
  companyId?: string; // ID da empresa no banco de dados
  workflowId?: string; // ID do workflow n8n no banco de dados
}

// --- API CONTRACT MODELS (Backend/Persistence) ---

export interface ApiAgent {
  id?: string;
  uuid?: string; // Backend pode retornar uuid ou id
  name: string;
  description: string;
  active: boolean;
  maintenance?: boolean;
  is_blocked?: boolean;
  was_active_before_block?: boolean;
  workflow_id?: string;
  has_test_mode?: boolean;
  test_webhook_url?: string;
  allow_audio?: boolean;
  allow_attachments?: boolean;
  rag_enabled?: boolean;
  rag_upload_url?: string;
  rag_storage_limit_mb?: number;
  last_active?: string;
  created_at?: string;
  updated_at?: string;
  company_id?: string;
  
  // O conceito chave: Backend armazena seções como array de strings JSON serializadas
  config_sections: string[]; 
}

export interface Company {
  id: string;
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  createdAt: string;
  agentCount?: number;
  userCount?: number;
}

export interface ClientUser {
  email: string;
  company: string;
  addedAt: string;
  status?: 'active' | 'blocked';
}

export interface AdminUser {
  email: string;
  role: 'admin' | 'support';
  addedAt: string;
  status?: 'active' | 'blocked';
}

// --- CONFIGURATION TYPES ---

export type ConfigSectionIcon = 'brain' | 'settings' | 'message' | 'shield' | 'database' | 'cpu' | 'code' | 'cloud' | 'zap' | 'globe' | 'activity' | 'terminal' | 'key' | 'lock' | 'layers' | 'box' | 'user' | 'mail';

export interface ConfigSection {
  id: string;
  title: string;
  description: string;
  icon: ConfigSectionIcon; 
  fields: ConfigField[];
  visibleToClient?: boolean;
  layoutWidth?: '33%' | '66%' | '100%'; // Atualizado para 33, 66, 100
}

export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'email'
  | 'password' 
  | 'url' 
  | 'number_int' 
  | 'number_dec'
  | 'switch' 
  | 'select' 
  | 'multiselect'
  | 'checkbox'
  | 'multicheckbox'
  | 'radio'
  | 'upload'
  | 'uuid' 
  | 'notice' 
  | 'annotation' // Novo tipo para anotações em Markdown
  | 'hidden'; 

export interface FieldCondition {
  field: string; 
  value: any;    
  operator?: 'eq' | 'neq'; 
}

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface ConfigField {
  // Identity
  id: string;
  label: string;
  type: FieldType;
  
  // Layout
  layoutWidth?: '33%' | '66%' | '100%';

  // Value State
  value: string | number | boolean | string[]; 
  defaultValue?: string | number | boolean | string[]; 
  
  // Validation
  required?: boolean; 
  min?: number; 
  max?: number; 
  minLength?: number; 
  maxLength?: number; 
  allowedFileTypes?: string[]; 
  maxFileSize?: number; 

  // Security & Privacy
  secret?: boolean; 
  
  // UI / Display
  placeholder?: string;
  helpText?: string;
  hint?: string; 
  rows?: number; // Altura do textarea (linhas)
  condition?: FieldCondition; 
  options?: string[] | SelectOption[]; 
  
  // N8n Integration & Logic
  jsonPath?: string; // Caminho no JSON do workflow (ex: JC5ub2Rlc...)
  baseUrl?: string; // URL base para concatenação (ex: webhooks)
  uploadUrl?: string;
  allowRefresh?: boolean; 
  n8nDisplayOptions?: { show?: Record<string, any>; hide?: Record<string, any> }; 
  n8nTypeOptions?: Record<string, any>; 
  notes?: string; // Internal notes for the field
}

export type ViewState = 'agents' | 'agent-detail' | 'profile' | 'admin-servers' | 'admin-users' | 'client-users' | 'companies' | 'admin-sessions';

export interface NavigationState {
  view: ViewState;
  agentId?: string;
  tab?: string; // Adicionado para persistência de aba
}

export interface ChatMessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string; // Base64 encoded data
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: ChatMessagePart[];
}

export interface ServerCredential {
  id: string;
  name: string;
  url: string;        // URL_N8N
  apiKey: string;     // X_N8N_API_KEY
  cookie: string;     // cookie
  browserId: string;  // browser_id
  isActive?: boolean;
}

export interface SupabaseServer {
  id: string;
  name: string;
  url: string;
  api_key: string;
  default_table_name?: string; // Optional now as it's not sent in POST/PUT
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RagDocument {
  id: number;
  agent_id: string;
  blobType: string;
  file_name: string;
  content?: string;
  doc_id?: number;
  workflow_id?: string | null;
}

export interface BulkDeleteResponse {
  requested_count: number;
  deleted_count: number;
  not_found_count: number;
  deleted: number[];
  not_found_doc_ids: number[];
}

export interface RagUsage {
  agent_id: string;
  workflow_id: string | null;
  doc_count: number;
  content_bytes: number;
  metadata_bytes: number;
  total_bytes: number;
  batch_size: number;
  measurement: string;
  storage_limit_bytes: number;
  storage_limit_mb: number;
  remaining_bytes: number;
  usage_percent: number;
  is_over_limit: boolean;
}

export interface SupportAttachment {
  id: number;
  url: string;
  name: string;
  type: string;
}

export interface SupportMessage {
  id: number;
  author: string;
  content: string;
  timestamp: string;
  isUser: boolean;
  attachments: SupportAttachment[];
}

export interface SupportChatResponse {
  messages: SupportMessage[];
}

export type AlertLevel = 'info' | 'warning' | 'error' | 'critical';

export interface Alert {
  id: string;
  title: string;
  message: string;
  level: AlertLevel;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  ttl_seconds: number;
  expires_at: string;
}

export interface AlertCreatePayload {
  level: AlertLevel;
  message: string;
  title: string;
  ttl_seconds: number;
}

export interface AlertUpdatePayload {
  level?: AlertLevel;
  message?: string;
  title?: string;
  ttl_seconds?: number;
}
