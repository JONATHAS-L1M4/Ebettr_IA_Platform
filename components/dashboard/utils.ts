
import { ExecutionLog } from './types';

export const getDuration = (start: string, end: string | null) => {
    if (!end) return '-';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return `${diff}ms`;
};

export const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('pt-BR', { 
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });
};

export const exportLogsToCSV = (logs: ExecutionLog[], filename = 'execucoes.csv') => {
    if (!logs || logs.length === 0) return;

    // Cabeçalhos do CSV
    const headers = ['ID', 'Status', 'Modo', 'Data Inicio', 'Data Fim', 'Duracao', 'Workflow ID', 'Erro'];
    
    // Converte os dados para linhas do CSV
    const rows = logs.map(log => {
        const duration = log.stoppedAt ? getDuration(log.startedAt, log.stoppedAt) : '';
        const errorMessage = log.data?.error ? `"${log.data.error.replace(/"/g, '""')}"` : '';
        
        return [
            log.id,
            log.status,
            log.mode,
            formatDate(log.startedAt),
            log.stoppedAt ? formatDate(log.stoppedAt) : '-',
            duration,
            log.workflowId,
            errorMessage
        ].join(';'); // Usando ponto-e-vírgula que é comum para Excel em pt-BR/Europe
    });

    // Junta cabeçalho e linhas
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n'); // \uFEFF é o BOM para UTF-8 funcionar no Excel

    // Cria o blob e dispara o download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
