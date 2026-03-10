
export interface ExecutionLog {
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
    [key: string]: any; 
}

export interface DashboardFiltersState {
    search: string;
    status: 'all' | 'success' | 'error' | 'canceled' | 'waiting' | 'running' | 'new' | 'active' | 'revoked' | 'blocked';
    mode: 'all' | 'webhook' | 'trigger' | 'manual' | 'test' | 'error' | 'integrated' | 'high_risk' | 'medium_risk' | 'low_risk';
    dateRange: '7d' | '14d' | '30d';
}

export interface SortConfig {
    key: string;
    direction: 'asc' | 'desc';
}

export interface ChartDataPoint {
    day: string;
    value: number;
    height: string;
    dateObj: Date; // Para ordenação
}
