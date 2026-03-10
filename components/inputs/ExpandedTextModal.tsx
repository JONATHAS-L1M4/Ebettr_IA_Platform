import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, X, Check, Copy } from '../ui/Icons';
import { useNotification } from '../../context/NotificationContext';

interface ExpandedTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  label: string;
  value: string;
  maxLength?: number;
}

export const ExpandedTextModal: React.FC<ExpandedTextModalProps> = ({
  isOpen, onClose, onSave, label, value, maxLength
}) => {
  const { addNotification } = useNotification();
  const [localValue, setLocalValue] = useState(value);

  // Sincroniza o valor local quando o modal abre ou o valor muda externamente
  useEffect(() => {
    setLocalValue(value);
  }, [value, isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(localValue);
    addNotification('success', 'Copiado', 'Texto copiado para a área de transferência.');
  };

  const currentLength = localValue.length;

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-3xl h-[80vh] rounded-xl shadow-2xl border border-gray-200 flex flex-col animate-scale-in overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
          <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm flex items-center gap-2">
            <Maximize2 className="w-4 h-4" />
            Editando: {label}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 flex flex-col gap-2 min-h-0">
           <textarea
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              maxLength={maxLength}
              className="w-full flex-1 p-5 bg-gray-50 border border-gray-200 rounded-lg text-sm resize-none outline-none leading-relaxed shadow-inner focus:border-gray-200 placeholder-gray-400 text-gray-900"
              placeholder="Digite seu texto aqui..."
              autoFocus
           />
           <div className="flex justify-between items-center shrink-0 pt-2">
              <div className="flex gap-2">
                  <button onClick={handleCopy} className="text-xs text-gray-400 hover:text-black flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors">
                      <Copy className="w-3 h-3" /> Copiar
                  </button>
              </div>
              <span className={`text-xs font-mono transition-colors ${
                  maxLength && currentLength >= maxLength ? 'text-red-500 font-bold' : 'text-gray-400'
              }`}>
                  {currentLength}{maxLength ? `/${maxLength}` : ''}
              </span>
           </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-black uppercase tracking-wide transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={() => onSave(localValue)}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-2 uppercase tracking-wide"
          >
            <Check className="w-4 h-4" />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};