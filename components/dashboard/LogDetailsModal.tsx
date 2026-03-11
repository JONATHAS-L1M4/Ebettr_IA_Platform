import React, { useState, useEffect } from 'react';
import { ExecutionLog } from './types';
import { Terminal, X, FileJson, Copy, Loader2, RefreshCw } from '../ui/Icons';
import { formatDate, getDuration } from './utils';
import { useNotification } from '../../context/NotificationContext';
import { fetchN8nExecutionDetails } from '../../services/n8nService';

interface LogDetailsModalProps {
  selectedLog: ExecutionLog;
  onClose: () => void;
}

export const LogDetailsModal: React.FC<LogDetailsModalProps> = ({ selectedLog, onClose }) => {
  const { addNotification } = useNotification();
  const [fullDetails, setFullDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadDetails = async () => {
      setLoading(true);
      try {
        const details = await fetchN8nExecutionDetails(selectedLog.workflowId, selectedLog.id);
        if (mounted) {
          setFullDetails(details);
        }
      } catch (error) {
        if (mounted) {
          addNotification('warning', 'Aviso', 'Nao foi possivel carregar os detalhes completos. Exibindo resumo.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDetails();
    return () => {
      mounted = false;
    };
  }, [selectedLog.id, selectedLog.workflowId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addNotification('success', 'Copiado!', 'JSON copiado para a area de transferencia.');
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'success':
        return 'Sucesso';
      case 'error':
        return 'Erro';
      case 'canceled':
        return 'Cancelado';
      case 'waiting':
        return 'Aguardando';
      default:
        return status;
    }
  };

  const displayData = fullDetails || selectedLog;

  return (
    <div className="fixed inset-0 bg-background/80  z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-scale-in ring-1 ring-border/60">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-foreground">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-3">Execucao #{selectedLog.id}</h2>
              <p className="text-xs text-muted-foreground font-mono mt-1">Workflow: {selectedLog.workflowId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-full text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-card">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-muted/40 p-4 rounded-lg border border-border">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Status</span>
              <p className="text-sm font-bold text-foreground mt-1 capitalize">{getStatusLabel(selectedLog.status)}</p>
            </div>

            <div className="bg-muted/40 p-4 rounded-lg border border-border">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Modo</span>
              <p className="text-sm font-bold text-foreground mt-1 capitalize">{selectedLog.mode}</p>
            </div>

            <div className="bg-muted/40 p-4 rounded-lg border border-border">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Inicio</span>
              <p className="text-sm font-bold text-foreground mt-1 truncate" title={formatDate(selectedLog.startedAt)}>
                {formatDate(selectedLog.startedAt)}
              </p>
            </div>

            <div className="bg-muted/40 p-4 rounded-lg border border-border">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Duracao</span>
              <p className="text-sm font-bold text-foreground mt-1">{getDuration(selectedLog.startedAt, selectedLog.stoppedAt)}</p>
            </div>

            <div className="bg-muted/40 p-4 rounded-lg border border-border">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Retry</span>
              <p className="text-sm font-bold text-foreground mt-1">{selectedLog.retryOf ? `#${selectedLog.retryOf}` : 'Nenhum'}</p>
            </div>
          </div>

          <div className="flex flex-col h-[calc(100%-140px)] border border-border rounded-lg overflow-hidden relative">
            <div className="px-4 py-3 border-b border-border bg-muted/40 flex justify-between items-center">
              <span className="text-xs font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
                <FileJson className="w-3.5 h-3.5" /> Detalhes (JSON)
              </span>

              <div className="flex items-center gap-2">
                {loading && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 animate-pulse mr-2">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Sincronizando...
                  </span>
                )}
                <button
                  onClick={() => copyToClipboard(JSON.stringify(displayData, null, 2))}
                  disabled={loading}
                  className="text-[10px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors uppercase tracking-wide bg-card px-3 py-1.5 rounded border border-border hover:border-ring/40 shadow-sm disabled:opacity-50"
                >
                  <Copy className="w-3 h-3" /> Copiar
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-0 bg-card relative">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/70 z-10">
                  <Loader2 className="w-8 h-8 text-foreground animate-spin mb-2" />
                  <span className="text-xs text-muted-foreground font-medium">Carregando execucao completa...</span>
                </div>
              ) : (
                <pre className="text-xs font-mono p-6 leading-relaxed text-foreground">
                  {JSON.stringify(displayData, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
