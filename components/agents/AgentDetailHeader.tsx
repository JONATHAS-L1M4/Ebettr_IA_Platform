
import React, { useState, useEffect, useRef } from 'react';
import { Agent } from '../../types';
import { ArrowLeft, Bot, Pencil, Settings, Key, BarChart3, Play, Loader2, RefreshCw, Database } from '../ui/Icons';
import Toggle from '../ui/Toggle';
import { fetchN8nWorkflowFullJson } from '../../services/n8nService';

interface AgentDetailHeaderProps {
  agent: Agent;
  viewMode: 'config' | 'credentials' | 'executions' | 'rag';
  setViewMode: (mode: 'config' | 'credentials' | 'executions' | 'rag') => void;
  isClientMode: boolean;
  isToggling: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  onToggleGlobal: (val: boolean) => void;
  onPlayground: () => void;
  showConfigTab?: boolean;
  showCredentialsTab?: boolean;
  isLoading?: boolean;
}

export const AgentDetailHeader: React.FC<AgentDetailHeaderProps> = ({ 
  agent, 
  viewMode, 
  setViewMode, 
  isClientMode, 
  isToggling, 
  onBack, 
  onEdit, 
  onDelete, 
  onToggleGlobal, 
  onPlayground, 
  showConfigTab = true, 
  showCredentialsTab = true,
  isLoading = false
}) => {
  const hasTestMode = agent.hasTestMode !== undefined ? agent.hasTestMode : true;
  const isBlocked = agent.isBlocked;

  // Status remoto apenas para o indicador visual (ponto), não para o controle do switch
  const [remoteActive, setRemoteActive] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const isMounted = useRef(false);

  const getWorkflowId = () => {
    if (agent.workflowId) return agent.workflowId;
    return agent.configSections
      .flatMap(section => section.fields)
      .find(field => field.id === 'n8n_workflow_id')?.value as string;
  };

  const workflowId = getWorkflowId();

  useEffect(() => {
    if (!workflowId || isBlocked) return;

    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const verifyStatus = async () => {
        if (!mounted) return;
        setIsVerifying(true);
        try {
            const data = await fetchN8nWorkflowFullJson(workflowId);
            if (mounted && data && typeof data.active === 'boolean') {
                setRemoteActive(data.active);
            }
        } catch (error) {
            console.warn(`[Header] Falha ao verificar status remoto`);
        } finally {
            if (mounted) setIsVerifying(false);
        }
    };

    if (!isMounted.current) {
        verifyStatus();
        isMounted.current = true;
    } else {
        // Delay para ignorar checagem remota logo após o toggle e evitar conflito
        timeoutId = setTimeout(verifyStatus, 4000);
    }

    return () => { 
        mounted = false; 
        clearTimeout(timeoutId);
    };
  }, [agent.id, workflowId, isBlocked, agent.active]);

  // O ponto de status usa o remoto se disponível, mas o texto e toggle usam o local para estabilidade
  const statusIndicatorActive = remoteActive !== null ? remoteActive : agent.active;

  const showNavigation = true;

  return (
    <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b pb-4 border-gray-100`}>
        
        {/* Left: Back & Title */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <button 
            onClick={onBack}
            className={`group flex items-center justify-center w-8 h-8 rounded-full border transition-colors shrink-0 border-gray-200 hover:border-gray-400`}
          >
            <ArrowLeft className={`w-4 h-4 group-hover:text-black text-gray-500`} />
          </button>
          
          <div className="flex items-center gap-4 min-w-0">
             <div className={`w-10 h-10 border rounded-lg flex items-center justify-center shrink-0 relative border-gray-700 bg-gray-800 text-gray-100`}>
               <Bot className="w-5 h-5" />
             </div>
             <div className="min-w-0">
               <div className="flex items-center gap-2">
                 <h1 className={`text-xl font-bold truncate text-gray-900`} title={agent.name}>{agent.name}</h1>
                 {!isClientMode && onEdit && (
                   <button 
                      onClick={onEdit}
                      className={`p-1 rounded transition-colors shrink-0 text-gray-400 hover:text-black hover:bg-gray-100`}
                      title="Editar Dados e Workflow"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                 )}
               </div>
               <div className="flex items-center gap-2 mt-1">
                  {isBlocked ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="text-[10px] text-red-500 uppercase tracking-widest font-semibold">
                            Bloqueado
                        </span>
                      </>
                  ) : agent.maintenance ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-[10px] text-amber-600 uppercase tracking-widest font-semibold">
                            Manutenção
                        </span>
                      </>
                  ) : (
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusIndicatorActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                            {agent.active ? 'Ativado' : 'Desativado'}
                        </span>
                        {isVerifying && <RefreshCw className="w-2.5 h-2.5 text-gray-300 animate-spin" />}
                      </div>
                  )}
               </div>
             </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto shrink-0">
          
          {/* Toggle View (Tabs) */}
          {showNavigation && (
              <div className="bg-gray-100 p-1 rounded-lg flex items-center gap-2 shadow-inner w-full sm:w-auto h-[36px]">
                 {isLoading ? (
                     // Skeleton Loader para os Botões
                     <div className="flex items-center gap-2 w-full animate-pulse px-1">
                        <div className="h-6 w-20 bg-gray-200 rounded-md"></div>
                        <div className="h-6 w-24 bg-gray-200 rounded-md"></div>
                        <div className="h-6 w-20 bg-gray-200 rounded-md"></div>
                     </div>
                 ) : (
                      <>
                        {agent.ragEnabled !== false && (
                            <button 
                            onClick={() => setViewMode('rag')}
                            className={`
                                flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide transition-all duration-300 ease-out h-full
                                ${viewMode === 'rag' 
                                ? 'bg-gray-700 text-white transform scale-100 shadow-sm' 
                                : 'text-gray-500 hover:text-black hover:bg-white/50'}
                            `}
                            >
                                <Database className="w-3.5 h-3.5" />
                                Rag
                            </button>
                        )}

                        {showConfigTab && (
                            <button 
                            onClick={() => setViewMode('config')}
                            className={`
                                flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide transition-all duration-300 ease-out h-full
                                ${viewMode === 'config' 
                                ? 'bg-gray-700 text-white transform scale-100 shadow-sm' 
                                : 'text-gray-500 hover:text-black hover:bg-white/50'}
                            `}
                            >
                                <Settings className="w-3.5 h-3.5" />
                                Config
                            </button>
                        )}

                        {showCredentialsTab && (
                            <button 
                            onClick={() => setViewMode('credentials')}
                            className={`
                                flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide transition-all duration-300 ease-out h-full
                                ${viewMode === 'credentials' 
                                ? 'bg-gray-700 text-white transform scale-100 shadow-sm' 
                                : 'text-gray-500 hover:text-black hover:bg-white/50'}
                            `}
                            >
                                <Key className="w-3.5 h-3.5" />
                                Credenciais
                            </button>
                        )}

                        <button 
                        onClick={() => setViewMode('executions')}
                        className={`
                            flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide transition-all duration-300 ease-out h-full
                            ${viewMode === 'executions' 
                            ? 'bg-gray-700 text-white transform scale-100 shadow-sm' 
                            : 'text-gray-500 hover:text-black hover:bg-white/50'}
                        `}
                        >
                            <BarChart3 className="w-3.5 h-3.5" />
                            Execuções
                        </button>
                      </>
                 )}
              </div>
          )}

          {showNavigation && <div className="hidden lg:block h-6 w-[1px] bg-gray-200 mx-1.5"></div>}

          <div className="flex items-center gap-3 w-full sm:w-auto">
              
              <div className={`flex w-full sm:w-auto sm:flex-none items-center justify-between sm:justify-start gap-2 px-4 py-2 bg-gray-100 rounded-lg border border-gray-100 shadow-inner h-[36px] ${isToggling || isBlocked || agent.maintenance ? 'opacity-50 cursor-not-allowed' : ''}`} title={isBlocked ? 'Agente bloqueado. Desbloqueie na lista principal.' : agent.maintenance ? 'Agente em manutenção.' : ''}>
                <span className={`text-xs font-medium uppercase tracking-wide min-w-[80px] text-center ${agent.active ? 'text-gray-700' : 'text-gray-500'}`}>
                    {isToggling ? 'Aguarde...' : isBlocked ? 'Bloqueado' : agent.maintenance ? 'Manutenção' : 'Workflow'}
                </span>
                <div className={isToggling || isBlocked || agent.maintenance ? 'pointer-events-none' : ''}>
                    {isToggling ? (
                        <Loader2 className="w-5 h-5 animate-spin text-black" />
                    ) : (
                        <Toggle checked={agent.active} onChange={onToggleGlobal} size="sm" />
                    )}
                </div>
              </div>

              {hasTestMode && !isBlocked && (
                  <button 
                    onClick={onPlayground}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all h-[32px] bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Play className="w-3 h-3" />
                    Testar
                  </button>
              )}
          </div>
        </div>
      </div>
  );
};
