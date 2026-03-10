
import React from 'react';
import { ExecutionLog, SortConfig } from './types';
import { CheckCircle2, XCircle, AlertOctagon, Zap, Eye, Loader2, Clock, ChevronUp, ChevronDown } from '../ui/Icons';
import { formatDate, getDuration } from './utils';

interface LogsTableProps {
  logs: ExecutionLog[];
  isLoadingMore: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
  onViewDetails: (log: ExecutionLog) => void;
  workflowId?: string;
  hasMore?: boolean;
  canGoBack?: boolean;
  sortConfig?: SortConfig;
  onSort?: (key: string) => void;
}

export const LogsTable: React.FC<LogsTableProps> = ({ 
    logs, 
    isLoadingMore, 
    onNextPage, 
    onPrevPage, 
    onViewDetails, 
    workflowId, 
    hasMore = false,
    canGoBack = false,
    sortConfig,
    onSort
}) => {
  const renderSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
                <h3 className="text-base font-bold text-gray-900">Log de Execuções</h3>
                <p className="text-xs text-gray-500 font-light hidden sm:block">Histórico detalhado do workflow <code>{workflowId}</code></p>
                <p className="text-[10px] text-gray-500 font-light sm:hidden mt-0.5">{logs.length} execuções exibidas</p>
            </div>

            <div className="flex items-center gap-2">
                {isLoadingMore && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onPrevPage}
                        disabled={isLoadingMore || !canGoBack}
                        className="px-3 py-1.5 text-[10px] font-bold text-gray-500 hover:text-black uppercase tracking-wide transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-md bg-white shadow-sm border border-gray-100"
                    >
                        Voltar
                    </button>
                    <button 
                        onClick={onNextPage}
                        disabled={isLoadingMore || !hasMore}
                        className="px-3 py-1.5 text-[10px] font-bold text-gray-500 hover:text-black uppercase tracking-wide transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-md bg-white shadow-sm border border-gray-100"
                    >
                        Próximo
                    </button>
                </div>
            </div>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <th 
                            className="px-5 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => onSort?.('status')}
                        >
                            <div className="flex items-center">
                                Status {renderSortIcon('status')}
                            </div>
                        </th>
                        <th 
                            className="px-5 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => onSort?.('id')}
                        >
                            <div className="flex items-center">
                                ID {renderSortIcon('id')}
                            </div>
                        </th>
                        <th 
                            className="px-5 py-3 hidden md:table-cell cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => onSort?.('mode')}
                        >
                            <div className="flex items-center">
                                Modo {renderSortIcon('mode')}
                            </div>
                        </th>
                        <th 
                            className="px-5 py-3 hidden sm:table-cell cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => onSort?.('startedAt')}
                        >
                            <div className="flex items-center">
                                Início {renderSortIcon('startedAt')}
                            </div>
                        </th>
                        <th 
                            className="px-5 py-3 hidden lg:table-cell cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => onSort?.('duration')}
                        >
                            <div className="flex items-center">
                                Duração {renderSortIcon('duration')}
                            </div>
                        </th>
                        <th className="px-5 py-3 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                    {isLoadingMore ? (
                        [...Array(10)].map((_, i) => (
                            <tr key={`skeleton-${i}`} className="animate-pulse">
                                <td className="px-5 py-4"><div className="h-3 bg-gray-100 rounded w-16"></div></td>
                                <td className="px-5 py-4"><div className="h-3 bg-gray-100 rounded w-12"></div></td>
                                <td className="px-5 py-4 hidden md:table-cell"><div className="h-3 bg-gray-50 rounded w-14"></div></td>
                                <td className="px-5 py-4 hidden sm:table-cell"><div className="h-3 bg-gray-50 rounded w-24"></div></td>
                                <td className="px-5 py-4 hidden lg:table-cell"><div className="h-3 bg-gray-50 rounded w-16"></div></td>
                                <td className="px-5 py-4 text-center"><div className="h-6 w-6 bg-gray-100 rounded mx-auto"></div></td>
                            </tr>
                        ))
                    ) : (
                        logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-5 py-3 whitespace-nowrap">
                                    {log.status === 'success' && (
                                        <div className="flex items-center gap-2.5">
                                            <div className="relative flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                <div className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-20"></div>
                                            </div>
                                            <span className="text-xs font-semibold text-gray-700">Sucesso</span>
                                        </div>
                                    )}
                                    {log.status === 'error' && (
                                        <div className="flex items-center gap-2">
                                            <XCircle className="w-4 h-4 text-red-500" />
                                            <span className="text-xs font-semibold text-gray-700">Erro</span>
                                        </div>
                                    )}
                                    {log.status === 'canceled' && (
                                        <div className="flex items-center gap-2">
                                            <AlertOctagon className="w-4 h-4 text-gray-400" />
                                            <span className="text-xs font-medium text-gray-500">Cancelado</span>
                                        </div>
                                    )}
                                    {(log.status === 'waiting' || log.status === 'running') && (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                                            <span className="text-xs font-medium text-gray-700">Rodando</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-5 py-3 whitespace-nowrap font-mono text-[11px] text-gray-600">
                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 border border-gray-200">
                                        #{log.id}
                                    </span>
                                </td>
                                <td className="px-5 py-3 whitespace-nowrap text-gray-600 hidden md:table-cell">
                                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                        {log.mode}
                                    </span>
                                </td>
                                <td className="px-5 py-3 whitespace-nowrap text-gray-600 font-mono text-[11px] hidden sm:table-cell">
                                    {formatDate(log.startedAt)}
                                </td>
                                <td className="px-5 py-3 whitespace-nowrap text-gray-600 hidden lg:table-cell">
                                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        {getDuration(log.startedAt, log.stoppedAt)}
                                    </div>
                                </td>
                                <td className="px-5 py-3 whitespace-nowrap text-center">
                                    <button 
                                        onClick={() => onViewDetails(log)}
                                        className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-200 rounded-md transition-all inline-flex items-center justify-center group/btn"
                                        title="Ver Detalhes JSON"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
};
