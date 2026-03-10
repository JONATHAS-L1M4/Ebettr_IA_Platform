
import React from 'react';
import { AlertTriangle } from '../ui/Icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen, title, message, onClose, onConfirm, 
  confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', isDestructive = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-sm p-6 animate-scale-in ring-1 ring-gray-100">
            <div className="flex flex-col items-center text-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${isDestructive ? 'bg-red-50 text-red-500 border-red-100' : 'bg-amber-50 text-amber-500 border-amber-100'}`}>
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                        {message}
                    </p>
                </div>
                <div className="flex gap-3 w-full pt-2">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 hover:border-gray-300"
                    >
                        {cancelLabel}
                    </button>
                    <button 
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`flex-1 py-2.5 text-sm font-bold text-white rounded-lg transition-all shadow-sm flex items-center justify-center
                            ${isDestructive 
                                ? 'bg-red-600 hover:bg-red-700' 
                                : 'bg-black hover:bg-gray-800'}
                        `}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
