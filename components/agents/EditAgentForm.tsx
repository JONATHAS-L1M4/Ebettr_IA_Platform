
import React, { useState, useEffect, useRef } from 'react';
import { Agent, AccessRule, UserRole, Company } from '../../types';
import { ArrowLeft, Brain, Zap, Search, Loader2, CheckCircle2, AlertTriangle, Trash2, RefreshCw, Key, ShieldCheck, Globe, User, Mail, Phone, ChevronDown, Database } from '../ui/Icons';
import { AccessManager } from '../inputs/AccessManager';
import { N8nWorkflow, fetchN8nWorkflows, fetchN8nWorkflowFullJson } from '../../services/n8nService';
import { companyService } from '../../services/companyService';
import { agentService } from '../../services/agentService';
import { useNotification } from '../../context/NotificationContext';
import Toggle from '../ui/Toggle';

interface EditAgentFormProps {
  agent: Agent;
  existingAgents: Agent[];
  onSave: (updatedAgent: Agent) => void;
  onCancel: () => void;
  onDelete?: () => void;
  userRole: UserRole | null;
}

const EditFormSkeleton = () => (
  <div className="animate-fade-in max-w-3xl mx-auto">
    <div className="flex items-center gap-4 mb-8 animate-pulse">
       <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0"></div>
       <div className="space-y-2 w-full max-w-xs">
         <div className="h-6 bg-gray-200 rounded w-1/2"></div>
         <div className="h-4 bg-gray-100 rounded w-3/4"></div>
       </div>
    </div>
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden animate-pulse">
       <div className="p-8 flex flex-col gap-10">
          <div className="flex flex-col gap-6">
             <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
             </div>
             <div className="space-y-3">
                <div className="h-3 w-20 bg-gray-100 rounded"></div>
                <div className="h-10 w-full bg-gray-50 rounded border border-gray-100"></div>
             </div>
             <div className="space-y-3">
                <div className="h-3 w-24 bg-gray-100 rounded"></div>
                <div className="h-24 w-full bg-gray-50 rounded border border-gray-100"></div>
             </div>
          </div>
          <div className="flex flex-col gap-6">
             <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
             </div>
             <div className="h-10 w-full bg-gray-50 rounded border border-gray-100"></div>
          </div>
       </div>
       <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
           <div className="h-9 w-20 bg-gray-200 rounded"></div>
           <div className="h-9 w-36 bg-gray-300 rounded"></div>
       </div>
    </div>
  </div>
);

export const EditAgentForm: React.FC<EditAgentFormProps> = ({ agent, existingAgents, onSave, onCancel, onDelete, userRole }) => {
  const { addNotification } = useNotification();
  const isAdmin = userRole === 'admin';

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const lastAgentIdRef = useRef<string | null>(null);

  const [settingsForm, setSettingsForm] = useState({ 
    name: '', 
    description: '',
    client: '',
    companyId: '',
    email: '',
    phone: '',
    workflowName: '',
    workflowId: '',
    accessControl: [] as AccessRule[],
    hasTestMode: true,
    testWebhookUrl: '',
    ragEnabled: true,
    ragUploadUrl: '',
    rag_storage_limit_mb: 0,
    maintenance: false
  });
  
  const [n8nWorkflows, setN8nWorkflows] = useState<N8nWorkflow[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const companyDropdownRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const initData = async () => {
        const isUpdate = lastAgentIdRef.current === agent.id;
        
        if (!isUpdate) {
            setIsInitialLoading(true);
        }
        
        let wfName = '';
        let wfId = agent.workflowId || '';
        
        // Always check config sections for fallback/consistency
        agent.configSections.forEach(sec => {
            sec.fields.forEach(f => {
                if (f.id === 'n8n_workflow_name' && !wfName) wfName = String(f.value);
                if (f.id === 'n8n_workflow_id' && !wfId) wfId = String(f.value);
            });
        });

        setSettingsForm({ 
            name: agent.name, 
            description: agent.description,
            client: agent.client || '',
            companyId: agent.companyId || '',
            email: agent.email || '',
            phone: agent.phone || '',
            workflowName: wfName,
            workflowId: wfId,
            accessControl: agent.accessControl || [],
            hasTestMode: agent.hasTestMode !== undefined ? agent.hasTestMode : true,
            testWebhookUrl: agent.testWebhookUrl || '',
            ragEnabled: agent.ragEnabled !== undefined ? agent.ragEnabled : true,
            ragUploadUrl: agent.ragUploadUrl || '',
            rag_storage_limit_mb: agent.rag_storage_limit_mb || 0,
            maintenance: agent.maintenance || false
        });

        try {
            const [accessRules, workflowsData, companiesData] = await Promise.all([
                agentService.fetchVisibility(agent.id),
                fetchN8nWorkflows(false),
                companyService.list()
            ]);

            setN8nWorkflows(workflowsData);
            setCompanies(companiesData);

            // Fetch Full Workflow JSON if ID exists to populate fields from source
            let workflowDetails: any = null;
            if (wfId) {
                try {
                    workflowDetails = await fetchN8nWorkflowFullJson(wfId);
                } catch (err) {
                    console.warn("Could not fetch full workflow details", err);
                }
            }

            setSettingsForm(prev => {
                const newState = { ...prev, accessControl: accessRules };
                
                // Workflow Name Resolution (Priority: API > List > Local)
                if (workflowDetails && workflowDetails.name) {
                    newState.workflowName = workflowDetails.name;
                } else if (wfId && workflowsData.length > 0) {
                    const found = workflowsData.find(w => w.id === wfId);
                    if (found) {
                        newState.workflowName = found.name;
                    }
                }

                // Company Data Resolution
                if (agent.companyId && companiesData.length > 0) {
                    const company = companiesData.find(c => c.id === agent.companyId);
                    if (company) {
                        if (!newState.client) newState.client = company.name;
                        if (!newState.email) newState.email = company.contactEmail || '';
                        if (!newState.phone) newState.phone = company.contactPhone || '';
                    }
                }
                
                return newState;
            });

        } catch (e) {
            console.warn("Failed to load some resources for edit form", e);
        } finally {
            if (!isUpdate) {
                setTimeout(() => {
                    setIsInitialLoading(false);
                    lastAgentIdRef.current = agent.id;
                }, 600);
            } else {
                setIsInitialLoading(false);
                lastAgentIdRef.current = agent.id;
            }
        }
    };

    initData();
  }, [agent]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setIsCompanyDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isInitialLoading && descriptionRef.current) {
        descriptionRef.current.style.height = 'auto';
        descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
    }
  }, [settingsForm.description, isInitialLoading]);

  const loadWorkflows = async (isManualRefresh = false) => {
    setIsLoadingWorkflows(true);
    try {
        const workflows = await fetchN8nWorkflows(isManualRefresh);
        setN8nWorkflows(workflows);
        if (isManualRefresh) {
            addNotification('success', 'Lista atualizada', `${workflows.length} workflows encontrados.`);
        }
    } catch (e) {
    } finally {
        setIsLoadingWorkflows(false);
    }
  };

  const filteredWorkflows = n8nWorkflows.filter(wf => {
    const term = String(settingsForm.workflowName || '').toLowerCase();
    const name = String(wf.name || '').toLowerCase();
    const id = String(wf.id || '').toLowerCase();
    return name.includes(term) || id.includes(term);
  });

  const filteredCompanies = companies.filter(c => 
      c.name.toLowerCase().includes(settingsForm.client.toLowerCase())
  );

  const handleSelectWorkflow = (wf: N8nWorkflow) => {
      setSettingsForm(prev => ({
          ...prev,
          workflowName: wf.name,
          workflowId: wf.id
      }));
      setIsDropdownOpen(false);
  };

  const handleSelectCompany = (comp: Company) => {
      setSettingsForm(prev => ({
          ...prev,
          client: comp.name,
          companyId: comp.id,
          email: comp.contactEmail || '',
          phone: comp.contactPhone || ''
      }));
      setIsCompanyDropdownOpen(false);
  };

  const getAgentWorkflowId = (a: Agent): string | null => {
    if (a.workflowId) return a.workflowId;
    for (const section of a.configSections) {
        for (const field of section.fields) {
            if (field.id === 'n8n_workflow_id' && field.value) {
                return String(field.value);
            }
        }
    }
    return null;
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const nameExists = existingAgents.some(a => 
        a.id !== agent.id && 
        a.name.trim().toLowerCase() === settingsForm.name.trim().toLowerCase()
    );
    if (nameExists) {
        addNotification('error', 'Nome Duplicado', 'Já existe um agente com este nome.');
        return;
    }

    if (settingsForm.workflowId) {
        const workflowUsed = existingAgents.some(a => {
            if (a.id === agent.id) return false;
            return getAgentWorkflowId(a) === settingsForm.workflowId;
        });
        if (workflowUsed) {
            addNotification('error', 'Workflow em Uso', 'Este workflow já está vinculado a outro agente.');
            return;
        }
    }

    setIsSaving(true);
    try {
        let finalCompanyId = settingsForm.companyId;
        if (!finalCompanyId && settingsForm.client) {
            const found = companies.find(c => c.name.toLowerCase() === settingsForm.client.trim().toLowerCase());
            if (found) finalCompanyId = found.id;
        }

        let updatedAgent = {
            ...agent,
            name: settingsForm.name,
            description: settingsForm.description,
            client: settingsForm.client,
            companyId: finalCompanyId,
            workflowId: settingsForm.workflowId,
            email: settingsForm.email,
            phone: settingsForm.phone,
            accessControl: settingsForm.accessControl,
            hasTestMode: settingsForm.hasTestMode,
            testWebhookUrl: settingsForm.testWebhookUrl,
            ragEnabled: settingsForm.ragEnabled,
            ragUploadUrl: settingsForm.ragUploadUrl,
            rag_storage_limit_mb: settingsForm.rag_storage_limit_mb,
            maintenance: settingsForm.maintenance,
            allowAudio: true,
            allowAttachments: true
        };

        let workflowUpdated = false;
        updatedAgent.configSections = updatedAgent.configSections.map(sec => {
            let sectionHasWorkflow = false;
            const updatedFields = sec.fields.map(f => {
                if (f.id === 'n8n_workflow_name') {
                    sectionHasWorkflow = true;
                    return { ...f, value: settingsForm.workflowName };
                }
                if (f.id === 'n8n_workflow_id') {
                    sectionHasWorkflow = true;
                    return { ...f, value: settingsForm.workflowId };
                }
                return f;
            });
            if (sectionHasWorkflow) workflowUpdated = true;
            return { ...sec, fields: updatedFields };
        });

        if (!workflowUpdated && settingsForm.workflowId) {
            updatedAgent.configSections.push({
                id: 'system_integration',
                title: 'Integração de Sistema',
                description: 'Configuração interna do workflow.',
                icon: 'database',
                fields: [
                    { id: 'n8n_workflow_name', label: 'Nome do Workflow (n8n)', type: 'text', value: settingsForm.workflowName, required: true },
                    { id: 'n8n_workflow_id', label: 'ID do Workflow', type: 'text', value: settingsForm.workflowId, required: true },
                ]
            });
        }

        await onSave(updatedAgent);
        addNotification('success', 'Agente atualizado', 'Todas as alterações foram salvas.');
    } catch (error: any) {
        console.error("Error saving agent:", error);
        addNotification('error', 'Erro ao salvar', error.message || 'Não foi possível salvar as alterações.');
    } finally {
        setIsSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:border-gray-200 focus:outline-none text-sm placeholder-gray-400 shadow-sm text-gray-900";
  const readOnlyClass = "bg-gray-100 text-gray-600 cursor-not-allowed select-none focus:ring-0 focus:border-gray-200";

  if (isInitialLoading) {
      return <EditFormSkeleton />;
  }

  return (
      <div className="animate-fade-in max-w-3xl mx-auto pb-12">
        <div className="flex items-center gap-4 mb-8">
           <button onClick={onCancel} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-gray-400 hover:text-black text-gray-500 transition-colors bg-white">
             <ArrowLeft className="w-4 h-4" />
           </button>
           <div>
             <h1 className="text-xl font-bold text-gray-900">Editar Agente</h1>
             <p className="text-sm text-gray-500 font-light">Atualize a identidade e o workflow do agente.</p>
           </div>
        </div>

        <form onSubmit={handleSaveSettings} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-visible">
           <div className="p-8 flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                 <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Brain className="w-3 h-3" /> Identidade
                 </h3>
                 <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Nome da Automação</label>
                        <span className="text-[10px] text-gray-400 font-mono">{settingsForm.name.length}/60</span>
                    </div>
                    <input type="text" required maxLength={60} value={settingsForm.name} onChange={e => setSettingsForm({...settingsForm, name: e.target.value})} className={inputClass} />
                 </div>
                 <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Função da Automação</label>
                        <span className="text-[10px] text-gray-400 font-mono">{settingsForm.description.length}/300</span>
                    </div>
                    <textarea ref={descriptionRef} required maxLength={300} rows={3} value={settingsForm.description} onChange={e => setSettingsForm({...settingsForm, description: e.target.value})} className={`${inputClass} resize-none overflow-hidden`} style={{ minHeight: '80px' }} />
                 </div>
                 <div className="pt-2 flex flex-col gap-4">
                    <div className="flex flex-col gap-1" ref={companyDropdownRef}>
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Nome Cliente / Empresa</label>
                        <div className="relative">
                            <div className="absolute left-3 top-2.5 text-gray-400 pointer-events-none"><User className="w-4 h-4" /></div>
                            <input type="text" placeholder="Ex: Acme Corp" value={settingsForm.client} onChange={e => { setSettingsForm({...settingsForm, client: e.target.value}); setIsCompanyDropdownOpen(true); }} onFocus={() => setIsCompanyDropdownOpen(true)} className={`${inputClass} pl-9`} />
                            {isCompanyDropdownOpen && filteredCompanies.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden animate-scale-in">
                                    {filteredCompanies.map(comp => (
                                        <button key={comp.id} type="button" onClick={() => handleSelectCompany(comp)} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center justify-between transition-colors border-b border-gray-50 last:border-0">
                                            <span className="font-medium">{comp.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">E-mail de Contato</label>
                            <div className="relative">
                                <div className="absolute left-3 top-2.5 text-gray-400"><Mail className="w-4 h-4" /></div>
                                <input type="email" value={settingsForm.email} readOnly tabIndex={-1} className={`${inputClass} pl-9 ${readOnlyClass}`} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Telefone</label>
                            <div className="relative">
                                <div className="absolute left-3 top-2.5 text-gray-400"><Phone className="w-4 h-4" /></div>
                                <input type="tel" value={settingsForm.phone} readOnly tabIndex={-1} className={`${inputClass} pl-9 ${readOnlyClass}`} />
                            </div>
                        </div>
                    </div>
                 </div>
              </div>

              {isAdmin && (
                  <div className="flex flex-col gap-4">
                     <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2 flex items-center gap-2">
                        <Key className="w-3 h-3" /> Gestão de Acesso
                     </h3>
                     <div className="flex flex-col gap-1 mt-2">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="w-4 h-4 text-gray-400" /> 
                            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Usuários Permitidos</span>
                        </div>
                        <AccessManager rules={settingsForm.accessControl} onChange={(rules) => setSettingsForm({...settingsForm, accessControl: rules})} selectedCompany={settingsForm.client} />
                     </div>
                  </div>
              )}

              <div className="flex flex-col gap-4">
                 <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Zap className="w-3 h-3" /> Cérebro (Workflow)
                 </h3>
                 <div className="flex flex-col gap-1 relative z-50" ref={dropdownRef}>
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Selecionar Workflow</label>
                        <button type="button" onClick={() => loadWorkflows(true)} disabled={isLoadingWorkflows} className="text-[10px] text-gray-500 hover:text-black flex items-center gap-1 transition-colors disabled:opacity-50">
                           <RefreshCw className={`w-3 h-3 ${isLoadingWorkflows ? 'animate-spin' : ''}`} /> Atualizar
                        </button>
                    </div>
                    <div className="relative">
                        <input type="text" placeholder="Buscar workflow..." value={settingsForm.workflowName} onChange={(e) => { setSettingsForm(prev => ({ ...prev, workflowName: e.target.value, workflowId: '' })); setIsDropdownOpen(true); }} onFocus={() => setIsDropdownOpen(true)} className={`${inputClass} pr-8 ${settingsForm.workflowId ? 'font-bold text-black' : ''}`} />
                        <div className="absolute right-3 top-2.5 text-gray-400">{isLoadingWorkflows ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}</div>
                        {isDropdownOpen && !isLoadingWorkflows && (
                            <div className="mt-1 bg-white border border-gray-200 rounded-lg shadow-sm max-h-56 overflow-y-auto animate-scale-in w-full">
                                {filteredWorkflows.length > 0 ? (
                                    filteredWorkflows.map(wf => (
                                        <button key={wf.id} type="button" onClick={() => handleSelectWorkflow(wf)} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center justify-between group transition-colors border-b border-gray-50 last:border-0">
                                            <div className="flex flex-col min-w-0 pr-3">
                                                <span className="text-sm text-gray-700 group-hover:text-black font-medium truncate">{wf.name}</span>
                                                <span className="text-[9px] text-gray-400 font-mono truncate">#{wf.id}</span>
                                            </div>
                                            <span className={`text-[9px] font-bold ${wf.active ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-100'} px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0`}>
                                                {wf.active ? 'Ativo' : 'Desativado'}
                                            </span>
                                        </button>
                                    ))
                                ) : <div className="px-4 py-3 text-sm text-gray-500 text-center">Nenhum workflow encontrado.</div>}
                            </div>
                        )}
                    </div>
                    {settingsForm.workflowId && (
                        <div className="mt-2 text-[10px] text-gray-500 font-mono bg-gray-50 p-2 rounded border border-gray-100">
                            <span className="font-bold text-gray-400">ID VINCULADO:</span> {settingsForm.workflowId}
                        </div>
                    )}
                 </div>

                 <div className="pt-4 mt-2 border-t border-gray-100 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                             <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Habilitar Base de Conhecimento (RAG)</label>
                             <p className="text-[10px] text-gray-400">Permite que o agente utilize documentos para responder.</p>
                         </div>
                         <Toggle checked={settingsForm.ragEnabled} onChange={(v) => setSettingsForm({...settingsForm, ragEnabled: v})} size="sm" />
                     </div>
                     {settingsForm.ragEnabled && (
                         <div className="flex flex-col gap-4 animate-fade-in bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                              <div className="flex flex-col gap-1">
                                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">URL de Upload RAG</label>
                                  <p className="text-[10px] text-gray-400 mb-1">URL do endpoint para processamento de documentos.</p>
                                  <div className="relative">
                                      <div className="absolute left-3 top-2.5 text-gray-400"><Globe className="w-4 h-4" /></div>
                                      <input type="url" placeholder="https://..." value={settingsForm.ragUploadUrl || ''} onChange={(e) => setSettingsForm({...settingsForm, ragUploadUrl: e.target.value})} className={`${inputClass} pl-9 bg-white`} />
                                  </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Limite de Armazenamento (MB)</label>
                                  <p className="text-[10px] text-gray-400 mb-1">Capacidade máxima de armazenamento para documentos RAG.</p>
                                  <div className="relative">
                                      <div className="absolute left-3 top-2.5 text-gray-400 flex items-center h-4"><Database className="w-4 h-4" /></div>
                                      <input 
                                        type="number" 
                                        min={1}
                                        placeholder="Ex: 500" 
                                        value={settingsForm.rag_storage_limit_mb || ''} 
                                        onChange={(e) => setSettingsForm({...settingsForm, rag_storage_limit_mb: parseInt(e.target.value) || 0})} 
                                        className={`${inputClass} pl-9 bg-white`} 
                                      />
                                  </div>
                              </div>
                         </div>
                     )}
                     <div className="flex items-center justify-between">
                         <div>
                            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Habilitar Testes (Playground)</label>
                            <p className="text-[10px] text-gray-400">Permite testar o comportamento do agente em tempo real.</p>
                        </div>
                        <Toggle checked={settingsForm.hasTestMode} onChange={(v) => setSettingsForm({...settingsForm, hasTestMode: v})} size="sm" />
                    </div>
                    {settingsForm.hasTestMode && (
                        <div className="flex flex-col gap-4 animate-fade-in bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                             <div className="flex flex-col gap-1">
                                 <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Webhook de Teste</label>
                                 <p className="text-[10px] text-gray-400 mb-1">URL do endpoint de webhook para o modo de teste.</p>
                                 <div className="relative">
                                     <div className="absolute left-3 top-2.5 text-gray-400"><Globe className="w-4 h-4" /></div>
                                     <input type="url" placeholder="https://..." value={settingsForm.testWebhookUrl} onChange={(e) => setSettingsForm({...settingsForm, testWebhookUrl: e.target.value})} className={`${inputClass} pl-9 bg-white`} />
                                 </div>
                             </div>
                        </div>
                    )}
                 </div>
              </div>
           </div>

           <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
               <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:text-black font-medium transition-colors">Cancelar</button>
               <button type="submit" disabled={!settingsForm.workflowId || isSaving} className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-md transition-all flex items-center gap-2 disabled:bg-[#e0caff] disabled:cursor-not-allowed">
                 {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                 {isSaving ? 'Salvando...' : 'Salvar Alterações'}
               </button>
           </div>
        </form>

        {onDelete && isAdmin && (
            <div className="mt-8 pt-8 border-t border-gray-100 animate-fade-in">
                <h3 className="text-xs font-bold text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Zona de Perigo
                </h3>
                <div className="border border-red-100 bg-red-50/50 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h4 className="text-sm font-bold text-gray-900">Excluir Agente</h4>
                        <p className="text-xs text-gray-500 mt-1">Esta ação excluirá permanentemente o agente <strong>{agent.name}</strong>.</p>
                    </div>
                    <button type="button" onClick={onDelete} className="px-4 py-2 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-md hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 shrink-0">
                        <Trash2 className="w-4 h-4" /> Excluir Agente
                    </button>
                </div>
            </div>
        )}
      </div>
  );
};
