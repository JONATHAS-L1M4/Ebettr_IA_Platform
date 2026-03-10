import React from 'react';
import { Plus } from './Icons';

interface DashedAddCardProps {
  label: string;
  onClick: () => void;
  className?: string;
  sparkColor?: string;
  icon?: React.ElementType;
}

export const DashedAddCard: React.FC<DashedAddCardProps> = ({ 
  label, 
  onClick, 
  className = "",
  // sparkColor, // Prop mantida na interface para compatibilidade, mas ignorada visualmente
  icon: Icon = Plus
}) => {
  return (
    <button 
        onClick={onClick}
        className={`border border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-4 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors h-full min-h-[200px] w-full group cursor-pointer bg-card ${className}`}
    >
        <div className="w-14 h-14 flex items-center justify-center group-hover:scale-105 transition-all duration-200">
            <Icon className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest transition-colors group-hover:text-foreground">{label}</span>
    </button>
  );
};
