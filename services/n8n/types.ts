
import { ConfigField } from '../../types';

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  isArchived: boolean;
}

export interface N8nExecution {
  id: string;
  finished: boolean;
  mode: string;
  retryOf: string | null;
  retrySuccessId: string | null;
  status: 'success' | 'error' | 'waiting' | 'canceled' | 'running' | 'new';
  startedAt: string;
  stoppedAt: string | null;
  workflowId: string;
  waitTill: string | null;
  data?: any;
}

export interface WorkflowCredential {
  id: string;
  name: string;
  type: string;
  nodeName?: string;
  visibleToClient?: boolean;
}

export interface CredentialSchemaResult {
  fields: ConfigField[];
  defaults: Record<string, any>;
  payload: Record<string, any>;
}
