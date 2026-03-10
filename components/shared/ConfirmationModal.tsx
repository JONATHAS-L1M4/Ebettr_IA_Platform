
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-sm p-6 animate-scale-in ring-1 ring-border">
            <div className="flex flex-col items-center text-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${isDestructive ? 'bg-red-950/40 text-destructive border-red-900/50' : 'bg-amber-950/40 text-amber-300 border-amber-900/50'}`}>
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-foreground">{title}</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        {message}
                    </p>
                </div>
                <div className="flex gap-3 w-full pt-2">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors border border-border"
                    >
                        {cancelLabel}
                    </button>
                    <button 
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all shadow-sm flex items-center justify-center
                            ${isDestructive 
                                ? 'bg-destructive text-destructive-foreground' 
                                : 'bg-primary text-primary-foreground'}
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
