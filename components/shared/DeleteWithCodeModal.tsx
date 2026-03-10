
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
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-w-sm w-full p-6 animate-scale-in">
            <div className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    <div className="text-sm text-gray-500 mt-2">
                       {description}
                    </div>
                </div>
                
                <div className="w-full bg-gray-100 p-3 rounded-md border border-gray-200">
                    <p className="text-xl font-mono font-bold text-gray-800 tracking-widest select-all">
                        {verificationCode}
                    </p>
                </div>

                <input 
                    type="text" 
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Digite o código aqui"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-center font-mono text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none shadow-sm transition-all text-gray-900 placeholder-gray-400"
                    maxLength={6}
                />

                <div className="flex gap-3 w-full pt-2">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={onConfirm}
                        disabled={userInput !== verificationCode}
                        className={`flex-1 py-2.5 text-sm font-bold text-white rounded-md transition-all
                            ${userInput === verificationCode 
                                ? 'bg-red-600 hover:bg-red-700' 
                                : 'bg-red-200 cursor-not-allowed'}
                        `}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
