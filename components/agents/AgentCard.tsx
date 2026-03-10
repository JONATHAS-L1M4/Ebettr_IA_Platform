import React, { useEffect, useState, useRef } from 'react';
import { Agent, UserRole } from '../../types';
import { Bot, Loader2, AlertTriangle, Lock, LockOpen, Ban, RefreshCw } from '../ui/Icons';
import Toggle from '../ui/Toggle';
import SpotlightCard from '../ui/SpotlightCard';
import { useNotification } from '../../context/NotificationContext';
import { fetchN8nWorkflowFullJson } from '../../services/n8nService';

interface AgentCardProps {
  agent: Agent;
  isToggling: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
  readonly?: boolean;
  userRole?: UserRole | null;
  onBlockToggle?: (blocked: boolean) => void;
  onMaintenanceToggle?: (id: string, maintenance: boolean) => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({ 
  agent, 
  isToggling, 
  onSelect, 
  onToggle,
  readonly = false,
  userRole,
  onBlockToggle,
  onMaintenanceToggle
}) => {
  const { addNotification } = useNotification();
  
  const [remoteActive, setRemoteActive] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const lastUpdateRef = useRef<number>(0);

  const getWorkflowId = () => {
    return agent.configSections
      .flatMap(section => section.fields)
      .find(field => field.id === 'n8n_workflow_id')?.value as string;
  };

  const workflowId = getWorkflowId();
  const isAdmin = userRole === 'admin';
  const isBlocked = agent.isBlocked;
  const isToggleDisabled = readonly || isBlocked || agent.maintenance || isToggling; 

  // Efeito de Polling / Verificação Remota
  useEffect(() => {
    if (!workflowId || isBlocked) return;

    let mounted = true;
    let timer: ReturnType<typeof setTimeout>;

    const verifyStatus = async () => {
        // Evita polling se o usuário acabou de interagir (delay de 3s de graça)
        if (Date.now() - lastUpdateRef.current < 3000) return;

        setIsVerifying(true);
        try {
            const data = await fetchN8nWorkflowFullJson(workflowId);
            if (mounted && data && typeof data.active === 'boolean') {
                setRemoteActive(data.active);
            }
        } catch (error) {
            console.warn(`[AgentCard] Falha ao verificar status remoto para ${agent.name}`);
        } finally {
            if (mounted) setIsVerifying(false);
        }
    };

    // Primeira verificação e intervalo
    verifyStatus();
    const intervalId = setInterval(verifyStatus, 30000); 

    return () => { 
        mounted = false; 
        clearInterval(intervalId);
    };
  }, [workflowId, isBlocked]); 

  // O ponto de status usa o remoto se disponível para dar feedback de "sincronizado"
  const statusIndicatorActive = remoteActive !== null ? remoteActive : agent.active;

  const handleToggleClick = (val: boolean) => {
      lastUpdateRef.current = Date.now();
      setRemoteActive(null); // Reseta cache remoto para forçar nova leitura após ação
      onToggle(agent.id, val);
  };

  const handleBlockClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onBlockToggle) {
          onBlockToggle(!isBlocked);
      }
  };

  const handleCardClick = () => {
      if (isBlocked && !isAdmin) {
          addNotification(
              'warning', 
              'Agente Indisponível', 
              'O acesso a este agente foi suspenso. Por favor, entre em contato com o administrador do sistema.'
          );
          return;
      }
      onSelect(agent.id);
  };

  return (
    <SpotlightCard
      onClick={handleCardClick}
      className={`
        h-full min-h-[200px] cursor-pointer relative overflow-hidden group
        ${isBlocked && !isAdmin 
            ? 'border-red-100 bg-red-50/10 hover:bg-red-50/20' 
            : agent.maintenance && !isAdmin
                ? 'border-amber-200 bg-amber-50/10 hover:bg-amber-50/20'
                : !agent.active 
                    ? 'border-gray-200 opacity-75 hover:opacity-100' 
                    : 'border-gray-200 hover:border-gray-300'
        }
        ${(isBlocked && isAdmin) || (agent.maintenance && isAdmin) ? 'bg-gray-50/50' : ''}
      `}
    >
      {((isBlocked && isAdmin) || (agent.maintenance && isAdmin)) && (
          <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" 
               style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }} 
          />
      )}

      <div className="flex flex-col justify-between h-full p-6 relative z-10">
          <div className="flex justify-between items-start mb-3">
              <div className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors 
                  ${isBlocked 
                      ? (isAdmin ? 'border-red-200 bg-red-50 text-red-500' : 'border-red-100 bg-white text-red-400') 
                      : agent.maintenance
                          ? 'border-amber-200 bg-amber-50 text-amber-600'
                          : 'border-gray-200 bg-gray-50 text-gray-900'}
              `}>
                  {isBlocked ? (
                      isAdmin ? <Lock className="w-5 h-5" /> : <Ban className="w-5 h-5" />
                  ) : agent.maintenance ? (
                      <AlertTriangle className="w-5 h-5" />
                  ) : (
                      <Bot className={`w-5 h-5 transition-colors ${agent.active ? 'text-black' : 'text-gray-400'}`} />
                  )}
              </div>
              
              <div className="flex items-center gap-2">
                  {isAdmin && (
                      <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onMaintenanceToggle) onMaintenanceToggle(agent.id, !agent.maintenance);
                            }}
                            className={`p-1.5 rounded-md transition-colors z-30 ${agent.maintenance ? 'text-amber-600 bg-amber-50 border border-amber-200' : 'text-gray-300 hover:text-amber-600 hover:bg-amber-50'}`}
                            title={agent.maintenance ? "Sair do Modo Manutenção" : "Entrar em Modo Manutenção"}
                          >
                              <AlertTriangle className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={handleBlockClick}
                            className={`p-1.5 rounded-md transition-colors z-30 ${isBlocked ? 'text-red-500 hover:bg-red-50 bg-white border border-red-100' : 'text-gray-300 hover:text-black hover:bg-gray-100'}`}
                            title={isBlocked ? "Desbloquear Agente" : "Bloquear Agente (Admin)"}
                          >
                              {isBlocked ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
                          </button>
                      </div>
                  )}

                  <div onClick={(e) => e.stopPropagation()} className={`relative z-20`}>
                      {isBlocked && !isAdmin ? (
                          <div className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded text-red-500 border border-red-100" title="Contate o administrador">
                              <span className="text-[9px] font-bold uppercase tracking-wide">Indisponível</span>
                          </div>
                      ) : agent.maintenance && !isAdmin ? (
                          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded text-amber-600 border border-amber-100" title="Agente em manutenção">
                              <span className="text-[9px] font-bold uppercase tracking-wide">Manutenção</span>
                          </div>
                      ) : isToggling ? (
                          <div className="p-1">
                              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                          </div>
                      ) : (
                          <Toggle 
                              checked={agent.active} 
                              onChange={handleToggleClick}
                              size="sm"
                              disabled={isToggleDisabled}
                          />
                      )}
                  </div>
              </div>
          </div>

          <div className="flex-1 flex flex-col justify-start mt-2">
              <div className="flex items-center gap-2 mb-1">
                  <h3 className={`text-sm font-bold truncate tracking-tight ${agent.active && !isBlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                      {agent.name}
                  </h3>
                  {!workflowId && !isBlocked && (
                      <span className="text-amber-500" title="Workflow não configurado">
                          <AlertTriangle className="w-3 h-3" />
                      </span>
                  )}
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                  {isBlocked && !isAdmin 
                    ? "Este agente está temporariamente fora de operação." 
                    : agent.maintenance && !isAdmin
                        ? "Este agente está em manutenção no momento."
                        : (agent.description || "Sem descrição.")}
              </p>
          </div>

          <div className="mt-3 flex items-center gap-2 pt-3 border-t border-gray-50 justify-between">
            {isBlocked ? (
                <div className="flex items-center gap-1.5 text-red-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                        {isAdmin ? 'Bloqueado Admin' : 'Suspenso'}
                    </span>
                </div>
            ) : agent.maintenance ? (
                <div className="flex items-center gap-1.5 text-amber-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                        Manutenção
                    </span>
                </div>
            ) : (
                <div className="flex items-center gap-2 w-full">
                    {agent.active ? (
                        <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${statusIndicatorActive ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Operacional</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">Standby</span>
                        </div>
                    )}
                    
                    {isVerifying && (
                        <div className="ml-auto" title="Sincronizando com n8n...">
                            <RefreshCw className="w-2.5 h-2.5 text-gray-200 animate-spin" />
                        </div>
                    )}
                </div>
            )}
          </div>
      </div>
    </SpotlightCard>
  );
};