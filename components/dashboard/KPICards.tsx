import React from 'react';
import { Activity, Clock, CheckCircle2, TrendingUp, AlertCircle, BarChart3 } from '../ui/Icons';

interface KPICardsProps {
  successRate: number;
  avgDuration: string;
}

const KPICardItem: React.FC<{
    title: string;
    value: React.ReactNode;
    icon: React.ElementType;
    footer?: React.ReactNode;
}> = ({ title, value, icon: Icon, footer }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col justify-between h-full shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
        <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{title}</h3>
            <Icon className="w-4 h-4 text-gray-400" />
        </div>
        
        <div>
            <span className="text-3xl font-bold text-gray-900 tracking-tight block mb-1">{value}</span>
            {footer && <div className="mt-2">{footer}</div>}
        </div>
    </div>
);

export const KPICards: React.FC<KPICardsProps> = ({ successRate, avgDuration }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KPICardItem 
            title="Taxa de Sucesso" 
            value={`${successRate}%`}
            icon={successRate >= 90 ? CheckCircle2 : AlertCircle}
            footer={
                <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden mt-1">
                    <div 
                        className={`h-full rounded-full ${successRate >= 90 ? 'bg-black' : 'bg-amber-500'}`} 
                        style={{ width: `${successRate}%` }}
                    />
                </div>
            }
        />

        <KPICardItem 
            title="Duração Média" 
            value={avgDuration}
            icon={Clock}
            footer={
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400">
                    <BarChart3 className="w-3 h-3" />
                    <span>Por requisição</span>
                </div>
            }
        />
    </div>
  );
};