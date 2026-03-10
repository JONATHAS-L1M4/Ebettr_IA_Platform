
import React, { useState, useEffect, useRef } from 'react';
import { User, Plus, Trash2, Mail, Ban, X, Building2, ChevronDown, CheckCircle2, Search, Lock, LockOpen, Shield, Loader2 } from '../components/ui/Icons';
import { useNotification } from '../context/NotificationContext';
import { inputBaseClass } from '../components/inputs/styles';
import { Company } from '../types';
import { companyService } from '../services/companyService';
import { userService } from '../services/userService';
import { ConfirmationModal } from '../components/shared/ConfirmationModal';

interface ClientUser {
  id?: string;
  email: string;
  company: string;
  companyId?: string;
  addedAt: string;
  status?: 'active' | 'blocked';
  name?: string;
}

const TableSkeleton = () => (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-pulse">
        <div className="h-12 bg-gray-50 border-b border-gray-100 flex items-center px-6">
             <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="divide-y divide-gray-50">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 w-full">
                        <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0"></div>
                        <div className="space-y-2 w-full">
                            <div className="h-3 bg-gray-100 rounded w-1/3"></div>
                            <div className="h-2 bg-gray-50 rounded w-1/4"></div>
                        </div>
                    </div>
                    <div className="w-20 h-4 bg-gray-50 rounded shrink-0"></div>
                </div>
            ))}
        </div>
    </div>
);

export const ClientUsers: React.FC = () => {
  const { addNotification } = useNotification();
  const [clients, setClients] = useState<ClientUser[]>([]);
  const [existingCompanies, setExistingCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; user: ClientUser | null }>({ isOpen: false, user: null });

  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const loadData = async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      try {
          const companiesData = await companyService.list();
          setExistingCompanies(companiesData);

          const usersData = await userService.list();

          const clientUsers = usersData
            .filter(u => u.role === 'client')
            .map(u => {
                const companyName = companiesData.find(c => c.id === u.company_id)?.name || 'Empresa Desconhecida';
                return {
                    id: u.id,
                    email: u.email,
                    name: u.name,
                    role: 'client',
                    company: companyName,
                    companyId: u.company_id,
                    addedAt: u.created_at,
                    status: u.is_blocked ? 'blocked' : 'active'
                } as ClientUser;
            });

          setClients(clientUsers);

      } catch (e: any) {
          console.error("Failed to load client users data", e);
          if (!e.message.includes('Sessão expirada')) {
              addNotification('error', 'Erro', 'Falha ao carregar lista de clientes.');
          }
      } finally {
          if (showLoading) setIsLoading(false);
      }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCompanyDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const generateRandomPassword = (length = 10) => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$";
    return Array(length).fill(null).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail || !newName || !newCompany) {
        addNotification('error', 'Campos Obrigatórios', 'Preencha nome, email e selecione uma empresa.');
        return;
    }

    const selectedCompanyObj = existingCompanies.find(c => c.name.toLowerCase() === newCompany.toLowerCase());
    
    if (!selectedCompanyObj) {
        addNotification('error', 'Empresa Inválida', 'Selecione uma empresa existente da lista.');
        return;
    }

    setIsSubmitting(true);
    const autoPassword = generateRandomPassword(10);

    try {
        await userService.create({
            email: newEmail,
            name: newName,
            password: autoPassword,
            role: 'client',
            company_id: selectedCompanyObj.id,
            is_blocked: false
        });

        navigator.clipboard.writeText(autoPassword);
        addNotification('success', 'Cliente Criado', `Senha gerada: ${autoPassword} (Copiada!)`);
        
        setNewName('');
        setNewEmail('');
        setNewCompany('');
        loadData();
    } catch (error: any) {
        addNotification('error', 'Erro ao criar', error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleClickRemove = (client: ClientUser) => {
    if (!client || !client.id) {
        console.error("Client deletion attempted with missing ID", client);
        addNotification('error', 'Erro', 'ID do cliente não encontrado. Atualize a lista.');
        return;
    }
    setDeleteModal({ isOpen: true, user: client });
  };

  const handleConfirmDelete = async () => {
    const client = deleteModal.user;
    if (!client || !client.id) return;

    try {
        await userService.delete(client.id);
        addNotification('success', 'Removido', `${client.email} foi excluído.`);
        loadData();
    } catch (error: any) {
        console.error("Delete failed", error);
        addNotification('error', 'Erro ao excluir', error.message);
    } finally {
        setDeleteModal({ isOpen: false, user: null });
    }
  };

  const handleToggleBlock = async (client: ClientUser) => {
      if (!client.id) {
          addNotification('error', 'Erro', 'ID do cliente não encontrado.');
          return;
      }
      const isBlocked = client.status === 'blocked';

      try {
          if (isBlocked) {
              await userService.unblock(client.id);
              addNotification('success', 'Desbloqueado', `${client.email} agora tem acesso.`);
          } else {
              await userService.block(client.id);
              addNotification('warning', 'Bloqueado', `${client.email} teve o acesso suspenso.`);
          }
          loadData(false);
      } catch (error: any) {
          addNotification('error', 'Erro', error.message);
      }
  };

  const handleSelectCompany = (name: string) => {
      setNewCompany(name);
      setIsCompanyDropdownOpen(false);
  };

  const filteredCompanies = existingCompanies.filter(c => 
      c.name.toLowerCase().includes(newCompany.toLowerCase())
  );

  const filteredClients = clients.filter(c => 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-12">
        <div className="flex flex-col gap-4 border-b border-gray-100 pb-4 mb-8">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 border border-gray-700 rounded-lg flex items-center justify-center text-gray-100 bg-gray-800">
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Usuários Clientes</h1>
                        <p className="text-sm text-gray-500 mt-0.5 font-light">Gestão de contas e associação com empresas/grupos.</p>
                    </div>
                </div>
                <div className="relative group w-full max-w-xs hidden sm:block">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 group-focus-within:text-black">
                        <Search className="w-4 h-4" />
                    </div>
                    <input 
                        type="text" 
                        className="bg-white border border-gray-200 text-gray-900 text-sm rounded-md focus:border-gray-400 focus:outline-none block w-full pl-10 h-9 placeholder-gray-400 shadow-sm" 
                        placeholder="Buscar usuário..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div className="relative group w-full sm:hidden">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 group-focus-within:text-black">
                    <Search className="w-4 h-4" />
                </div>
                <input 
                    type="text" 
                    className="bg-white border border-gray-200 text-gray-900 text-sm rounded-md focus:border-gray-400 focus:outline-none block w-full pl-10 h-9 placeholder-gray-400 shadow-sm" 
                    placeholder="Buscar usuário..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                {isLoading ? (
                    <TableSkeleton />
                ) : (
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden min-h-[300px]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <th className="px-6 py-4">Usuário</th>
                                        <th className="px-6 py-4">Empresa / Grupo</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {filteredClients.map((client) => {
                                        const isBlocked = client.status === 'blocked';
                                        return (
                                            <tr key={client.id || client.email} className={`hover:bg-gray-50/80 transition-colors group ${isBlocked ? 'bg-red-50/30' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-semibold leading-tight ${isBlocked ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                                                    {client.name || client.email}
                                                                </span>
                                                                {isBlocked && <span className="text-[9px] bg-red-100 text-red-600 border border-red-200 px-1.5 rounded font-bold uppercase">Bloqueado</span>}
                                                            </div>
                                                            <span className="text-[10px] text-gray-400">{client.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className={`w-4 h-4 ${client.company ? (isBlocked ? 'text-gray-300' : 'text-gray-500') : 'text-gray-300'}`} />
                                                        <span className={`text-xs font-medium ${client.company ? (isBlocked ? 'text-gray-400' : 'text-gray-700') : 'text-gray-400 italic'}`}>
                                                            {client.company || 'Não informada'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); handleToggleBlock(client); }} className={`p-2 rounded-lg transition-colors inline-flex z-10 relative cursor-pointer ${isBlocked ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'}`} title={isBlocked ? "Desbloquear" : "Bloquear"}>
                                                            {isBlocked ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                                        </button>
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); handleClickRemove(client); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex z-10 relative cursor-pointer" title="Remover">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    {!isLoading && filteredClients.length === 0 && (<div className="p-8 text-center text-gray-400 text-sm mt-4">Nenhum cliente cadastrado.</div>)}
                    </div>
                )}
            </div>

            <div className="lg:col-span-1">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> Cadastrar Cliente</h3>
                    <form onSubmit={handleAddClient} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome Completo</label>
                            <div className="relative">
                                <div className="absolute left-3 top-2.5 text-gray-400"><User className="w-4 h-4" /></div>
                                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className={`${inputBaseClass} pl-9 pr-8`} placeholder="Ex: Maria Souza" disabled={isSubmitting} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                            <div className="relative">
                                <div className="absolute left-3 top-2.5 text-gray-400"><Mail className="w-4 h-4" /></div>
                                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className={`${inputBaseClass} pl-9 pr-8`} placeholder="cliente@empresa.com" disabled={isSubmitting} />
                            </div>
                        </div>
                        <div className="space-y-1 relative" ref={dropdownRef}>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Empresa / Grupo <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <div className="absolute left-3 top-2.5 text-gray-400 pointer-events-none"><Building2 className="w-4 h-4" /></div>
                                <input type="text" value={newCompany} onChange={e => { setNewCompany(e.target.value); setIsCompanyDropdownOpen(true); }} onFocus={() => setIsCompanyDropdownOpen(true)} className={`${inputBaseClass} pl-9 pr-8 cursor-text`} placeholder="Selecione..." disabled={isSubmitting} />
                                <div className="absolute right-3 top-2.5 text-gray-400 pointer-events-none"><ChevronDown className={`w-4 h-4 transition-transform ${isCompanyDropdownOpen ? 'rotate-180' : ''}`} /></div>
                            </div>
                            {isCompanyDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-xl z-50 overflow-hidden animate-scale-in origin-top">
                                    <div className="max-h-48 overflow-y-auto scrollbar-hide py-1">
                                        {filteredCompanies.length > 0 ? (
                                            filteredCompanies.map(comp => (
                                                <button key={comp.id} type="button" onClick={() => handleSelectCompany(comp.name)} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2 transition-colors group">
                                                    <Building2 className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500" /><span className="truncate">{comp.name}</span>{comp.name === newCompany && <CheckCircle2 className="w-3 h-3 text-green-500 ml-auto" />}
                                                </button>
                                            ))
                                        ) : <div className="px-4 py-3 text-center"><span className="text-xs text-gray-400">Nenhuma empresa encontrada.</span></div>}
                                    </div>
                                    <div className="bg-gray-50 px-3 py-1.5 border-t border-gray-100"><p className="text-[9px] text-gray-400 text-center">Gerencie detalhes na aba "Empresas"</p></div>
                                </div>
                            )}
                        </div>
                        <button type="submit" disabled={!newEmail || !newName || !newCompany || isSubmitting} className="w-full py-2.5 bg-black text-white text-xs font-bold rounded-md hover:bg-gray-800 transition-colors uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mt-2 flex items-center justify-center gap-2">
                            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                            {isSubmitting ? 'Salvando...' : 'Salvar Cadastro'}
                        </button>
                        <p className="text-[10px] text-gray-400 text-center">Uma senha segura será gerada automaticamente.</p>
                    </form>
                    <div className="mt-6 p-4 bg-gray-50 border border-gray-100 rounded-lg">
                        <div className="flex items-start gap-2">
                            <Shield className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div><p className="text-xs font-bold text-gray-700">Permissão de Visualização</p><p className="text-[10px] text-gray-500 mt-1 leading-relaxed">Ao vincular uma empresa, você poderá filtrar dashboards e agentes específicos para este grupo no futuro.</p></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <ConfirmationModal 
            isOpen={deleteModal.isOpen}
            title="Excluir Usuário?"
            message={`Tem certeza que deseja excluir o cliente ${deleteModal.user?.email}? Esta ação é irreversível.`}
            onClose={() => setDeleteModal({ isOpen: false, user: null })}
            onConfirm={handleConfirmDelete}
            isDestructive={true}
            confirmLabel="Excluir"
        />
    </div>
  );
};
