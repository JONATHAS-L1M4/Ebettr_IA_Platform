
import React, { useState, useEffect, useRef } from 'react';
import { Agent, ConfigSection, AccessRule, Company } from '../../types';
import { ArrowLeft, Brain, Zap, Search, Loader2, CheckCircle2, RefreshCw, Key, ShieldCheck, Globe, User, Mail, Phone, ChevronDown, AlertCircle, Database, AlertTriangle } from '../ui/Icons';
import { AccessManager } from '../inputs/AccessManager';
import { fetchN8nWorkflows, N8nWorkflow } from '../../services/n8nService';
import { companyService } from '../../services/companyService';
import { useNotification } from '../../context/NotificationContext';
import Toggle from '../ui/Toggle';

interface CreateAgentFormProps {
  existingAgents: Agent[];
  onCreate: (agent: Agent) => void;
  onCancel: () => void;
}

export const CreateAgentForm: React.FC<CreateAgentFormProps> = ({ existingAgents, onCreate, onCancel }) => {
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client: '',
    companyId: '', // Novo campo para ID da empresa
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
  const [fetchError, setFetchError] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const companyDropdownRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

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
    loadWorkflows();
    
    const loadCompanies = async () => {
        try {
            const data = await companyService.list();
            setCompanies(data);
        } catch (e) {
            console.warn('Failed to load company suggestions', e);
        }
    };
    loadCompanies();
  }, []);

  useEffect(() => {
    if (descriptionRef.current) {
        descriptionRef.current.style.height = 'auto';
        descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
    }
  }, [formData.description]);

  const loadWorkflows = async (isManualRefresh = false) => {
    setIsLoadingWorkflows(true);
    setFetchError(false);
    try {
        const workflows = await fetchN8nWorkflows(isManualRefresh);
        setN8nWorkflows(workflows);
        if (isManualRefresh) {
            addNotification('success', 'Lista atualizada', `${workflows.length} workflows encontrados.`);
        }
    } catch (e: any) {
        setFetchError(true);
        if (isManualRefresh) {
            addNotification('error', 'Erro ao carregar', e.message);
        }
    } finally {
        setIsLoadingWorkflows(false);
    }
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

  const filteredWorkflows = n8nWorkflows.filter(wf => {
    const term = String(formData.workflowName || '').toLowerCase();
    const name = String(wf.name || '').toLowerCase();
    const id = String(wf.id || '').toLowerCase();
    
    // Check if workflow is already used by another agent
    const isUsed = existingAgents.some(agent => getAgentWorkflowId(agent) === wf.id);
    
    return !isUsed && (name.includes(term) || id.includes(term));
  });

  const filteredCompanies = companies.filter(c => 
      c.name.toLowerCase().includes(formData.client.toLowerCase())
  );

  const handleSelectWorkflow = (wf: N8nWorkflow) => {
      setFormData(prev => ({
          ...prev,
          workflowName: wf.name,
          workflowId: wf.id
      }));
      setIsDropdownOpen(false);
  };

  const handleSelectCompany = (comp: Company) => {
      setFormData(prev => ({
          ...prev,
          client: comp.name,
          companyId: comp.id,
          email: comp.contactEmail || '',
          phone: comp.contactPhone || ''
      }));
      setIsCompanyDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameExists = existingAgents.some(a => 
        a.name.trim().toLowerCase() === formData.name.trim().toLowerCase()
    );
    if (nameExists) {
        addNotification('error', 'Nome Duplicado', 'Já existe um agente com este nome. Por favor, escolha outro.');
        return;
    }

    if (formData.workflowId) {
        const workflowUsed = existingAgents.some(a => getAgentWorkflowId(a) === formData.workflowId);
        if (workflowUsed) {
            addNotification('error', 'Workflow em Uso', 'Este workflow já está vinculado a outro agente.');
            return;
        }
    }

    if (formData.client) {
        const companyExists = companies.some(c => c.name.toLowerCase() === formData.client.trim().toLowerCase());
        if (!companyExists) {
            addNotification('error', 'Empresa não encontrada', 'Apenas empresas previamente cadastradas podem ser vinculadas. Por favor, cadastre a empresa primeiro.');
            return;
        }
        if (!formData.companyId) {
            const found = companies.find(c => c.name.toLowerCase() === formData.client.trim().toLowerCase());
            if (found) formData.companyId = found.id;
        }
    }

    setIsSubmitting(true);

    const configSections: ConfigSection[] = [];
    
    if (formData.workflowId) {
        configSections.push({
            id: 'system_integration',
            title: 'Integração de Sistema',
            description: 'Configuração interna do workflow.',
            icon: 'database',
            fields: [
                { id: 'n8n_workflow_name', label: 'Nome do Workflow', type: 'text', value: formData.workflowName, required: true },
                { id: 'n8n_workflow_id', label: 'ID do Workflow', type: 'text', value: formData.workflowId, required: true },
            ]
        });
    }

    const accessEmailsString = formData.accessControl.map(r => r.email).join(', ');

    const newAgent: Agent = {
      id: '',
      name: formData.name,
      description: formData.description,
      client: formData.client,
      companyId: formData.companyId,
      workflowId: formData.workflowId,
      email: formData.email,
      phone: formData.phone,
      active: false,
      avatarUrl: '',
      lastActive: '',
      configSections: configSections,
      accessControl: formData.accessControl,
      accessEmails: accessEmailsString,
      hasTestMode: formData.hasTestMode,
      testWebhookUrl: formData.testWebhookUrl,
      ragEnabled: formData.ragEnabled,
      ragUploadUrl: formData.ragUploadUrl,
      rag_storage_limit_mb: formData.rag_storage_limit_mb,
      maintenance: formData.maintenance,
      allowAudio: true, // Sempre habilitado
      allowAttachments: true // Sempre habilitado
    };

    try {
        await onCreate(newAgent);
        addNotification('success', 'Agente criado', `O agente "${newAgent.name}" foi criado e vinculado ao workflow.`);
    } catch (e) {
        setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2 bg-background border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background text-sm placeholder:text-muted-foreground shadow-sm text-foreground";
  const readOnlyClass = "bg-muted text-muted-foreground cursor-not-allowed select-none focus-visible:ring-0 border-border";

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
           <button 
             onClick={onCancel}
             className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-ring/40 hover:text-foreground text-muted-foreground transition-colors bg-card"
           >
             <ArrowLeft className="w-4 h-4" />
           </button>
           <div>
             <h1 className="text-xl font-bold text-foreground">Novo Agente</h1>
             <p className="text-sm text-muted-foreground font-light">
                Defina a identidade e o cérebro (Workflow) do agente.
             </p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-panel rounded-lg border border-border shadow-sm overflow-visible">
           <div className="p-8 flex flex-col gap-8">
              
              <div className="flex flex-col gap-4">
                 <h3 className="text-xs font-bold text-foreground uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                    <Brain className="w-3 h-3" /> Identidade
                 </h3>
                 
                 <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Nome da Automação</label>
                        <span className="text-[10px] text-muted-foreground font-mono">{formData.name.length}/60</span>
                    </div>
                    <input 
                        type="text" 
                        required
                        maxLength={60}
                        placeholder="Ex: Agente de Suporte L1"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className={inputClass}
                        disabled={isSubmitting}
                    />
                 </div>

                 <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Função da Automação</label>
                        <span className="text-[10px] text-muted-foreground font-mono">{formData.description.length}/300</span>
                    </div>
                    <textarea 
                        ref={descriptionRef}
                        required
                        maxLength={300}
                        rows={3}
                        placeholder="Descreva o propósito deste agente..."
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className={`${inputClass} resize-none overflow-hidden`}
                        style={{ minHeight: '80px' }}
                        disabled={isSubmitting}
                    />
                 </div>

                 <div className="pt-2 flex flex-col gap-4">
                    <div className="flex flex-col gap-1" ref={companyDropdownRef}>
                        <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Nome Cliente / Empresa</label>
                        <div className="relative">
                            <div className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none">
                                <User className="w-4 h-4" />
                            </div>
                            <input 
                                type="text"
                                placeholder="Selecione ou digite..."
                                value={formData.client}
                                onChange={e => {
                                    setFormData({...formData, client: e.target.value});
                                    setIsCompanyDropdownOpen(true);
                                }}
                                onFocus={() => setIsCompanyDropdownOpen(true)}
                                className={`${inputClass} pl-9`}
                                disabled={isSubmitting}
                            />
                            {isCompanyDropdownOpen && filteredCompanies.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-scale-in">
                                    {filteredCompanies.map(comp => (
                                        <button
                                            key={comp.id}
                                            type="button"
                                            onClick={() => handleSelectCompany(comp)}
                                            className="w-full text-left px-4 py-2 hover:bg-muted/40 text-sm text-foreground flex items-center justify-between transition-colors border-b border-border last:border-0"
                                        >
                                            <span className="font-medium">{comp.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 ml-1">Apenas empresas cadastradas são permitidas.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-foreground uppercase tracking-wide">E-mail de Contato</label>
                            <div className="relative">
                                <div className="absolute left-3 top-2.5 text-muted-foreground">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <input 
                                    type="email"
                                    value={formData.email}
                                    readOnly
                                    tabIndex={-1}
                                    placeholder={formData.email ? "" : "Vínculo automático"}
                                    className={`${inputClass} pl-9 ${readOnlyClass}`}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Telefone</label>
                            <div className="relative">
                                <div className="absolute left-3 top-2.5 text-muted-foreground">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <input 
                                    type="tel"
                                    value={formData.phone}
                                    readOnly
                                    tabIndex={-1}
                                    placeholder={formData.phone ? "" : "Vínculo automático"}
                                    className={`${inputClass} pl-9 ${readOnlyClass}`}
                                />
                            </div>
                        </div>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col gap-4">
                 <h3 className="text-xs font-bold text-foreground uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                    <Key className="w-3 h-3" /> Gestão de Acesso
                 </h3>
                 
                 <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-4 h-4 text-muted-foreground" /> 
                        <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Usuários Permitidos</span>
                    </div>
                    
                    <AccessManager 
                        rules={formData.accessControl}
                        onChange={(rules) => setFormData({...formData, accessControl: rules})}
                        selectedCompany={formData.client}
                    />
                 </div>
              </div>

              <div className="flex flex-col gap-4">
                 <h3 className="text-xs font-bold text-foreground uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                    <Zap className="w-3 h-3" /> Cérebro (Workflow)
                 </h3>
                 
                 <div className="flex flex-col gap-1 relative z-50" ref={dropdownRef}>
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Selecionar Workflow</label>
                        <button 
                            type="button"
                            onClick={() => loadWorkflows(true)}
                            disabled={isLoadingWorkflows}
                            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors disabled:opacity-50"
                            title="Escanear novos workflows"
                        >
                           <RefreshCw className={`w-3 h-3 ${isLoadingWorkflows ? 'animate-spin' : ''}`} />
                           Atualizar
                        </button>
                    </div>
                    <div className="relative">
                        <input 
                            type="text"
                            placeholder="Buscar workflow por nome ou ID..."
                            value={formData.workflowName}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, workflowName: e.target.value, workflowId: '' }));
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            className={`${inputClass} pr-8 ${formData.workflowId ? 'font-bold text-foreground' : ''}`}
                            disabled={isSubmitting}
                        />
                        <div className="absolute right-3 top-2.5 text-muted-foreground">
                            {isLoadingWorkflows ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </div>

                        {isDropdownOpen && (
                            <div className="mt-1 bg-popover border border-border rounded-lg shadow-sm max-h-56 overflow-y-auto animate-scale-in w-full">
                                {fetchError && (
                                    <div className="p-3 text-center text-destructive text-xs flex items-center justify-center gap-2">
                                        <AlertCircle className="w-3 h-3" /> Erro ao carregar.
                                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); loadWorkflows(true); }} className="underline hover:text-destructive font-bold">Tentar</button>
                                    </div>
                                )}
                                
                                {!fetchError && !isLoadingWorkflows && filteredWorkflows.length === 0 && (
                                    <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                                        Nenhum workflow encontrado.
                                    </div>
                                )}

                                {!fetchError && !isLoadingWorkflows && filteredWorkflows.length > 0 && filteredWorkflows.map(wf => (
                                        <button
                                            key={wf.id}
                                            type="button"
                                            onClick={() => handleSelectWorkflow(wf)}
                                            className="w-full text-left px-4 py-2 hover:bg-muted/40 flex items-center justify-between group transition-colors border-b border-border last:border-0"
                                        >
                                            <div className="flex flex-col min-w-0 pr-3">
                                                <span className="text-sm text-foreground group-hover:text-foreground font-medium truncate">
                                                    {wf.name}
                                                </span>
                                                <span className="text-[9px] text-muted-foreground font-mono truncate">
                                                    #{wf.id}
                                                </span>
                                            </div>
                                            {wf.active ? (
                                                <span className="text-[9px] font-bold text-foreground bg-muted/70 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                                    Ativo
                                                </span>
                                            ) : (
                                                <span className="text-[9px] font-bold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                                    Desativado
                                                </span>
                                            )}
                                        </button>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {formData.workflowId && (
                        <div className="mt-2 text-[10px] text-muted-foreground font-mono bg-muted/40 p-2 rounded border border-border flex items-center gap-2">
                            <span className="font-bold text-muted-foreground">ID VINCULADO:</span> {formData.workflowId}
                        </div>
                    )}
                 </div>

                  <div className="pt-4 mt-2 border-t border-border flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                             <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Habilitar Base de Conhecimento (RAG)</label>
                             <p className="text-[10px] text-muted-foreground">Permite que o agente utilize documentos para responder.</p>
                         </div>
                         <Toggle checked={formData.ragEnabled} onChange={(v) => setFormData({...formData, ragEnabled: v})} size="sm" />
                     </div>
                     {formData.ragEnabled && (
                         <div className="flex flex-col gap-4 animate-fade-in bg-muted/30 p-4 rounded-lg border border-border">
                              <div className="flex flex-col gap-1">
                                  <label className="text-xs font-semibold text-foreground uppercase tracking-wide">URL de Upload RAG</label>
                                  <p className="text-[10px] text-muted-foreground mb-1">URL do endpoint para processamento de documentos.</p>
                                  <div className="relative">
                                      <div className="absolute left-3 top-2.5 text-muted-foreground"><Globe className="w-4 h-4" /></div>
                                      <input type="url" placeholder="https://..." value={formData.ragUploadUrl || ''} onChange={(e) => setFormData({...formData, ragUploadUrl: e.target.value})} className={`${inputClass} pl-9 bg-card`} />
                                  </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                  <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Limite de Armazenamento (MB)</label>
                                  <p className="text-[10px] text-muted-foreground mb-1">Capacidade máxima de armazenamento para documentos RAG.</p>
                                  <div className="relative">
                                      <div className="absolute left-3 top-2.5 text-muted-foreground flex items-center h-4"><Database className="w-4 h-4" /></div>
                                      <input 
                                        type="number" 
                                        min={1}
                                        placeholder="Ex: 500" 
                                        value={formData.rag_storage_limit_mb || ''} 
                                        onChange={(e) => setFormData({...formData, rag_storage_limit_mb: parseInt(e.target.value) || 0})} 
                                        className={`${inputClass} pl-9 bg-card`} 
                                      />
                                  </div>
                              </div>
                         </div>
                     )}
                     <div className="flex items-center justify-between">
                         <div>
                            <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Habilitar Testes (Playground)</label>
                            <p className="text-[10px] text-muted-foreground">Permite testar o comportamento do agente em tempo real.</p>
                        </div>
                        <Toggle checked={formData.hasTestMode} onChange={(v) => setFormData({...formData, hasTestMode: v})} size="sm" />
                    </div>

                    {formData.hasTestMode && (
                        <div className="flex flex-col gap-4 animate-fade-in bg-muted/30 p-4 rounded-lg border border-border">
                             <div className="flex flex-col gap-1">
                                 <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Webhook de Teste</label>
                                 <p className="text-[10px] text-muted-foreground mb-1">URL do endpoint de webhook para o modo de teste.</p>
                                 <div className="relative">
                                     <div className="absolute left-3 top-2.5 text-muted-foreground">
                                         <Globe className="w-4 h-4" />
                                     </div>
                                     <input 
                                         type="url"
                                         placeholder="https://..."
                                         value={formData.testWebhookUrl}
                                         onChange={(e) => setFormData({...formData, testWebhookUrl: e.target.value})}
                                         className={`${inputClass} pl-9 bg-card`}
                                         disabled={isSubmitting}
                                     />
                                 </div>
                             </div>
                        </div>
                    )}
                 </div>

              </div>

           </div>

           <div className="p-6 bg-muted/40 border-t border-border flex items-center justify-end gap-3 z-0 relative">
               <button 
                 type="button"
                 onClick={onCancel}
                 disabled={isSubmitting}
                 className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
               >
                 Cancelar
               </button>
               <button 
                 type="submit"
                 disabled={!formData.workflowId || isSubmitting}
                 className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                 Criar Agente
               </button>
           </div>
        </form>
    </div>
  );
};


