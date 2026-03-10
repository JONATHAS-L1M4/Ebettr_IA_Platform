
import React, { useState, useEffect, useRef } from 'react';
import { ConfigField } from '../../types';
import { fetchN8nWorkflows, N8nWorkflow } from '../../services/n8nService';
import { Search, Loader2, AlertCircle, X, Zap, RefreshCw } from '../ui/Icons';
import { inputBaseClass } from './styles';

interface WorkflowSearchFieldProps {
  field: ConfigField;
  onChange: (value: string) => void;
  onSelectWorkflow: (workflow: N8nWorkflow) => void;
}

export const WorkflowSearchField: React.FC<WorkflowSearchFieldProps> = ({ field, onChange, onSelectWorkflow }) => {
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load workflows on focus or mount if needed, but better on focus to save requests
  const loadWorkflows = async (force = false) => {
    if (!force && workflows.length > 0) return;
    setLoading(true);
    setError(false);
    try {
      const data = await fetchN8nWorkflows(force);
      setWorkflows(data);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFocus = () => {
    setShowDropdown(true);
    loadWorkflows();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setShowDropdown(true);
  };

  const handleManualRefresh = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      loadWorkflows(true);
  };

  // Filtra por Nome OU ID com proteção contra undefined
  const filteredWorkflows = workflows.filter(w => {
    const term = String(field.value || '').toLowerCase();
    const name = String(w.name || '').toLowerCase();
    const id = String(w.id || '').toLowerCase();
    return name.includes(term) || id.includes(term);
  });

  const handleSelect = (wf: N8nWorkflow) => {
    onChange(wf.name);
    onSelectWorkflow(wf);
    setShowDropdown(false);
  };

  const clearSelection = () => {
      onChange('');
      setShowDropdown(true);
      // We don't clear ID here automatically, handled by parent or user must select new
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input 
          type="text"
          value={field.value as string || ''}
          onChange={handleInputChange}
          onFocus={handleFocus}
          className={`${inputBaseClass} pr-16 ${field.value ? 'font-semibold text-gray-900' : ''}`}
          placeholder="Buscar por Nome ou ID..."
        />
        <div className="absolute right-2 top-2 text-gray-400 flex items-center gap-1">
           {/* Refresh Button */}
           <button 
                type="button" 
                onClick={handleManualRefresh}
                className={`p-1 hover:text-black transition-colors rounded hover:bg-gray-100 ${loading ? 'animate-spin text-black' : ''}`}
                title="Escanear workflows"
                disabled={loading}
           >
               {loading ? <Loader2 className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
           </button>

           <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>

           {field.value ? (
             <button onClick={clearSelection} type="button" className="hover:text-red-500 transition-colors p-1">
                <X className="w-4 h-4" />
             </button>
           ) : (
             <div className="p-1">
                 <Search className="w-4 h-4" />
             </div>
           )}
        </div>
      </div>

      {showDropdown && (
        <div className="mt-1 bg-white border border-gray-200 rounded-lg shadow-sm max-h-60 overflow-y-auto animate-scale-in w-full z-50">
           {loading && workflows.length === 0 && (
             <div className="p-4 text-center text-xs text-gray-500">Carregando workflows...</div>
           )}
           
           {error && (
             <div className="p-3 text-center text-red-500 text-xs flex items-center justify-center gap-2">
                <AlertCircle className="w-3 h-3" /> Erro ao carregar.
                <button onClick={() => loadWorkflows(true)} className="underline hover:text-red-700">Tentar</button>
             </div>
           )}

           {!loading && !error && filteredWorkflows.length === 0 && (
             <div className="p-3 text-center text-xs text-gray-400">Nenhum workflow encontrado.</div>
           )}

           {!loading && filteredWorkflows.map(wf => (
             <button
                key={wf.id}
                onClick={() => handleSelect(wf)}
                type="button"
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between group transition-colors border-b border-gray-50 last:border-0"
             >
                <div className="flex flex-col min-w-0 pr-3">
                    <span className="text-sm text-gray-700 group-hover:text-black font-medium truncate">
                        {wf.name}
                    </span>
                    <span className="text-[9px] text-gray-400 font-mono truncate">
                        #{wf.id}
                    </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {wf.active ? (
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Ativo
                        </span>
                    ) : (
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Desativado
                        </span>
                    )}
                </div>
             </button>
           ))}
        </div>
      )}

      {/* Info Card when a valid workflow is "selected" (approximated by matching name in list) */}
      {field.value && workflows.length > 0 && (
          (() => {
             const match = workflows.find(w => w.name === field.value);
             if (match) {
                 return (
                    <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between animate-fade-in">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-700 shadow-sm">
                                <Zap className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-900">{match.name}</h4>
                                <span className="text-[10px] font-mono text-gray-500 bg-white px-1 rounded border border-gray-100">
                                    {match.id}
                                </span>
                            </div>
                        </div>
                        {match.active ? (
                            <div className="flex items-center gap-1 text-green-600">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                <span className="text-[10px] font-bold uppercase">Online</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-gray-400">
                                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                                <span className="text-[10px] font-bold uppercase">Desativado</span>
                            </div>
                        )}
                    </div>
                 );
             }
             return null;
          })()
      )}
    </div>
  );
};
