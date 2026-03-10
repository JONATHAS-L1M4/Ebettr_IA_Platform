import React from 'react';
import { RagDocument } from '../../types';
import { X, FileText, Loader2, Copy, Check } from '../ui/Icons';
import { useState } from 'react';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: RagDocument | null;
  isLoading: boolean;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ isOpen, onClose, document, isLoading }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (document?.content) {
      navigator.clipboard.writeText(document.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-emerald-600 shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 truncate max-w-[300px]">
                {document?.file_name || 'Documento'}
              </h3>
              <p className="text-xs text-gray-500 font-mono">
                ID: {document?.id} • {document?.blobType}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isLoading && document?.content && (
                <button 
                    onClick={handleCopy}
                    className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors flex items-center gap-2 text-xs font-medium"
                    title="Copiar conteúdo"
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>
            )}
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-600" />
              <p className="text-sm">Carregando conteúdo do documento...</p>
            </div>
          ) : document?.content ? (
            <div className="prose prose-sm max-w-none text-gray-800 font-mono whitespace-pre-wrap leading-relaxed">
              {document.content}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <FileText className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">Não foi possível carregar o conteúdo deste documento.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors shadow-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
