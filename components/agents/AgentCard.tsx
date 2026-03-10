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
            ? 'border-destructive/40 bg-destructive/10 hover:bg-destructive/15' 
            : agent.maintenance && !isAdmin
                ? 'border-border bg-muted/60 hover:bg-muted/70'
                : !agent.active 
                    ? 'border-border opacity-75 hover:opacity-100' 
                    : 'border-border hover:border-border'
        }
        ${(isBlocked && isAdmin) || (agent.maintenance && isAdmin) ? 'bg-muted' : ''}
      `}
    >
      {((isBlocked && isAdmin) || (agent.maintenance && isAdmin)) && (
          <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] text-foreground/40"
               style={{ backgroundImage: 'repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }}
          />
      )}

      <div className="flex flex-col justify-between h-full p-6 relative z-10">
          <div className="flex justify-between items-start mb-3">
              <div className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors 
                  ${isBlocked 
                      ? (isAdmin ? 'border-destructive/40 bg-destructive/10 text-destructive' : 'border-destructive/40 bg-card text-destructive') 
                      : agent.maintenance
                          ? 'border-border bg-muted/60 text-muted-foreground'
                          : 'border-border bg-muted text-foreground'}
              `}>
                  {isBlocked ? (
                      isAdmin ? <Lock className="w-5 h-5" /> : <Ban className="w-5 h-5" />
                  ) : agent.maintenance ? (
                      <AlertTriangle className="w-5 h-5" />
                  ) : (
                      <Bot className={`w-5 h-5 transition-colors ${agent.active ? 'text-foreground' : 'text-muted-foreground'}`} />
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
                            className={`p-1.5 rounded-md transition-colors z-30 ${agent.maintenance ? 'text-foreground bg-muted border border-border' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                            title={agent.maintenance ? "Sair do Modo Manutenção" : "Entrar em Modo Manutenção"}
                          >
                              <AlertTriangle className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={handleBlockClick}
                            className={`p-1.5 rounded-md transition-colors z-30 ${isBlocked ? 'text-destructive hover:bg-destructive/10 bg-card border border-destructive/40' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                            title={isBlocked ? "Desbloquear Agente" : "Bloquear Agente (Admin)"}
                          >
                              {isBlocked ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
                          </button>
                      </div>
                  )}

                  <div onClick={(e) => e.stopPropagation()} className={`relative z-20`}>
                      {isBlocked && !isAdmin ? (
                          <div className="flex items-center gap-1 bg-destructive/10 px-2 py-1 rounded text-destructive border border-destructive/40" title="Contate o administrador">
                              <span className="text-[9px] font-bold uppercase tracking-wide">Indisponível</span>
                          </div>
                      ) : agent.maintenance && !isAdmin ? (
                          <div className="flex items-center gap-1 bg-muted/60 px-2 py-1 rounded text-muted-foreground border border-border" title="Agente em manutenção">
                              <span className="text-[9px] font-bold uppercase tracking-wide">Manutenção</span>
                          </div>
                      ) : isToggling ? (
                          <div className="p-1">
                              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
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
                  <h3 className={`text-sm font-bold truncate tracking-tight ${agent.active && !isBlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {agent.name}
                  </h3>
                  {!workflowId && !isBlocked && (
                      <span className="text-muted-foreground" title="Workflow não configurado">
                          <AlertTriangle className="w-3 h-3" />
                      </span>
                  )}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {isBlocked && !isAdmin 
                    ? "Este agente está temporariamente fora de operação." 
                    : agent.maintenance && !isAdmin
                        ? "Este agente está em manutenção no momento."
                        : (agent.description || "Sem descrição.")}
              </p>
          </div>

          <div className="mt-3 flex items-center gap-2 pt-3 border-t border-border justify-between">
            {isBlocked ? (
                <div className="flex items-center gap-1.5 text-destructive">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                        {isAdmin ? 'Bloqueado Admin' : 'Suspenso'}
                    </span>
                </div>
            ) : agent.maintenance ? (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                        Manutenção
                    </span>
                </div>
            ) : (
                <div className="flex items-center gap-2 w-full">
                    {agent.active ? (
                        <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${statusIndicatorActive ? 'bg-foreground' : 'bg-muted-foreground/80'}`}></div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Operacional</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">Standby</span>
                        </div>
                    )}
                    
                    {isVerifying && (
                        <div className="ml-auto" title="Sincronizando com n8n...">
                            <RefreshCw className="w-2.5 h-2.5 text-muted-foreground animate-spin" />
                        </div>
                    )}
                </div>
            )}
          </div>
      </div>
    </SpotlightCard>
  );
};


