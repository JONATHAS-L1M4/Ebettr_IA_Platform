
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, Bot, LogOut, X, Box, UserCog, Server, Users, Lock, User, Building2, AlertTriangle, Shield, Headset, BarChart3 } from '../ui/Icons';
import { Agent, UserRole } from '../../types';
import { useNotification } from '../../context/NotificationContext';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean; 
  closeMobile: () => void;
  userRole: UserRole | null;
  currentUser?: { name: string; email: string; role: any; avatarUrl?: string } | null;
  allAgents: Agent[];
  onLogout: () => void;
  isLoading?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  closeMobile,
  userRole,
  currentUser,
  allAgents,
  onLogout,
  isLoading = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotification();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 bg-sidebar flex flex-col border-r border-sidebar-border
    transition-transform duration-300 ease-in-out
    w-56 md:translate-x-0
    ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
    ${isCollapsed ? 'md:w-16' : 'md:w-56'}
  `;

  const normalizedRole = userRole?.toLowerCase().trim();

  const getRoleBadge = () => {
      switch (normalizedRole) {
          case 'client': return 'CL';
          case 'support': return 'SP';
          case 'editor': return 'ED';
          case 'admin': default: return 'AD';
      }
  };

  const getInitials = () => {
      if (!currentUser?.name) return getRoleBadge();
      
      const parts = currentUser.name.trim().split(/\s+/);
      if (parts.length === 0) return getRoleBadge();
      
      if (parts.length === 1) {
          return parts[0].substring(0, 2).toUpperCase();
      }
      
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleAgentClick = (agent: Agent) => {
      // Regra de Bloqueio: Se bloqueado e não for admin, impede navegação
      if (agent.isBlocked && normalizedRole !== 'admin') {
          addNotification(
              'warning',
              'Acesso Restrito',
              'Este agente está temporariamente indisponível. Contate o administrador.'
          );
          return;
      }
      navigate(`/agents/${agent.id}`);
      closeMobile();
  };

  const handleConfirmLogout = () => {
      setShowLogoutConfirm(false);
      onLogout();
  };

  const displayName = currentUser?.name || 'Usuário';
  const displayInitials = getInitials();
  
  const currentPath = location.pathname;
  const isAgentsActive = currentPath === '/agents' || currentPath === '/';
  const isProfileActive = currentPath === '/profile';
  const isServersActive = currentPath === '/admin/servers';
  const isAdminUsersActive = currentPath === '/admin/users';
  const isClientUsersActive = currentPath === '/admin/clients';
  const isCompaniesActive = currentPath === '/admin/companies';
  const isSessionsActive = currentPath === '/admin/sessions';

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={closeMobile}
        />
      )}

      <aside className={sidebarClasses}>
        {/* Header / Logo */}
        <div className={`h-16 flex items-center shrink-0 ${isCollapsed ? 'md:justify-center px-0' : 'justify-between px-4'}`}>
          <div 
            className={`flex items-center gap-3 cursor-pointer transition-all ${!isCollapsed ? 'pl-2' : ''}`}
            onClick={() => navigate('/agents')}
            title={isCollapsed ? "Ebettr IA" : undefined}
          >
            <img 
              src={isCollapsed ? "http://img.ebettr.com/images/2026/03/06/favicon.png" : "http://img.ebettr.com/images/2026/03/06/logotipo.png"}
              alt="Ebettr IA" 
              className={`object-contain transition-all ${isCollapsed ? 'w-8 h-8' : 'h-6 w-auto brightness-0 invert'}`}
            />
          </div>

          <button 
            onClick={closeMobile}
            className="md:hidden text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {!isCollapsed && (
            <button 
                onClick={() => setIsCollapsed(true)}
                className="hidden md:block text-gray-500 hover:text-white transition-colors p-1"
            >
                <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {isCollapsed && (
            <div className="hidden md:flex justify-center pb-4 pt-2 border-b border-white/5 mx-4 mb-2">
                <button 
                    onClick={() => setIsCollapsed(false)}
                    className="text-gray-500 hover:text-white transition-colors"
                    title="Expandir"
                >
                    <PanelLeftOpen className="w-4 h-4" />
                </button>
            </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="space-y-1">
              {isLoading && !currentUser ? (
                  <div className="flex flex-col gap-1">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md ${isCollapsed ? 'md:justify-center' : ''}`}>
                              <div className="w-4 h-4 rounded-md bg-gray-700/50 animate-pulse shrink-0" />
                              {(!isCollapsed || isMobileOpen) && <div className="h-3 w-24 bg-gray-700/50 rounded animate-pulse" />}
                          </div>
                      ))}
                  </div>
              ) : (
                  <>
                      <button 
                        onClick={() => { navigate('/agents'); closeMobile(); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all font-medium
                        ${isAgentsActive 
                          ? 'bg-gray-800 text-white shadow-sm' 
                          : 'text-gray-400 hover:text-white hover:bg-white/5'}
                        ${isCollapsed ? 'md:justify-center' : ''}`}
                        title="Todos Agentes"
                      >
                        <Box className="w-4 h-4 shrink-0" />
                        {(!isCollapsed || isMobileOpen) && <span>Todos Agentes</span>}
                      </button>

                      {normalizedRole === 'admin' && (
                        <>
                          <button 
                            onClick={() => { navigate('/admin/servers'); closeMobile(); }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all font-medium mt-1
                            ${isServersActive 
                              ? 'bg-gray-800 text-white shadow-sm' 
                              : 'text-gray-400 hover:text-white hover:bg-white/5'}
                            ${isCollapsed ? 'md:justify-center' : ''}`}
                            title="Servidores"
                          >
                            <Server className="w-4 h-4 shrink-0" />
                            {(!isCollapsed || isMobileOpen) && <span>Servidores</span>}
                          </button>

                          <button 
                            onClick={() => { navigate('/admin/companies'); closeMobile(); }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all font-medium mt-1
                            ${isCompaniesActive 
                              ? 'bg-gray-800 text-white shadow-sm' 
                              : 'text-gray-400 hover:text-white hover:bg-white/5'}
                            ${isCollapsed ? 'md:justify-center' : ''}`}
                            title="Empresas / Grupos"
                          >
                            <Building2 className="w-4 h-4 shrink-0" />
                            {(!isCollapsed || isMobileOpen) && <span>Empresas / Grupos</span>}
                          </button>

                          <button 
                            onClick={() => { navigate('/admin/users'); closeMobile(); }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all font-medium mt-1
                            ${isAdminUsersActive 
                              ? 'bg-gray-800 text-white shadow-sm' 
                              : 'text-gray-400 hover:text-white hover:bg-white/5'}
                            ${isCollapsed ? 'md:justify-center' : ''}`}
                            title="Usuários Admins"
                          >
                            <Users className="w-4 h-4 shrink-0" />
                            {(!isCollapsed || isMobileOpen) && <span>Usuários Admins</span>}
                          </button>

                          <button 
                            onClick={() => { navigate('/admin/clients'); closeMobile(); }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all font-medium mt-1
                            ${isClientUsersActive 
                              ? 'bg-gray-800 text-white shadow-sm' 
                              : 'text-gray-400 hover:text-white hover:bg-white/5'}
                            ${isCollapsed ? 'md:justify-center' : ''}`}
                            title="Usuários Clientes"
                          >
                            <User className="w-4 h-4 shrink-0" />
                            {(!isCollapsed || isMobileOpen) && <span>Usuários Clientes</span>}
                          </button>

                          <button 
                            onClick={() => { navigate('/admin/sessions'); closeMobile(); }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all font-medium mt-1
                            ${isSessionsActive 
                              ? 'bg-gray-800 text-white shadow-sm' 
                              : 'text-gray-400 hover:text-white hover:bg-white/5'}
                            ${isCollapsed ? 'md:justify-center' : ''}`}
                            title="Sessões & Logins"
                          >
                            <Shield className="w-4 h-4 shrink-0" />
                            {(!isCollapsed || isMobileOpen) && <span>Sessões & Logins</span>}
                          </button>

                          <button 
                            onClick={() => { navigate('/admin/alerts'); closeMobile(); }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all font-medium mt-1
                            ${currentPath === '/admin/alerts' 
                              ? 'bg-gray-800 text-white shadow-sm' 
                              : 'text-gray-400 hover:text-white hover:bg-white/5'}
                            ${isCollapsed ? 'md:justify-center' : ''}`}
                            title="Alertas"
                          >
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            {(!isCollapsed || isMobileOpen) && <span>Alertas</span>}
                          </button>
                        </>
                      )}

                      {(normalizedRole === 'admin' || normalizedRole === 'support') && (
                          <button 
                            onClick={() => { navigate('/admin/workflows/execution-metrics'); closeMobile(); }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all font-medium mt-1
                            ${currentPath === '/admin/workflows/execution-metrics' 
                              ? 'bg-gray-800 text-white shadow-sm' 
                              : 'text-gray-400 hover:text-white hover:bg-white/5'}
                            ${isCollapsed ? 'md:justify-center' : ''}`}
                            title="Métricas de Execução"
                          >
                            <BarChart3 className="w-4 h-4 shrink-0" />
                            {(!isCollapsed || isMobileOpen) && <span>Métricas de Execução</span>}
                          </button>
                      )}

                      <button 
                        onClick={() => { navigate('/support-chat'); closeMobile(); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all font-medium mt-1
                        ${currentPath === '/support-chat' 
                          ? 'bg-gray-800 text-white shadow-sm' 
                          : 'text-gray-400 hover:text-white hover:bg-white/5'}
                        ${isCollapsed ? 'md:justify-center' : ''}`}
                        title="Suporte"
                        >
                        <Headset className="w-4 h-4 shrink-0" />
                        {(!isCollapsed || isMobileOpen) && <span>Suporte</span>}
                      </button>
                  </>
              )}
              
              {/* Lista de Agentes (Acesso Rápido) */}
              <div className="flex flex-col gap-0.5 mt-2">
                  {(!isCollapsed || isMobileOpen) && (
                      <div className="px-3 mb-2 mt-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex justify-between items-center h-4">
                          <span>Meus Agentes</span>
                          {isLoading && <div className="w-2 h-2 rounded-full bg-white/20 animate-pulse" />}
                      </div>
                  )}

                  {isLoading ? (
                      // Skeleton Loading
                      <div className="flex flex-col gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                              <div key={i} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md ${isCollapsed ? 'md:justify-center' : 'pl-3'}`}>
                                  <div className="w-4 h-4 rounded-md bg-gray-700/50 animate-pulse shrink-0" />
                                  {(!isCollapsed || isMobileOpen) && (
                                      <div className="flex-1 flex items-center">
                                          <div className="h-3 w-3/4 bg-gray-700/50 rounded animate-pulse" />
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  ) : (
                      // Actual List
                      allAgents.map(agent => {
                          const isActive = currentPath === `/agents/${agent.id}`;
                          const isLocked = agent.isBlocked;
                          
                          return (
                            <button
                              key={agent.id}
                              onClick={() => handleAgentClick(agent)}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all group
                              ${isActive 
                                ? 'bg-gray-800 text-white font-medium shadow-sm' 
                                : 'text-gray-400 hover:text-white hover:bg-white/5'}
                              ${isCollapsed ? 'md:justify-center' : 'pl-3'}
                              ${isLocked && normalizedRole !== 'admin' ? 'opacity-50 cursor-not-allowed' : ''}
                              `} 
                              title={isLocked && normalizedRole !== 'admin' ? "Indisponível" : agent.name}
                            >
                              {isLocked ? (
                                  <Lock className={`w-4 h-4 shrink-0 ${isActive ? 'text-red-400' : 'text-red-500/70'}`} />
                              ) : (
                                  <Bot className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`} />
                              )}
                              
                              {(!isCollapsed || isMobileOpen) && (
                                  <span className={`truncate ${isLocked ? 'text-gray-500 italic' : ''}`}>
                                    {agent.name}
                                  </span>
                              )}
                            </button>
                          );
                      })
                  )}
              </div>
          </div>
        </nav>

        {/* Footer User Profile - Expandido */}
        <div className="p-4 border-t border-white/10 bg-transparent">
          {isLoading && !currentUser ? (
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-3`}>
                  <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-sm bg-gray-700/50 animate-pulse shrink-0" />
                      {!isCollapsed && (
                          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                              <div className="h-3 w-20 bg-gray-700/50 rounded animate-pulse" />
                              <div className="h-2 w-28 bg-gray-700/50 rounded animate-pulse" />
                          </div>
                      )}
                  </div>
              </div>
          ) : (
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-3`}>
                
                <div 
                    className="flex items-center gap-3 min-w-0 cursor-pointer group"
                    onClick={() => { navigate('/profile'); closeMobile(); }}
                    title="Editar Perfil"
                >
                    <div className="w-7 h-7 rounded-sm bg-white border border-gray-300 flex items-center justify-center text-xs font-bold text-black overflow-hidden shrink-0">
                        {currentUser?.avatarUrl ? (
                            <img 
                                src={currentUser.avatarUrl} 
                                alt={displayName} 
                                className="w-full h-full object-cover" 
                            />
                        ) : (
                            <span className="text-black leading-none">{displayInitials}</span>
                        )}
                    </div>

                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-200 truncate group-hover:text-white transition-colors">{displayName}</p>
                            <p className="text-[10px] text-gray-500 truncate group-hover:text-gray-400 transition-colors">{currentUser?.email}</p>
                        </div>
                    )}
                </div>

                {/* Logout Button - Visível apenas quando expandido, ou se mobile */}
                {!isCollapsed && (
                    <button 
                        onClick={() => setShowLogoutConfirm(true)}
                        className="text-gray-500 hover:text-red-400 transition-colors p-1.5 hover:bg-white/5 rounded-md"
                        title="Sair"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                )}
              </div>
          )}
        </div>
      </aside>

      {/* CONFIRMATION LOGOUT MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-sm p-6 animate-scale-in">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center border border-red-100">
                        <LogOut className="w-6 h-6 ml-0.5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Encerrar Sessão?</h3>
                        <p className="text-sm text-gray-500 mt-2">
                            Você tem certeza que deseja sair da plataforma?
                        </p>
                    </div>
                    <div className="flex gap-3 w-full pt-2">
                        <button 
                            onClick={() => setShowLogoutConfirm(false)}
                            className="flex-1 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-black rounded-lg transition-colors border border-gray-200 hover:border-gray-300"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleConfirmLogout}
                            className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </>
  );
};
