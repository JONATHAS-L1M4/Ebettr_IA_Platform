
import React, { useState, useEffect } from 'react';
import { Trash2 } from '../ui/Icons';

interface DeleteWithCodeModalProps {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  icon?: React.ElementType;
}

export const DeleteWithCodeModal: React.FC<DeleteWithCodeModalProps> = ({ 
  isOpen, 
  title, 
  description, 
  onClose, 
  onConfirm,
  icon: Icon = Trash2
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [userInput, setUserInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setVerificationCode(code);
      setUserInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-card rounded-lg shadow-2xl border border-border max-w-sm w-full p-6 animate-scale-in">
            <div className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 bg-red-950/40 text-destructive rounded-full flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-foreground">{title}</h3>
                    <div className="text-sm text-muted-foreground mt-2">
                       {description}
                    </div>
                </div>
                
                <div className="w-full bg-muted p-3 rounded-md border border-border">
                    <p className="text-xl font-mono font-bold text-foreground tracking-widest select-all">
                        {verificationCode}
                    </p>
                </div>

                <input 
                    type="text" 
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Digite o código aqui"
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-center font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-background shadow-sm transition-all text-foreground placeholder:text-muted-foreground"
                    maxLength={6}
                />

                <div className="flex gap-3 w-full pt-2">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={onConfirm}
                        disabled={userInput !== verificationCode}
                        className="flex-1 py-2.5 text-sm font-bold text-destructive-foreground rounded-md transition-all bg-destructive disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
