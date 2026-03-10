
import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, size = 'md', disabled = false }) => {
  // Configuração "Soft Pill": Estilo moderno, totalmente arredondado.
  // Cores: Primary (Ativo) e Muted/Secondary (Inativo).
  
  const specs = {
    sm: { 
      w: 'w-9', 
      h: 'h-5', 
      thumb: 'w-3.5 h-3.5', 
      translate: 'translate-x-4',
      p: 'p-1' // padding interno para o thumb 'flutuar'
    },
    md: { 
      w: 'w-11', 
      h: 'h-6', 
      thumb: 'w-4 h-4', 
      translate: 'translate-x-5',
      p: 'p-1'
    },
    lg: { 
      w: 'w-14', 
      h: 'h-7', 
      thumb: 'w-5 h-5', 
      translate: 'translate-x-7',
      p: 'p-1'
    },
  };

  const s = specs[size];

  return (
    <label className={`inline-flex items-center gap-3 select-none relative ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer group'}`}>
      <input 
        type="checkbox" 
        className="sr-only" 
        checked={checked} 
        onChange={(e) => !disabled && onChange(e.target.checked)} 
        disabled={disabled}
      />
      
      {/* Track (Fundo) */}
      <div className={`
        relative transition-all duration-300 ease-in-out rounded-full flex items-center
        ${s.w} ${s.h} ${s.p}
        ${checked 
            ? (disabled ? 'bg-primary/50' : 'bg-primary') 
            : (disabled ? 'bg-gray-200' : 'bg-gray-200 group-hover:bg-gray-300')}
      `}>
        {/* Thumb (Bolinha) */}
        <div className={`
          bg-white rounded-full transform transition-transform duration-300 cubic-bezier(0.4, 0.0, 0.2, 1)
          ${s.thumb}
          ${checked ? s.translate : 'translate-x-0'}
          ${disabled ? 'shadow-none' : 'shadow-sm'}
        `} />
      </div>

      {label && (
        <span className={`text-sm font-medium transition-colors ${checked ? 'text-gray-900' : 'text-gray-500'}`}>
          {label}
        </span>
      )}
    </label>
  );
};

export default Toggle;
