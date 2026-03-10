
import React, { useState, useEffect } from 'react';
import { Company } from '../types';
import { Building2, Plus, Trash2, Globe, Mail, Phone, X, Save, Edit2, Search, Users, Loader2, AlertTriangle, User, Bot } from '../components/ui/Icons';
import { useNotification } from '../context/NotificationContext';
import { inputBaseClass } from '../components/inputs/styles';
import { DashedAddCard } from '../components/ui/DashedAddCard';
import SpotlightCard from '../components/ui/SpotlightCard';
import { companyService } from '../services/companyService';
import { userService } from '../services/userService';
import { agentService } from '../services/agentService';
import { DeleteWithCodeModal } from '../components/shared/DeleteWithCodeModal';

interface CompanyWithStats extends Company {
  userCount: number;
  agentCount: number;
}

const CompanyCardSkeleton = () => (
  <div className="h-full min-h-[180px] border border-gray-200 rounded-xl bg-white p-6 flex flex-col justify-between animate-pulse">
      <div className="flex justify-between items-start mb-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg"></div>
          <div className="w-6 h-6 bg-gray-50 rounded"></div>
      </div>
      <div className="flex-1 flex flex-col justify-start mt-2 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-50 rounded w-3/4"></div>
          <div className="h-3 bg-gray-50 rounded w-2/3"></div>
      </div>
      <div className="flex gap-4 mt-4 pt-4 border-t border-gray-50">
          <div className="h-3 bg-gray-100 rounded w-1/4"></div>
          <div className="h-3 bg-gray-100 rounded w-1/4"></div>
      </div>
  </div>
);

export const Companies: React.FC = () => {
  const { addNotification } = useNotification();
  const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formWebsite, setFormWebsite] = useState('');

  const isFetchingRef = React.useRef(false);
  const loadCompanies = async () => {
      if (isFetchingRef.current) return;
      
      setIsLoading(true);
      isFetchingRef.current = true;
      try {
          // Carrega empresas, usuários e agentes em paralelo
          const [companiesData, usersData, agentsData] = await Promise.all([
              companyService.list(),
              userService.list(),
              agentService.list()
          ]);

          // Processa estatísticas
          const companiesWithStats = companiesData.map(comp => {
              // Filtra usuários desta empresa e garante unicidade de e-mail
              const companyUsers = usersData.filter(u => u.company_id === comp.id);
              const uniqueEmails = new Set(companyUsers.map(u => u.email.toLowerCase()));
              
              // Filtra agentes desta empresa
              const companyAgents = agentsData.filter(a => a.companyId === comp.id);

              return {
                  ...comp,
                  userCount: uniqueEmails.size,
                  agentCount: companyAgents.length
              };
          });

          setCompanies(companiesWithStats);
      } catch (error: any) {
          console.error("Failed to load companies data", error);
          addNotification('error', 'Erro', error.message || 'Não foi possível carregar os dados.');
      } finally {
          setIsLoading(false);
          isFetchingRef.current = false;
      }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormWebsite('');
    setEditingId(null);
    setIsFormOpen(false);
    setIsDeleteModalOpen(false);
  };

  const handleEdit = (comp: Company) => {
    setFormName(comp.name);
    setFormEmail(comp.contactEmail || '');
    setFormPhone(comp.contactPhone || '');
    setFormWebsite(comp.website || '');
    setEditingId(comp.id);
    setIsFormOpen(true);
  };

  const handleConfirmDelete = async () => {
      if (!editingId) return;
      
      setIsDeleteModalOpen(false);
      // setIsSubmitting(true); // Opcional: bloquear UI global
      
      try {
          await companyService.delete(editingId);
          addNotification('info', 'Empresa removida', `A empresa ${formName} foi excluída.`);
          await loadCompanies();
          resetForm();
      } catch (error: any) {
          addNotification('error', 'Erro ao excluir', error.message);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      addNotification('error', 'Nome obrigatório', 'O nome da empresa não pode estar vazio.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: formName.trim(),
      contact_email: formEmail.trim(),
      contact_phone: formPhone.trim(),
      website: formWebsite.trim()
    };

    try {
        if (editingId) {
            await companyService.update(editingId, payload);
            addNotification('success', 'Atualizado', `Dados da empresa ${formName} salvos.`);
        } else {
            await companyService.create(payload);
            addNotification('success', 'Cadastrado', `Empresa ${formName} adicionada com sucesso.`);
        }
        await loadCompanies();
        resetForm();
    } catch (error: any) {
        addNotification('error', 'Erro', error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  // Filter Logic
  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.contactEmail && c.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getCompanyIcon = (name: string) => {
      const lowerName = name.toLowerCase();
      if (lowerName.includes('grupo') || lowerName.includes('group')) {
          return <Users className="w-5 h-5 text-gray-700" />;
      }
      return <Building2 className="w-5 h-5 text-gray-700" />;
  };

  // --- FORM VIEW ---
  if (isFormOpen) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in pb-12">
        <div className="flex items-center gap-4 mb-8">
           <button 
             onClick={resetForm}
             className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-gray-400 hover:text-black text-gray-500 transition-colors bg-white"
           >
             <X className="w-4 h-4" />
           </button>
           <div>
             <h1 className="text-xl font-bold text-gray-900">{editingId ? 'Editar Empresa' : 'Nova Empresa'}</h1>
             <p className="text-sm text-gray-500 font-light">
                Cadastre os dados corporativos para vincular usuários e agentes.
             </p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
           <div className="p-8 space-y-6">
              
              <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Nome da Empresa / Grupo <span className="text-red-500">*</span></label>
                  <div className="relative">
                      <div className="absolute left-3 top-2.5 text-gray-400">
                          <Building2 className="w-4 h-4" />
                      </div>
                      <input 
                          type="text" 
                          value={formName} 
                          onChange={e => setFormName(e.target.value)} 
                          className={`${inputBaseClass} pl-9`}
                          placeholder="Ex: Tech Solutions Ltda"
                          autoFocus
                          required
                          disabled={isSubmitting}
                      />
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">E-mail de Contato</label>
                      <div className="relative">
                          <div className="absolute left-3 top-2.5 text-gray-400">
                              <Mail className="w-4 h-4" />
                          </div>
                          <input 
                              type="email" 
                              value={formEmail} 
                              onChange={e => setFormEmail(e.target.value)} 
                              className={`${inputBaseClass} pl-9`}
                              placeholder="contato@empresa.com"
                              disabled={isSubmitting}
                          />
                      </div>
                  </div>

                  <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Telefone / WhatsApp</label>
                      <div className="relative">
                          <div className="absolute left-3 top-2.5 text-gray-400">
                              <Phone className="w-4 h-4" />
                          </div>
                          <input 
                              type="tel" 
                              value={formPhone} 
                              onChange={e => setFormPhone(e.target.value)} 
                              className={`${inputBaseClass} pl-9`}
                              placeholder="(11) 99999-9999"
                              disabled={isSubmitting}
                          />
                      </div>
                  </div>
              </div>

              <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Website</label>
                  <div className="relative">
                      <div className="absolute left-3 top-2.5 text-gray-400">
                          <Globe className="w-4 h-4" />
                      </div>
                      <input 
                          type="url" 
                          value={formWebsite} 
                          onChange={e => setFormWebsite(e.target.value)} 
                          className={`${inputBaseClass} pl-9`}
                          placeholder="https://www.empresa.com"
                          disabled={isSubmitting}
                      />
                  </div>
              </div>

           </div>

           <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
               <button 
                 type="button"
                 onClick={resetForm}
                 disabled={isSubmitting}
                 className="px-4 py-2 text-sm text-gray-600 hover:text-black font-medium transition-colors disabled:opacity-50"
               >
                 Cancelar
               </button>
               <button 
                 type="submit"
                 disabled={isSubmitting}
                 className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 Salvar Cadastro
               </button>
           </div>
        </form>

        {/* DANGER ZONE - Only when Editing */}
        {editingId && (
            <div className="mt-8 pt-8 border-t border-gray-100 animate-fade-in">
                <h3 className="text-xs font-bold text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Zona de Perigo
                </h3>
                <div className="border border-red-100 bg-red-50/50 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h4 className="text-sm font-bold text-gray-900">Excluir Empresa</h4>
                        <p className="text-xs text-gray-500 mt-1">
                            Esta ação excluirá permanentemente o cadastro de <strong>{formName}</strong>. 
                            Certifique-se de que não há usuários dependentes.
                        </p>
                    </div>
                    <button 
                        type="button"
                        onClick={() => setIsDeleteModalOpen(true)}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-md hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Excluir Empresa
                    </button>
                </div>
            </div>
        )}

        <DeleteWithCodeModal 
            isOpen={isDeleteModalOpen}
            title="Excluir Empresa?"
            description={<>Tem certeza que deseja excluir <strong>{formName}</strong>? Esta ação não pode ser desfeita.</>}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
        />
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-12">
        
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-gray-100 pb-4 mb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 border border-gray-700 rounded-lg flex items-center justify-center text-gray-100 bg-gray-800">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                            Empresas e Grupos
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5 font-light">
                            Gerencie as entidades que utilizarão seus agentes.
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative group flex-1 md:w-64">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 group-focus-within:text-black">
                            <Search className="w-4 h-4" />
                        </div>
                        <input 
                            type="text" 
                            className="bg-white border border-gray-200 text-gray-900 text-sm rounded-md focus:border-gray-400 focus:outline-none block w-full pl-10 h-9 placeholder-gray-400 shadow-sm" 
                            placeholder="Buscar empresa..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button 
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 h-9 rounded-md text-xs font-bold uppercase tracking-wide transition-all border border-transparent whitespace-nowrap shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Nova Empresa</span>
                    </button>
                </div>
            </div>
        </div>

        {/* Loading */}
        {isLoading && companies.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                {[1, 2, 3].map((i) => <CompanyCardSkeleton key={i} />)}
            </div>
        ) : (
            /* Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                {filteredCompanies.map(comp => (
                    <SpotlightCard key={comp.id} className="h-full min-h-[180px] border-gray-200 hover:border-gray-300 group">
                        <div className="flex flex-col justify-between h-full p-6">
                            
                            <div className="flex justify-between items-start mb-3">
                                <div className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                                    {getCompanyIcon(comp.name)}
                                </div>
                                
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleEdit(comp)}
                                        className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md transition-colors"
                                        title="Editar"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col justify-start mt-2 space-y-2">
                                <div className="mb-1">
                                    <h3 className="text-base font-bold text-gray-900 tracking-tight truncate" title={comp.name}>
                                        {comp.name}
                                    </h3>
                                </div>
                                
                                {comp.contactEmail && (
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Mail className="w-3 h-3 shrink-0" />
                                        <span className="text-xs truncate">{comp.contactEmail}</span>
                                    </div>
                                )}
                                
                                {comp.contactPhone && (
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Phone className="w-3 h-3 shrink-0" />
                                        <span className="text-xs truncate">{comp.contactPhone}</span>
                                    </div>
                                )}

                                {comp.website && (
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Globe className="w-3 h-3 shrink-0" />
                                        <a href={comp.website} target="_blank" rel="noopener noreferrer" className="text-xs truncate hover:underline hover:text-blue-600">
                                            {comp.website.replace(/^https?:\/\//, '')}
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className="mt-5 pt-4 border-t border-gray-50 flex items-center gap-4">
                                <div className="flex items-center gap-1.5" title="Usuários vinculados">
                                    <User className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-xs font-medium text-gray-600">{comp.userCount}</span>
                                </div>
                                <div className="flex items-center gap-1.5" title="Agentes vinculados">
                                    <Bot className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-xs font-medium text-gray-600">{comp.agentCount}</span>
                                </div>
                            </div>
                        </div>
                    </SpotlightCard>
                ))}

                <DashedAddCard 
                    label="Adicionar Empresa" 
                    onClick={() => setIsFormOpen(true)} 
                    icon={Building2}
                    className="min-h-[180px]"
                />
            </div>
        )}
    </div>
  );
};
