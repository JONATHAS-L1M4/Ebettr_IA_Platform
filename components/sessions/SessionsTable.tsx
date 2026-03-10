
import React, { useState } from 'react';
import { UserSession } from '../../types';
import { Shield, Monitor, Globe, Ban, LogOut, CheckCircle2, MapPin, Loader2, Smartphone, Laptop, CheckSquare, Square, X } from '../ui/Icons';

interface SessionsTableProps {
  sessions: UserSession[];
  onRevoke: (id: string) => void;
  revokingId?: string | null;
  onBlock: (email: string) => void;
  onUnblock: (email: string) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  // Multi-selection props
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export const SessionsTable: React.FC<SessionsTableProps> = ({ 
  sessions, 
  onRevoke, 
  revokingId, 
  onUnblock,
  hasMore = false,
  onLoadMore,
  selectedIds,
  onSelectionChange
}) => {
  
  const [mapLocation, setMapLocation] = useState<{lat: number, lng: number, label: string} | null>(null);

  const isAllSelected = sessions.length > 0 && selectedIds.length === sessions.length;
  const isPartialSelected = selectedIds.length > 0 && selectedIds.length < sessions.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(sessions.map(s => s.id));
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(sid => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const getRiskBadge = (score: number) => {
      if (score >= 80) return <span className="text-[10px] font-bold text-red-400 bg-red-950/40 border border-red-900/50 px-2 py-0.5 rounded-full uppercase tracking-wide">Crítico ({score}%)</span>;
      if (score >= 50) return <span className="text-[10px] font-bold text-amber-300 bg-amber-950/40 border border-amber-900/50 px-2 py-0.5 rounded-full uppercase tracking-wide">Médio ({score}%)</span>;
      return <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded-full uppercase tracking-wide">Baixo ({score}%)</span>;
  };

  const formatDate = (iso: string) => {
      return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getDeviceIcon = (device: string) => {
      const d = device.toLowerCase();
      if (d.includes('mobile') || d.includes('android') || d.includes('iphone')) return <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />;
      return <Laptop className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  const formatTimeAgo = (seconds: number) => {
      if (seconds < 60) return `${seconds}s atrás`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m atrás`;
      const hours = Math.floor(minutes / 60);
      return `${hours}h atrás`;
  };

  return (
    <div className="bg-panel border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
                <h3 className="text-base font-bold text-foreground">Sessões Ativas & Histórico</h3>
                <p className="text-xs text-muted-foreground font-light hidden sm:block">Monitoramento de acesso em tempo real.</p>
                <p className="text-[10px] text-muted-foreground font-light sm:hidden mt-0.5">{sessions.length} visualizados</p>
            </div>
            {selectedIds.length > 0 && (
                <div className="animate-fade-in bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                        {selectedIds.length} selecionadas
                    </span>
                </div>
            )}
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-muted border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <th className="px-5 py-3 w-10">
                            <button 
                                onClick={handleSelectAll}
                                className="text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                            >
                                {isAllSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : isPartialSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                            </button>
                        </th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Usuário / IP</th>
                        <th className="px-5 py-3 hidden md:table-cell">Dispositivo</th>
                        <th className="px-5 py-3 hidden md:table-cell">Localização</th>
                        <th className="px-5 py-3 hidden sm:table-cell">Risco</th>
                        <th className="px-5 py-3 hidden lg:table-cell">Cronologia</th>
                        <th className="px-5 py-3 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                    {sessions.map((session) => {
                        const isSelected = selectedIds.includes(session.id);
                        return (
                        <tr key={session.id} className={`hover:bg-muted transition-colors group ${isSelected ? 'bg-accent' : ''} ${session.status === 'blocked' ? 'bg-red-950/40' : ''}`}>
                            {/* SELECTION */}
                            <td className="px-5 py-3">
                                <button 
                                    onClick={() => handleSelectRow(session.id)}
                                    className={`transition-colors focus:outline-none ${isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
                                >
                                    {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                </button>
                            </td>

                            {/* STATUS */}
                            <td className="px-5 py-3 whitespace-nowrap">
                                {session.status === 'active' && (
                                    <div className="flex items-center gap-2.5">
                                        <div className="relative flex items-center justify-center">
                                            <div className={`w-2 h-2 rounded-full ${session.isOnline ? 'bg-emerald-950/400' : 'bg-amber-950/400'}`}></div>
                                            {session.isOnline && <div className="absolute w-2 h-2 rounded-full bg-emerald-950/400 animate-ping opacity-20"></div>}
                                        </div>
                                        <span className="text-xs font-semibold text-foreground">
                                            {session.isOnline ? 'Online Agora' : 'Ativa'}
                                        </span>
                                    </div>
                                )}
                                {session.status === 'revoked' && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                                        <span className="text-xs font-medium text-muted-foreground">Encerrada</span>
                                    </div>
                                )}
                                {session.status === 'blocked' && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-950/400"></div>
                                        <span className="text-xs font-semibold text-red-400">Bloqueada</span>
                                    </div>
                                )}
                            </td>

                            {/* USUÁRIO & IP */}
                            <td className="px-5 py-3 whitespace-nowrap">
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-foreground">{session.email}</span>
                                    <span className="text-[10px] text-muted-foreground font-mono mt-0.5">{session.ip}</span>
                                </div>
                            </td>

                            {/* DISPOSITIVO */}
                            <td className="px-5 py-3 whitespace-nowrap hidden md:table-cell">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        {getDeviceIcon(session.device)}
                                        <span>{session.browser}</span>
                                    </div>
                                </div>
                            </td>

                            {/* LOCALIZAÇÃO */}
                            <td className="px-5 py-3 whitespace-nowrap hidden md:table-cell">
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                    <Globe className="w-3 h-3 text-muted-foreground" /> 
                                    <span>{session.location}</span>
                                    {session.location_json?.latitude && session.location_json?.longitude && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMapLocation({
                                                    lat: session.location_json!.latitude,
                                                    lng: session.location_json!.longitude,
                                                    label: session.location
                                                });
                                            }}
                                            className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                                            title="Ver no mapa"
                                        >
                                            <MapPin className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </td>

                            {/* RISCO */}
                            <td className="px-5 py-3 whitespace-nowrap hidden sm:table-cell">
                                {getRiskBadge(session.riskScore)}
                            </td>

                            {/* CRONOLOGIA (Datas) */}
                            <td className="px-5 py-3 whitespace-nowrap hidden lg:table-cell">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                        <span className="font-bold text-muted-foreground mr-1.5">Início:</span>
                                        {formatDate(session.loginTime)}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                        <span className="font-bold text-muted-foreground mr-1.5">
                                            {session.status === 'active' ? 'Último:' : 'Fim:'}
                                        </span>
                                        {formatDate(session.lastActive)}
                                    </span>
                                    {session.lastSeenSecondsAgo !== undefined && session.status === 'active' && (
                                        <span className="text-[10px] text-emerald-300 font-mono">
                                            <span className="font-bold text-emerald-400 mr-1.5">Visto:</span>
                                            {formatTimeAgo(session.lastSeenSecondsAgo)}
                                        </span>
                                    )}
                                </div>
                            </td>

                            {/* AÇÕES */}
                            <td className="px-5 py-3 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-1">
                                    {session.status === 'active' && (
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onRevoke(session.id);
                                            }}
                                            disabled={revokingId === session.id}
                                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-red-950/40 rounded-md transition-all inline-flex items-center justify-center group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Derrubar Sessão"
                                        >
                                            {revokingId === session.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <LogOut className="w-4 h-4" />
                                            )}
                                        </button>
                                    )}
                                    {session.status === 'blocked' && (
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onUnblock(session.email);
                                            }}
                                            className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-950/40 rounded-md transition-all inline-flex items-center justify-center"
                                            title="Desbloquear"
                                        >
                                            <Shield className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    )})}
                </tbody>
            </table>
        </div>
        
        {/* Footer com Load More */}
        {sessions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm italic border-t border-border">
                Nenhuma sessão registrada no período.
            </div>
        ) : (
            <div className="p-3 border-t border-border bg-muted flex justify-center">
                {hasMore ? (
                    <button 
                        onClick={onLoadMore}
                        className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-wide transition-colors flex items-center gap-2 py-1 px-3 rounded hover:bg-background"
                    >
                        <Loader2 className="w-3 h-3" />
                        Carregar Mais
                    </button>
                ) : (
                    <span className="text-[10px] font-medium text-muted-foreground py-1">Fim da lista</span>
                )}
            </div>
        )}

        {/* Map Modal */}
        {mapLocation && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-panel border border-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted">
                        <div className="flex items-center gap-2 text-foreground">
                            <MapPin className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-bold">Localização: {mapLocation.label}</h3>
                        </div>
                        <button 
                            onClick={() => setMapLocation(null)}
                            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-background transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="w-full h-[400px] bg-muted">
                        <iframe 
                            width="100%" 
                            height="100%" 
                            frameBorder="0" 
                            style={{ border: 0 }}
                            src={`https://maps.google.com/maps?q=${mapLocation.lat},${mapLocation.lng}&z=15&output=embed`}
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

