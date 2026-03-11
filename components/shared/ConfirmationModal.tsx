
import React from 'react';

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
    <div className="fixed inset-0 bg-black/60  z-[100] flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-sm p-6 animate-scale-in ring-1 ring-border">
            <div className="flex flex-col items-center text-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-foreground">{title}</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        {message}
                    </p>
                </div>
                <div className="flex gap-3 w-full pt-2">
                    <button 
                        onClick={onClose}
                        className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground shadow-sm transition-all hover:border-border hover:bg-muted hover:text-foreground"
                    >
                        {cancelLabel}
                    </button>
                    <button 
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-wide shadow-sm transition-all
                            ${isDestructive 
                                ? 'border-red-900/50 bg-red-950/40 text-red-300 hover:border-red-600 hover:bg-red-700 hover:text-red-50' 
                                : 'border-border bg-card text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground'}
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
