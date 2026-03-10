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
        className={`border border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center gap-4 text-gray-400 hover:border-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all h-full min-h-[200px] w-full group cursor-pointer bg-white/50 ${className}`}
    >
        <div className="w-14 h-14 flex items-center justify-center group-hover:scale-105 transition-all duration-200">
            <Icon className="w-6 h-6 text-gray-300 group-hover:text-gray-600 transition-colors duration-200" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest transition-colors group-hover:text-gray-600">{label}</span>
    </button>
  );
};