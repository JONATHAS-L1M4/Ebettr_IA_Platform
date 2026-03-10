
import React, { useState, useEffect, useCallback } from 'react';
import { Agent, NavigationState } from '../types';
import { useNotification } from '../context/NotificationContext';
import { agentService } from '../services/agentService';

const AGENTS_CACHE_KEY = 'ebettr_agents_cache';

export const useAppData = () => {
  const { addNotification } = useNotification();
  
  // Inicializa o estado lendo do localStorage para carregamento rápido
  const [agents, setAgents] = useState<Agent[]>(() => {
      try {
          const saved = localStorage.getItem(AGENTS_CACHE_KEY);
          return saved ? JSON.parse(saved) : [];
      } catch (e) {
          return [];
      }
  });

  // Se tivermos cache, não mostramos o loading inicial pesado
  const [isLoading, setIsLoading] = useState(agents.length === 0);

  // Helper para atualizar o Estado e o Cache
  const updateAgentsState = (newAgents: Agent[] | ((prev: Agent[]) => Agent[])) => {
      setAgents(prev => {
          const updated = typeof newAgents === 'function' ? newAgents(prev) : newAgents;
          localStorage.setItem(AGENTS_CACHE_KEY, JSON.stringify(updated));
          return updated;
      });
  };

  // --- CARREGAMENTO ---
  const isFetchingRef = React.useRef(false);

  const loadAgents = useCallback(async () => {
    if (isFetchingRef.current) return;
    
    // Se já tivermos agentes, não ativa o loading global para permitir refresh silencioso
    if (agents.length === 0) {
      setIsLoading(true);
    }
    
    isFetchingRef.current = true;
    try {
        const data = await agentService.list();
        // Atualiza estado com dados frescos da API
        updateAgentsState(data);
    } catch (error: any) {
        // Filtra erro de sessão para não poluir o console se o usuário não estiver logado
        if (error.message === 'Sessão expirada') {
            const hasToken = !!localStorage.getItem('ebettr_access_token');
            if (hasToken) {
                addNotification('warning', 'Sessão Expirada', 'Por favor, faça login novamente.');
            }
        } else {
            console.error("Failed to load agents", error);
            addNotification('error', 'Erro de Conexão', 'Não foi possível carregar a lista de agentes.');
        }
    } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
    }
  }, [addNotification, agents.length]);

  useEffect(() => {
    const token = localStorage.getItem('ebettr_access_token');
    if (token) {
        loadAgents();
    } else {
        setIsLoading(false);
    }
  }, []); // Executa apenas no mount inicial

  // --- HANDLERS AGENTES ---
  
  const handleToggleAgent = async (id: string, active: boolean) => {
    // Update Otimista Local
    const previousAgents = [...agents];
    updateAgentsState(prev => prev.map(a => a.id === id ? { ...a, active } : a));

    const targetAgent = agents.find(a => a.id === id);
    if (!targetAgent) return;

    try {
        await agentService.update({ ...targetAgent, active });
    } catch (error: any) {
        // Reverte em caso de erro
        updateAgentsState(previousAgents);
        addNotification('error', 'Erro ao atualizar', error.message);
    }
  };

  const handleBlockAgent = async (id: string, isBlocked: boolean) => {
    const previousAgents = [...agents];
    const targetAgent = agents.find(a => a.id === id);
    
    if (!targetAgent) return;

    let updatedAgentData: Agent;

    if (isBlocked) {
        updatedAgentData = { 
            ...targetAgent, 
            isBlocked: true, 
            active: false, 
            wasActiveBeforeBlock: targetAgent.active 
        };
    } else {
        const shouldBeActive = targetAgent.wasActiveBeforeBlock ?? false;
        updatedAgentData = { 
            ...targetAgent, 
            isBlocked: false, 
            active: shouldBeActive,
            wasActiveBeforeBlock: undefined 
        };
    }

    updateAgentsState(prev => prev.map(a => a.id === id ? updatedAgentData : a));

    try {
        await agentService.update(updatedAgentData);
        if (isBlocked) {
            addNotification('warning', 'Agente Bloqueado', 'O acesso foi suspenso.');
        }
    } catch (error: any) {
        updateAgentsState(previousAgents);
        addNotification('error', 'Erro ao bloquear', error.message);
    }
  };

  const handleMaintenanceAgent = async (id: string, maintenance: boolean) => {
    const previousAgents = [...agents];
    updateAgentsState(prev => prev.map(a => a.id === id ? { ...a, maintenance } : a));

    const targetAgent = agents.find(a => a.id === id);
    if (!targetAgent) return;

    try {
        await agentService.update({ ...targetAgent, maintenance });
        addNotification('success', 'Status Atualizado', `Modo manutenção ${maintenance ? 'ativado' : 'desativado'}.`);
    } catch (error: any) {
        updateAgentsState(previousAgents);
        addNotification('error', 'Erro ao atualizar', error.message);
    }
  };

  const handleUpdateAgent = async (updatedAgent: Agent) => {
    const previousAgents = [...agents];
    
    // Optimistic Update
    updateAgentsState(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a));

    try {
        await agentService.update(updatedAgent);
    } catch (error: any) {
        updateAgentsState(previousAgents);
        addNotification('error', 'Erro ao salvar', error.message);
    }
  };

  const handleCreateAgent = async (newAgent: Agent) => {
    try {
        const created = await agentService.create(newAgent);
        updateAgentsState(prev => [...prev, created]);
        return created; 
    } catch (error: any) {
        addNotification('error', 'Erro ao criar', error.message);
        throw error;
    }
  };

  const handleDeleteAgent = async (id: string, navState: NavigationState, setNavState: React.Dispatch<React.SetStateAction<NavigationState>>) => {
    const previousAgents = [...agents];
    
    // Optimistic Delete
    updateAgentsState(prev => prev.filter(a => a.id !== id));

    try {
        await agentService.delete(id);
        if (navState.agentId === id) {
           setNavState(prev => ({ ...prev, view: 'agents', agentId: undefined }));
        }
    } catch (error: any) {
        updateAgentsState(previousAgents);
        addNotification('error', 'Erro ao excluir', error.message);
    }
  };

  return {
    agents,
    isLoading, 
    handleToggleAgent,
    handleBlockAgent,
    handleMaintenanceAgent,
    handleUpdateAgent,
    handleCreateAgent,
    handleDeleteAgent,
    refreshAgents: loadAgents
  };
};
