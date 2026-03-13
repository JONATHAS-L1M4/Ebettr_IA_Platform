
import React, { useState, useEffect } from 'react';
import { ServerCredential, SupabaseServer } from '../types';
import { Server, Globe, Key, Edit2, Shield, Eye, EyeOff, Save, X, Terminal, CheckCircle2, Search, Loader2, Code, Copy, Database, Zap, Check, AlertTriangle } from '../components/ui/Icons';
import { DashedAddCard } from '../components/ui/DashedAddCard';
import SpotlightCard from '../components/ui/SpotlightCard';
import Toggle from '../components/ui/Toggle';
import { Textarea } from '../components/ui/textarea';
import { useNotification } from '../context/NotificationContext';
import { serverManagementService } from '../services/serverManagementService';
import { supabaseServerService } from '../services/supabaseServerService';
import { DeleteWithCodeModal } from '../components/shared/DeleteWithCodeModal';
import { DangerZoneSection } from '../components/shared/DangerZoneSection';
import DarkPage from '../components/layout/DarkPage';

const inputBaseClass =
  'w-full px-3 py-2 bg-background border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background text-sm placeholder:text-muted-foreground shadow-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50';
const cookieImportClassName =
  'min-h-32 resize-y text-xs font-mono';
const importMetaBadgeClassName =
  'inline-flex min-h-8 items-center rounded-md border border-input bg-background px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground shadow-sm';
const browserIdHeaderNames = new Set([
  'browser-id',
  'x-browser-id',
  'browser_id',
  'x-browser_id',
  'browserid',
  'x-browserid',
]);

const STORAGE_KEY = 'ebettr_servers';

const getServerTabClass = (tab: 'n8n' | 'supabase', isActive: boolean) =>
    [
        'flex-1 sm:flex-none flex h-full items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all duration-200 ease-out',
        tab === 'n8n'
            ? isActive
                ? 'bg-[#ea4b71]/30 text-foreground ring-1 ring-[#ea4b71]/35 shadow-sm'
                : 'bg-[#ea4b71]/10 text-muted-foreground hover:bg-[#ea4b71]/16 hover:text-foreground'
            : isActive
                ? 'bg-[#3ecf8e]/30 text-foreground ring-1 ring-[#3ecf8e]/35 shadow-sm'
                : 'bg-[#3ecf8e]/10 text-muted-foreground hover:bg-[#3ecf8e]/16 hover:text-foreground'
    ].join(' ');

interface AdminServersProps {
    onLogout?: () => void;
}

const ServerCardSkeleton = () => (
  <div className="h-full min-h-[200px] border border-border rounded-xl bg-card p-6 flex flex-col justify-between animate-pulse">
      <div className="flex justify-between items-start mb-3">
          <div className="w-10 h-10 bg-muted rounded-lg"></div>
          <div className="w-8 h-5 bg-muted rounded-full"></div>
      </div>
      <div className="flex-1 flex flex-col justify-start mt-2 space-y-3">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-3 bg-muted rounded w-2/3"></div>
          <div className="flex gap-2 mt-auto">
              <div className="h-6 w-20 bg-muted rounded"></div>
              <div className="h-6 w-16 bg-muted rounded"></div>
          </div>
      </div>
      <div className="mt-4 pt-3 border-t border-border flex justify-between">
          <div className="h-3 bg-muted rounded w-16"></div>
          <div className="h-3 bg-muted rounded w-12"></div>
      </div>
  </div>
);

export const AdminServers: React.FC<AdminServersProps> = ({ onLogout }) => {
  const { addNotification } = useNotification();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'n8n' | 'supabase'>('n8n');

  // N8N State
  const [servers, setServers] = useState<ServerCredential[]>([]);
  
  // Supabase State
  const [supabaseServers, setSupabaseServers] = useState<SupabaseServer[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverTestStatus, setServerTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [serverTestMessage, setServerTestMessage] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal de Exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form State (N8N)
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formCookie, setFormCookie] = useState('');
  const [formBrowserId, setFormBrowserId] = useState('');

  // Form State (Supabase)
  const [supaFormName, setSupaFormName] = useState('');
  const [supaFormUrl, setSupaFormUrl] = useState('');
  const [supaFormApiKey, setSupaFormApiKey] = useState('');

  // Cookie import state
  const [showCookieImport, setShowCookieImport] = useState(false);
  const [cookieImportInput, setCookieImportInput] = useState('');

  // Visibility States (Presence)
  const [showKey, setShowKey] = useState(false);
  const [showCookie, setShowCookie] = useState(false);
  const [showBrowserId, setShowBrowserId] = useState(false);

  // Visibility States (Masking)
  const [revealCookie, setRevealCookie] = useState(false);
  const [revealBrowserId, setRevealBrowserId] = useState(false);

  const isFetchingRef = React.useRef(false);

  const getServerTestLabel = (testKey: string) => {
      if (testKey === 'api') return 'API';
      if (testKey === 'browser') return 'Browser';
      return testKey;
  };

  const buildServerTestMessage = (payload: any) => {
      const tests = payload?.tests;
      if (!tests || typeof tests !== 'object') {
          return typeof payload?.message === 'string' && payload.message
              ? payload.message
              : 'Servidor n8n validado com sucesso.';
      }

      const parts = Object.entries(tests)
          .map(([key, value]: [string, any]) => {
              const label = getServerTestLabel(key);
              const statusCode = value?.status_code ? ` (${value.status_code})` : '';
              const message = value?.message || (value?.ok ? 'OK' : 'Falhou');
              return `${label}${statusCode}: ${message}`;
          })
          .filter(Boolean);

      return parts.join(' | ') || payload?.message || 'Servidor n8n validado com sucesso.';
  };

  const buildServerTestErrorMessage = (error: any) => {
      const detail = error?.detail;
      const errors = Array.isArray(detail?.errors) ? detail.errors : [];

      if (errors.length > 0) {
          return errors
              .map((item: any) => {
                  const label = getServerTestLabel(item?.test || 'erro');
                  const statusCode = item?.status_code ? ` (${item.status_code})` : '';
                  const message = item?.message || item?.detail || detail?.message || error?.message || 'Falha ao validar.';
                  return `${label}${statusCode}: ${message}`;
              })
              .join(' | ');
      }

      if (detail?.tests) {
          return buildServerTestMessage(detail);
      }

      return detail?.message || error?.message || 'Falha ao testar servidor.';
  };

  const clearServerTestFeedback = () => {
      if (serverTestStatus !== 'idle' || serverTestMessage) {
          setServerTestStatus('idle');
          setServerTestMessage('');
      }
  };

  const scheduleServerTestReset = () => {
      window.setTimeout(() => {
          setServerTestStatus('idle');
          setServerTestMessage('');
      }, 4000);
  };

  const handleTestServer = async () => {
      if (!formUrl.trim()) {
          setServerTestStatus('error');
          setServerTestMessage('Preencha a URL_N8N.');
          addNotification('warning', 'URL obrigatoria', 'Preencha a URL_N8N antes de testar.');
          scheduleServerTestReset();
          return;
      }

      if (!formCookie.trim()) {
          setServerTestStatus('error');
          setServerTestMessage('Preencha o Cookie para o teste 1.');
          addNotification('warning', 'Cookie obrigatorio', 'Preencha o Cookie antes de testar.');
          scheduleServerTestReset();
          return;
      }

      if (!formBrowserId.trim()) {
          setServerTestStatus('error');
          setServerTestMessage('Preencha o Browser ID para o teste 1.');
          addNotification('warning', 'Browser ID obrigatorio', 'Preencha o Browser ID antes de testar.');
          scheduleServerTestReset();
          return;
      }

      if (!formApiKey.trim()) {
          setServerTestStatus('error');
          setServerTestMessage('Preencha a X_N8N_API_KEY para o teste 2.');
          addNotification('warning', 'API Key obrigatoria', 'Preencha a X_N8N_API_KEY antes de testar.');
          scheduleServerTestReset();
          return;
      }

      setServerTestStatus('testing');
      setServerTestMessage('');

      try {
          const result = await serverManagementService.test({
              url: formUrl,
              apiKey: formApiKey,
              cookie: formCookie,
              browserId: formBrowserId,
          });

          const successMessage =
              (typeof result === 'string' && result.trim()) ||
              buildServerTestMessage(result);

          setServerTestStatus('success');
          setServerTestMessage(successMessage);
          addNotification('success', 'Teste concluido', successMessage);
          scheduleServerTestReset();
      } catch (error: any) {
          const failureMessage = buildServerTestErrorMessage(error);
          setServerTestStatus('error');
          setServerTestMessage(failureMessage);
          addNotification('error', 'Teste falhou', failureMessage);
          scheduleServerTestReset();
      }
  };
  
  const fetchServers = async () => {
      if (isFetchingRef.current) return;
      
      setIsLoading(true);
      isFetchingRef.current = true;
      try {
          if (activeTab === 'n8n') {
              const data = await serverManagementService.list();
              setServers(data);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          } else {
              const data = await supabaseServerService.list();
              setSupabaseServers(data);
          }
      } catch (error: any) {
          console.error("Failed to fetch servers", error);
          
          if (activeTab === 'n8n') {
              // Fallback to local storage for N8N
              const saved = localStorage.getItem(STORAGE_KEY);
              if (saved) {
                  setServers(JSON.parse(saved));
                  if (!error.message.includes('Sessão expirada')) {
                      addNotification('warning', 'Modo Offline', 'Exibindo dados em cache local.');
                  }
              } else {
                  addNotification('error', 'Erro de Conexão', error.message || 'Não foi possível carregar a lista do servidor.');
              }
          } else {
              addNotification('error', 'Erro de Conexão', error.message || 'Não foi possível carregar a lista de servidores Supabase.');
          }
      } finally {
          setIsLoading(false);
          isFetchingRef.current = false;
      }
  };

  useEffect(() => {
    fetchServers();
  }, [activeTab]);

  const resetForm = () => {
    // N8N
    setFormName('');
    setFormUrl('');
    setFormApiKey('');
    setFormCookie('');
    setFormBrowserId('');
    
    // Supabase
    setSupaFormName('');
    setSupaFormUrl('');
    setSupaFormApiKey('');

    setEditingId(null);
    
    setShowKey(false);
    setShowCookie(false);
    setShowBrowserId(false);
    
    setRevealCookie(false);
    setRevealBrowserId(false);
    setServerTestStatus('idle');
    setServerTestMessage('');

    setIsFormOpen(false);
    setIsDeleteModalOpen(false);
    setShowCookieImport(false);
    setCookieImportInput('');
  };

  const handleEdit = (server: ServerCredential | SupabaseServer) => {
    if (activeTab === 'n8n') {
        const n8nServer = server as ServerCredential;
        setFormName(n8nServer.name);
        setFormUrl(n8nServer.url);
        setFormApiKey(n8nServer.apiKey);
        setFormCookie(n8nServer.cookie);
        setFormBrowserId(n8nServer.browserId);
        setEditingId(n8nServer.id);
        
        // Auto-show fields if they have content
        if (n8nServer.cookie) setShowCookie(true);
        if (n8nServer.browserId) setShowBrowserId(true);
    } else {
        const supaServer = server as SupabaseServer;
        setSupaFormName(supaServer.name);
        setSupaFormUrl(supaServer.url);
        setSupaFormApiKey(supaServer.api_key);
        setEditingId(supaServer.id);
    }
    
    // Reset reveal states on open
    setRevealCookie(false);
    setRevealBrowserId(false);
    setShowKey(false);
    setServerTestStatus('idle');
    setServerTestMessage('');

    setIsFormOpen(true);
  };

  const handleToggleActive = async (server: ServerCredential | SupabaseServer, isActive: boolean) => {
      if (activeTab === 'n8n') {
          const n8nServer = server as ServerCredential;
          // Atualização Otimista
          const originalServers = [...servers];
          setServers(prev => prev.map(s => s.id === n8nServer.id ? { ...s, isActive } : s));

          try {
              // O service já mapeia isActive -> is_active
              await serverManagementService.update(n8nServer.url, { isActive });
              addNotification('success', 'Status Atualizado', `${n8nServer.name} agora está ${isActive ? 'ativo' : 'inativo'}.`);
          } catch (error: any) {
              // Reverte em caso de erro
              setServers(originalServers);
              addNotification('error', 'Erro ao atualizar', error.message);
          }
      } else {
          const supaServer = server as SupabaseServer;
          // Atualização Otimista
          const originalServers = [...supabaseServers];
          setSupabaseServers(prev => prev.map(s => s.id === supaServer.id ? { ...s, is_active: isActive } : s));

          try {
              await supabaseServerService.update(supaServer.id, { is_active: isActive });
              addNotification('success', 'Status Atualizado', `${supaServer.name} agora está ${isActive ? 'ativo' : 'inativo'}.`);
          } catch (error: any) {
              // Reverte em caso de erro
              setSupabaseServers(originalServers);
              addNotification('error', 'Erro ao atualizar', error.message);
          }
      }
  };

  const handleConfirmDelete = async () => {
      if (!editingId) return;
      
      setIsDeleteModalOpen(false);
      setIsSubmitting(true);
      try {
          if (activeTab === 'n8n') {
              // Tenta encontrar o servidor original para pegar a URL correta (chave primária)
              const originalServer = servers.find(s => s.id === editingId);
              
              // Se não encontrar (ex: desincronia), usa a URL do formulário como fallback
              // A API usa a URL como identificador para exclusão
              const identifier = originalServer ? originalServer.url : (formUrl || editingId || '');

              await serverManagementService.delete(identifier);
              addNotification('info', 'Servidor removido', `O servidor ${formName} foi excluído.`);
          } else {
              await supabaseServerService.delete(editingId);
              addNotification('info', 'Servidor removido', `O servidor ${supaFormName} foi excluído.`);
          }
          await fetchServers();
          resetForm();
      } catch (error: any) {
          addNotification('error', 'Erro', error.message);
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'n8n') {
        if (!formName || !formUrl || !formApiKey) {
            addNotification('error', 'Campos obrigatórios', 'Preencha Nome, URL e API Key.');
            return;
        }

        setIsSubmitting(true);

        const payload = {
            name: formName,
            url: formUrl,
            apiKey: formApiKey,
            cookie: formCookie,
            browserId: formBrowserId,
            isActive: true
        };

        try {
            if (editingId) {
                const originalServer = servers.find(s => s.id === editingId);
                const identifier = originalServer ? originalServer.url : (formUrl || editingId || '');

                await serverManagementService.update(identifier, payload);
                addNotification('success', 'Servidor atualizado', `As credenciais de ${formName} foram salvas.`);
            } else {
                await serverManagementService.create(payload);
                addNotification('success', 'Servidor adicionado', `${formName} foi registrado na nuvem.`);
            }
            await fetchServers();
            resetForm();
        } catch (error: any) {
            addNotification('error', 'Erro ao salvar', error.message);
        } finally {
            setIsSubmitting(false);
        }
    } else {
        // SUPABASE SUBMIT
        if (!supaFormName || !supaFormUrl || !supaFormApiKey) {
            addNotification('error', 'Campos obrigatórios', 'Preencha Nome, URL e API Key.');
            return;
        }

        setIsSubmitting(true);

        const payload = {
            name: supaFormName,
            url: supaFormUrl,
            api_key: supaFormApiKey,
            is_active: true
        };

        try {
            if (editingId) {
                await supabaseServerService.update(editingId, payload);
                addNotification('success', 'Servidor atualizado', `As credenciais de ${supaFormName} foram salvas.`);
            } else {
                await supabaseServerService.create(payload);
                addNotification('success', 'Servidor RAG adicionado', `${supaFormName} foi registrado.`);
            }
            
            await fetchServers();
            resetForm();
        } catch (error: any) {
            addNotification('error', 'Erro ao salvar', error.message);
        } finally {
            setIsSubmitting(false);
        }
    }
  };

  const handleProcessCookieImport = () => {
      const rawInput = cookieImportInput.trim();
      if (!rawInput) return;

      const looksLikeCurl = /(^|\s)curl(?:\.exe)?(\s|$)/i.test(rawInput);

      const appendCookieStringToMap = (cookieString: string, target: Map<string, string>) => {
          cookieString
              .split(';')
              .map((part) => part.trim())
              .filter(Boolean)
              .forEach((part) => {
                  const separatorIndex = part.indexOf('=');
                  if (separatorIndex <= 0) return;
                  const name = part.slice(0, separatorIndex).trim();
                  const value = part.slice(separatorIndex + 1).trim();
                  if (!name) return;
                  target.set(name, value);
              });
      };

      const extractCurlValue = (source: string, pattern: RegExp) => {
          const values: string[] = [];
          let match: RegExpExecArray | null;

          while ((match = pattern.exec(source)) !== null) {
              const rawValue = match[1] ?? match[2] ?? match[3] ?? '';
              if (rawValue) values.push(rawValue.trim());
          }

          return values;
      };

      if (looksLikeCurl) {
          const normalizedCurl = rawInput
              .replace(/\\\r?\n/g, ' ')
              .replace(/`\r?\n/g, ' ')
              .replace(/\^\r?\n/g, ' ')
              .replace(/\r?\n/g, ' ');

          const headerValues = extractCurlValue(
              normalizedCurl,
              /(?:^|\s)(?:--header|-H)\s*(?:=)?\s*(?:"([^"]*)"|'([^']*)'|([^\s]+))/gi
          );
          const cookieValues = extractCurlValue(
              normalizedCurl,
              /(?:^|\s)(?:--cookie|-b)\s*(?:=)?\s*(?:"([^"]*)"|'([^']*)'|([^\s]+))/gi
          );
          let browserIdFound = '';

          for (const headerLine of headerValues) {
              const separatorIndex = headerLine.indexOf(':');
              if (separatorIndex <= 0) continue;

              const headerName = headerLine.slice(0, separatorIndex).trim().toLowerCase();
              const headerValue = headerLine.slice(separatorIndex + 1).trim();
              if (!headerValue) continue;

              if (!browserIdFound && browserIdHeaderNames.has(headerName)) {
                  browserIdFound = headerValue;
              }
          }

          const cookieFound = cookieValues
              .map((value) => value.trim())
              .filter((value) => value.includes('='))
              .join('; ');

          if (!cookieFound && !browserIdFound) {
              addNotification('warning', 'Nada encontrado', 'No cURL colado nao foi encontrado Cookie nem Browser ID.');
              return;
          }

          if (cookieFound) {
              setFormCookie(cookieFound);
              setShowCookie(true);
          }
          if (browserIdFound) {
              setFormBrowserId(browserIdFound);
              setShowBrowserId(true);
          }

          const imported: string[] = [];
          if (cookieFound) imported.push('Cookie');
          if (browserIdFound) imported.push('Browser ID');
          addNotification('success', 'Processado', `${imported.join(' e ')} importado(s) via cURL.`);
          setShowCookieImport(false);
          setCookieImportInput('');
          return;
      }

      const cookieMap = new Map<string, string>();
      let browserIdFound = '';
      rawInput
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .forEach((line) => {
              const separatorIndex = line.indexOf(':');
              if (separatorIndex > 0) {
                  const key = line.slice(0, separatorIndex).trim().toLowerCase();
                  const value = line.slice(separatorIndex + 1).trim();
                  if (!browserIdFound && browserIdHeaderNames.has(key) && value) {
                      browserIdFound = value;
                      return;
                  }
              }

              const content = line.toLowerCase().startsWith('cookie:')
                  ? line.slice(line.indexOf(':') + 1).trim()
                  : line;

              appendCookieStringToMap(content, cookieMap);
          });

      const cookieFound = Array.from(cookieMap.entries())
          .map(([name, value]) => `${name}=${value}`)
          .join('; ');

      if (!cookieFound && !browserIdFound) {
          addNotification('warning', 'Nada encontrado', 'Cole Cookie em name=value ou Browser ID em browser-id: valor.');
          return;
      }

      if (cookieFound) {
          setFormCookie(cookieFound);
          setShowCookie(true);
      }
      if (browserIdFound) {
          setFormBrowserId(browserIdFound);
          setShowBrowserId(true);
      }

      const imported: string[] = [];
      if (cookieFound) imported.push('Cookie');
      if (browserIdFound) imported.push('Browser ID');
      addNotification('success', 'Processado', `${imported.join(' e ')} importado(s) com sucesso.`);
      setShowCookieImport(false);
      setCookieImportInput('');
  };

  // Filter Logic
  const filteredServers = servers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- RENDER FORM ---
  if (isFormOpen) {
    return (
      <DarkPage className="min-h-[calc(100vh-4rem)]">
      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-3px); } 40% { transform: translateX(3px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
      `}</style>
      <div className="max-w-3xl mx-auto animate-fade-in pb-12">
        <div className="flex items-center gap-4 mb-8">
           <button 
             onClick={resetForm}
             className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-border hover:text-foreground text-muted-foreground transition-colors bg-card"
           >
             <X className="w-4 h-4" />
           </button>
           <div>
             <h1 className="text-xl font-bold text-foreground">
                {editingId ? 'Editar Servidor' : 'Novo Servidor'} {activeTab === 'supabase' ? 'RAG' : ''}
             </h1>
             <p className="text-sm text-muted-foreground font-light">
                {activeTab === 'n8n' 
                    ? 'Configure as credenciais de acesso ao n8n.' 
                    : 'Configure as credenciais do Supabase para RAG.'}
             </p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-panel rounded-lg border border-border shadow-sm overflow-hidden">
           
           {/* Cookie import section - only for N8N */}
           {activeTab === 'n8n' && (
               <div className="border-b border-border bg-muted p-4">
                   <button 
                       type="button"
                       onClick={() => setShowCookieImport(!showCookieImport)}
                       className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wide transition-colors"
                   >
                       <Shield className="w-4 h-4" />
                       {showCookieImport ? 'Ocultar Importacao' : 'Importar Cookie / Browser ID'}
                   </button>
                   
                   {showCookieImport && (
                       <div className="mt-3 animate-fade-in">
                           <div className="mb-3 rounded-md border border-input bg-background p-3 shadow-sm">
                               <p className="text-[10px] text-muted-foreground leading-relaxed">
                                   Cole um <strong>cURL</strong> para extrair <strong>Cookie</strong> e/ou <strong>Browser ID</strong>,<br/>
                                   para cookies via cURL o sistema considera apenas <strong>-b/--cookie</strong>.<br/>
                                   Voce tambem pode colar manualmente <strong>Cookie</strong> em <strong>name=value</strong> e <strong>Browser ID</strong> em <strong>browser-id: valor</strong>.
                               </p>
                           </div>
                           <div className="mb-3 flex flex-wrap items-center gap-2">
                               <span className={importMetaBadgeClassName}>
                                   input
                               </span>
                               <span className={importMetaBadgeClassName}>
                                   curl
                               </span>
                               <span className={importMetaBadgeClassName}>
                                   cookie
                               </span>
                               <span className={importMetaBadgeClassName}>
                                   browser-id
                               </span>
                           </div>
                           <Textarea
                               value={cookieImportInput}
                               onChange={(e) => setCookieImportInput(e.target.value)}
                               className={`w-full ${cookieImportClassName}`}
                               placeholder={`curl 'https://n8n.seu-dominio.com/api/v1/workflows' -b 'n8n-auth=abc123; _ga=xyz' -H 'browser-id: 3f8d42c2-xxxx'\n\nn8n-auth=abc123; _ga=xyz\nbrowser-id: 3f8d42c2-xxxx`}
                            />
                           <div className="flex justify-end mt-2">
                               <button 
                                   type="button"
                                   onClick={handleProcessCookieImport}
                                   disabled={!cookieImportInput}
                                   className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground shadow-sm transition-all hover:border-border hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                               >
                                   <Code className="w-3 h-3" /> Processar Importacao
                               </button>
                           </div>
                       </div>
                   )}
               </div>
           )}

           <div className="p-8 space-y-6">
              
              {/* --- N8N FIELDS --- */}
              {activeTab === 'n8n' && (
                  <>
                    {/* Identity */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome Identificador</label>
                        <input 
                            type="text" 
                            value={formName} 
                            onChange={e => setFormName(e.target.value)} 
                            className={inputBaseClass}
                            placeholder="Ex: Servidor Produção #1"
                            autoFocus
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* URL */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5" /> URL_N8N
                        </label>
                        <input 
                            type="url" 
                            value={formUrl} 
                            onChange={e => {
                                setFormUrl(e.target.value);
                                clearServerTestFeedback();
                            }} 
                            className={inputBaseClass}
                            placeholder="https://n8n.seu-dominio.com"
                            disabled={isSubmitting || serverTestStatus === 'testing'}
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Use o botao <code>Testar</code> para validar healthz e credenciais antes de salvar.
                        </p>
                    </div>

                    {/* API Key */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                            <Key className="w-3.5 h-3.5" /> X_N8N_API_KEY
                        </label>
                        <div className="relative">
                            <input 
                                type={showKey ? "text" : "password"} 
                                value={formApiKey} 
                                onChange={e => {
                                    setFormApiKey(e.target.value);
                                    clearServerTestFeedback();
                                }} 
                                className={`${inputBaseClass} pr-10 font-mono`}
                                placeholder="n8n_api_..."
                                disabled={isSubmitting || serverTestStatus === 'testing'}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                            >
                                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Cookie */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5" /> Cookie
                            </label>
                        </div>
                        
                        <div className="relative animate-fade-in">
                            <input 
                                type={revealCookie ? "text" : "password"}
                                value={formCookie} 
                                onChange={e => {
                                    setFormCookie(e.target.value);
                                    clearServerTestFeedback();
                                }} 
                                className={`${inputBaseClass} pr-10 font-mono text-xs`}
                                placeholder="n8n-auth=..."
                                disabled={isSubmitting || serverTestStatus === 'testing'}
                            />
                            <button 
                                type="button"
                                onClick={() => setRevealCookie(!revealCookie)}
                                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                            >
                                {revealCookie ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Aceita importacao por cURL usando <code>-b/--cookie</code> ou valor direto em <code>name=value</code>.</p>
                    </div>

                    {/* Browser ID */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                <Terminal className="w-3.5 h-3.5" /> Browser ID
                            </label>
                        </div>

                        <div className="relative animate-fade-in">
                            <input 
                                type={revealBrowserId ? "text" : "password"}
                                value={formBrowserId} 
                                onChange={e => {
                                    setFormBrowserId(e.target.value);
                                    clearServerTestFeedback();
                                }} 
                                className={`${inputBaseClass} pr-10 font-mono text-xs`}
                                placeholder="Mozilla/5.0... ou UUID"
                                disabled={isSubmitting || serverTestStatus === 'testing'}
                            />
                            <button 
                                type="button"
                                onClick={() => setRevealBrowserId(!revealBrowserId)}
                                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                            >
                                {revealBrowserId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Preencha manualmente se a sua instancia exigir <code>browser-id</code>.</p>
                    </div>
                  </>
              )}

              {/* --- SUPABASE FIELDS --- */}
              {activeTab === 'supabase' && (
                  <>
                    {/* Identity */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome Identificador</label>
                        <input 
                            type="text" 
                            value={supaFormName} 
                            onChange={e => setSupaFormName(e.target.value)} 
                            className={inputBaseClass}
                            placeholder="Ex: Servidor RAG #1"
                            autoFocus
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* URL */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5" /> URL Supabase
                        </label>
                        <input 
                            type="url" 
                            value={supaFormUrl} 
                            onChange={e => setSupaFormUrl(e.target.value)} 
                            className={inputBaseClass}
                            placeholder="https://seu-projeto.supabase.co"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* API Key */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                            <Key className="w-3.5 h-3.5" /> API Key (Service Role / Anon)
                        </label>
                        <div className="relative">
                            <input 
                                type={showKey ? "text" : "password"} 
                                value={supaFormApiKey} 
                                onChange={e => setSupaFormApiKey(e.target.value)} 
                                className={`${inputBaseClass} pr-10 font-mono`}
                                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                disabled={isSubmitting}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                            >
                                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                  </>
              )}

           </div>

           <div className="p-6 bg-muted border-t border-border flex items-center justify-between gap-3">
               {activeTab === 'n8n' && (
                 <button
                   type="button"
                   onClick={handleTestServer}
                   disabled={isSubmitting || serverTestStatus === 'testing'}
                   title={serverTestMessage || 'Executa os testes de healthz e credenciais.'}
                   className={`h-10 px-4 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 shadow-sm active:scale-95 ${
                     serverTestStatus === 'testing'
                       ? 'bg-muted text-foreground border border-border cursor-wait'
                       : serverTestStatus === 'success'
                         ? 'bg-foreground text-background border border-foreground/40 animate-scale-in'
                         : serverTestStatus === 'error'
                           ? 'bg-red-700 text-red-50 border border-red-600 animate-[shake_0.4s_ease-in-out]'
                           : 'bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                   }`}
                 >
                   {serverTestStatus === 'testing' ? (
                     <Loader2 className="w-3.5 h-3.5 animate-spin" />
                   ) : serverTestStatus === 'success' ? (
                     <Check className="w-3.5 h-3.5" />
                   ) : serverTestStatus === 'error' ? (
                     <AlertTriangle className="w-3.5 h-3.5" />
                   ) : (
                     <Zap className="w-3.5 h-3.5 text-amber-500" />
                   )}
                   <span>
                     {serverTestStatus === 'testing'
                       ? 'Testando'
                       : serverTestStatus === 'success'
                         ? 'Conectado'
                         : serverTestStatus === 'error'
                           ? 'Falhou'
                           : 'Testar'}
                   </span>
                 </button>
               )}
               <div className="ml-auto flex items-center gap-3">
                 <button 
                   type="button"
                   onClick={resetForm}
                   disabled={isSubmitting}
                   className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground shadow-sm transition-all hover:border-border hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                 >
                   Cancelar
                 </button>
                 <button 
                   type="submit"
                   disabled={isSubmitting}
                   className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground shadow-sm transition-all hover:border-border hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                 >
                   {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                   {isSubmitting ? 'Salvando...' : 'Salvar Servidor'}
                 </button>
               </div>
           </div>
        </form>

        {/* DANGER ZONE */}
        {editingId && (
            <DangerZoneSection
                title="Excluir Servidor"
                description={
                    <>
                        Esta ação removerá permanentemente as credenciais de <strong>{activeTab === 'n8n' ? formName : supaFormName}</strong> da nuvem.
                    </>
                }
                actionLabel="Excluir Servidor"
                loadingLabel="Excluindo..."
                onAction={() => setIsDeleteModalOpen(true)}
                disabled={isSubmitting}
                isLoading={isSubmitting}
            />
        )}

        <DeleteWithCodeModal 
            isOpen={isDeleteModalOpen}
            title="Excluir Servidor?"
            description={<>Tem certeza que deseja excluir <strong>{activeTab === 'n8n' ? formName : supaFormName}</strong>? Esta ação é irreversível.</>}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
        />
      </div>
      </DarkPage>
    );
  }

  // --- RENDER LIST ---
  return (
    <DarkPage className="min-h-[calc(100vh-4rem)]">
    <div className="animate-fade-in max-w-7xl mx-auto pb-12">
        
        {/* Header */}
        <div className="flex flex-col gap-4 pb-4 mb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 border border-border rounded-lg flex items-center justify-center text-foreground bg-muted">
                        <Server className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-foreground tracking-tight">
                            Gerenciar Servidores
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5 font-light">
                            Lista de instâncias N8N e credenciais de acesso.
                        </p>
                    </div>
                </div>
                
                <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
                    <div className="flex h-[36px] w-full items-center gap-2 rounded-lg bg-muted/60 p-1 shadow-inner lg:w-fit">
                        <button
                            onClick={() => setActiveTab('n8n')}
                            className={getServerTabClass('n8n', activeTab === 'n8n')}
                            title="Servidores n8n"
                        >
                            <Server className="h-3.5 w-3.5" />
                            N8N
                        </button>
                        <button
                            onClick={() => setActiveTab('supabase')}
                            className={getServerTabClass('supabase', activeTab === 'supabase')}
                            title="Servidores RAG (Supabase)"
                        >
                            <Database className="h-3.5 w-3.5" />
                            Supabase
                        </button>
                    </div>

                    <div className="relative group flex-1 md:w-64">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground group-focus-within:text-foreground">
                            <Search className="w-4 h-4" />
                        </div>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 bg-background border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background text-sm placeholder:text-muted-foreground shadow-sm text-foreground pl-10 h-9" 
                            placeholder="Buscar servidor..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                </div>
            </div>
        </div>

        {/* Loading State */}
        {isLoading && ((activeTab === 'n8n' && servers.length === 0) || (activeTab === 'supabase' && supabaseServers.length === 0)) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                {[1, 2, 3].map((i) => <ServerCardSkeleton key={i} />)}
            </div>
        ) : (
            /* Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                
                {/* N8N SERVERS LIST */}
                {activeTab === 'n8n' && (
                    <>
                        {filteredServers.map(server => (
                            <SpotlightCard 
                                key={server.id} 
                                onClick={() => handleEdit(server)}
                                className={`h-full min-h-[200px] cursor-pointer group border-border hover:border-border ${!server.isActive ? 'opacity-75' : ''}`}
                            >
                                <div className="flex flex-col justify-between h-full p-6">
                                    
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-3">
                                        {/* Icon */}
                                        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors border-border bg-muted text-foreground`}>
                                            <Server className="w-5 h-5" />
                                        </div>
                                        
                                        {/* Toggle in Top Right */}
                                        <div onClick={(e) => e.stopPropagation()} className="relative z-20">
                                            <Toggle 
                                                checked={server.isActive || false}
                                                onChange={(checked) => handleToggleActive(server, checked)}
                                                size="sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 flex flex-col justify-start mt-2">
                                        <div className="mb-1">
                                            <h3 className={`text-sm font-bold tracking-tight truncate ${server.isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                {server.name}
                                            </h3>
                                        </div>
                                        
                                        {/* URL Display */}
                                        <div className="flex items-center gap-1.5 text-muted-foreground mb-3" title={server.url}>
                                            <Globe className="w-3 h-3 shrink-0" />
                                            <span className="text-xs truncate font-mono">{server.url}</span>
                                        </div>

                                        {/* Keys/Info Chips */}
                                        <div className="flex flex-wrap gap-2 mt-auto">
                                            <div className="bg-muted px-2 py-1 rounded border border-border flex items-center gap-1.5 max-w-full">
                                                <Key className="w-3 h-3 text-muted-foreground shrink-0" />
                                                <span className="text-[10px] font-mono text-muted-foreground truncate">••••{server.apiKey.slice(-4)}</span>
                                            </div>
                                            {server.browserId && (
                                                <div className="bg-muted px-2 py-1 rounded border border-border flex items-center gap-1.5 max-w-full">
                                                    <Terminal className="w-3 h-3 text-muted-foreground shrink-0" />
                                                    <span className="text-[10px] font-mono text-muted-foreground truncate">ID Config</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-border">
                                        {server.isActive ? (
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Online</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Inativo</span>
                                            </div>
                                        )}
                                        
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground" title="Sincronizado na nuvem">
                                            <CheckCircle2 className="w-3 h-3" />
                                            <span>Cloud</span>
                                        </div>
                                    </div>
                                </div>
                            </SpotlightCard>
                        ))}

                        <DashedAddCard 
                            label="Adicionar Servidor" 
                            onClick={() => setIsFormOpen(true)} 
                            icon={Server}
                            className="min-h-[200px]"
                        />
                    </>
                )}

                {/* SUPABASE SERVERS LIST */}
                {activeTab === 'supabase' && (
                    <>
                        {supabaseServers.map(server => (
                            <SpotlightCard 
                                key={server.id} 
                                onClick={() => handleEdit(server)}
                                className={`h-full min-h-[200px] cursor-pointer group border-border hover:border-border ${!server.is_active ? 'opacity-75' : ''}`}
                            >
                                <div className="flex flex-col justify-between h-full p-6">
                                    
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-3">
                                        {/* Icon */}
                                        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors border-border bg-muted text-foreground`}>
                                            <Database className="w-5 h-5" />
                                        </div>
                                        
                                        {/* Toggle in Top Right */}
                                        <div onClick={(e) => e.stopPropagation()} className="relative z-20">
                                            <Toggle 
                                                checked={server.is_active || false}
                                                onChange={(checked) => handleToggleActive(server, checked)}
                                                size="sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 flex flex-col justify-start mt-2">
                                        <div className="mb-1">
                                            <h3 className="text-sm font-bold tracking-tight truncate text-foreground">
                                                {server.name}
                                            </h3>
                                        </div>
                                        
                                        {/* URL Display */}
                                        <div className="flex items-center gap-1.5 text-muted-foreground mb-3" title={server.url}>
                                            <Globe className="w-3 h-3 shrink-0" />
                                            <span className="text-xs truncate font-mono">{server.url}</span>
                                        </div>

                                        {/* Info Chips */}
                                        <div className="flex flex-wrap gap-2 mt-auto">
                                            {/* Removed default_table_name display */}
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-border">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <span className="text-[10px]">Criado em {new Date(server.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </SpotlightCard>
                        ))}

                        <DashedAddCard 
                            label="Adicionar Servidor" 
                            onClick={() => setIsFormOpen(true)} 
                            icon={Database}
                            className="min-h-[200px]"
                        />
                    </>
                )}
            </div>
        )}
    </div>
    </DarkPage>
  );
};

