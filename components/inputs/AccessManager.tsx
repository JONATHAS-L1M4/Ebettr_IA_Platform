
import React, { useState, useEffect, useRef } from 'react';
import { AccessRule } from '../../types';
import { Plus, X, User, Mail, AlertCircle } from '../ui/Icons';
import { inputBaseClass } from './styles';
import { userService } from '../../services/userService';
import { companyService } from '../../services/companyService';

interface AccessManagerProps {
  rules: AccessRule[];
  onChange: (rules: AccessRule[]) => void;
  readonly?: boolean;
  selectedCompany?: string; // Filtra usuários por empresa
}

export const AccessManager: React.FC<AccessManagerProps> = ({ rules, onChange, readonly = false, selectedCompany = '' }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [availableUsers, setAvailableUsers] = useState<{email: string, company: string}[]>([]);
  
  // Estado para o dropdown customizado
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Carrega base de usuários e empresas da API real
  useEffect(() => {
      const loadData = async () => {
          try {
              // Busca dados em paralelo
              const [usersData, companiesData] = await Promise.all([
                  userService.list(),
                  companyService.list()
              ]);

              // Mapeia usuários para incluir o nome da empresa
              const formattedUsers = usersData.map(u => {
                  const company = companiesData.find(c => c.id === u.company_id);
                  return {
                      email: u.email,
                      company: company ? company.name : ''
                  };
              });

              setAvailableUsers(formattedUsers);
          } catch (e) {
              console.error("Falha ao carregar lista de usuários para controle de acesso", e);
          }
      };

      loadData();
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filtra usuários pela empresa selecionada, ou mostra todos se não houver empresa
  const usersInCompany = selectedCompany 
    ? availableUsers.filter(u => u.company && u.company.toLowerCase().trim() === selectedCompany.toLowerCase().trim())
    : availableUsers;

  // Filtra opções para o dropdown baseado no texto digitado
  const filteredOptions = usersInCompany.filter(u => 
      u.email.toLowerCase().includes(email.toLowerCase())
  );

  const handleSelectUser = (userEmail: string) => {
      setEmail(userEmail);
      setIsDropdownOpen(false);
      setError('');
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check de empresa removido conforme solicitado

    const cleanEmail = email.trim();
    if (!cleanEmail) return;

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
        setError('Email inválido.');
        return;
    }

    // Verifica duplicatas
    if (rules.some(r => r.email.toLowerCase() === cleanEmail.toLowerCase())) {
        setError('Este usuário já possui acesso.');
        return;
    }

    // Validação Estrita: Verifica se o usuário existe na lista permitida
    const userInScope = usersInCompany.find(u => u.email.toLowerCase() === cleanEmail.toLowerCase());
    
    if (!userInScope) {
        // Mensagens de erro diferenciadas
        const existsGlobal = availableUsers.some(u => u.email.toLowerCase() === cleanEmail.toLowerCase());
        
        if (existsGlobal && selectedCompany) {
             setError(`O usuário pertence a outra empresa (não é ${selectedCompany}).`);
        } else {
             setError('Usuário não cadastrado. Cadastre-o na tela "Usuários Clientes" primeiro.');
        }
        return;
    }

    const newRule: AccessRule = {
        email: cleanEmail,
        role: 'client', // Default fixo conforme solicitado
        addedAt: new Date().toISOString()
    };

    onChange([...rules, newRule]);
    setEmail('');
    setError('');
    setIsDropdownOpen(false);
  };

  const handleRemove = (emailToRemove: string) => {
      onChange(rules.filter(r => r.email !== emailToRemove));
  };

  const isDisabled = readonly;

  return (
    <div className="space-y-4">
        {/* Input Row */}
        {!readonly && (
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
                <div className="flex-1 w-full space-y-1" ref={dropdownRef}>
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide ml-1">
                        Selecione Usuário
                    </label>
                    <div className="relative">
                        <div className="absolute left-3 top-2.5 text-gray-400 pointer-events-none">
                            <Mail className="w-4 h-4" />
                        </div>
                        
                        <input 
                            type="email" 
                            value={email}
                            onChange={e => { 
                                setEmail(e.target.value); 
                                setError(''); 
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            placeholder={selectedCompany ? `Buscar em ${selectedCompany}...` : "Buscar usuário..."}
                            className={`${inputBaseClass} pl-9 ${isDisabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd(e)}
                            autoComplete="off"
                            disabled={isDisabled}
                        />

                        {/* Dropdown de Sugestões */}
                        {isDropdownOpen && filteredOptions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden animate-scale-in max-h-48 overflow-y-auto">
                                {filteredOptions.map(u => (
                                    <button
                                        key={u.email}
                                        type="button"
                                        onClick={() => handleSelectUser(u.email)}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center justify-between transition-colors border-b border-gray-50 last:border-0"
                                    >
                                        <span className="font-medium truncate">{u.email}</span>
                                        {/* Mostra a empresa no badge */}
                                        {u.company && (
                                            <span className="text-[10px] text-gray-400 ml-2 shrink-0">{u.company}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                
                <button 
                    type="button"
                    onClick={handleAdd}
                    disabled={isDisabled}
                    className={`w-full md:w-auto px-4 py-1 rounded-md flex items-center justify-center gap-2 transition-colors h-[34px] uppercase tracking-wide text-xs font-bold shadow-sm ${isDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="md:hidden">Adicionar</span>
                    <span className="hidden md:inline">Adicionar</span>
                </button>
            </div>
        )}

        {!readonly && error && <p className="text-[10px] text-red-500 font-bold ml-1">{error}</p>}

        {/* List of Users */}
        <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
            {rules.length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs">Nenhum usuário com acesso.</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {rules.map((rule, idx) => (
                        <div key={idx} className="p-3 flex items-center justify-between hover:bg-white transition-colors group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0 shadow-sm">
                                    {rule.email.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{rule.email}</p>
                                    <p className="text-[9px] text-gray-400 truncate">Adicionado em {rule.addedAt ? new Date(rule.addedAt).toLocaleDateString() : 'Data desc.'}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 shrink-0">
                                {/* Role Badge implícito 'Client' */}
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-500 border border-gray-200">
                                    <User className="w-3 h-3" /> Cliente
                                </span>

                                {!readonly && (
                                    <button 
                                        onClick={() => handleRemove(rule.email)}
                                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                        title="Remover acesso"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};
