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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70  p-4 animate-fade-in">
      <div className="bg-panel border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-card border border-border rounded-lg flex items-center justify-center text-foreground shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground truncate max-w-[300px]">
                {document?.file_name || 'Documento'}
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                ID: {document?.id} â€¢ {document?.blobType}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isLoading && document?.content && (
                <button 
                    onClick={handleCopy}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors flex items-center gap-2 text-xs font-medium"
                    title="Copiar conteÃºdo"
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>
            )}
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-foreground" />
              <p className="text-sm">Carregando conteÃºdo do documento...</p>
            </div>
          ) : document?.content ? (
            <div className="prose prose-sm max-w-none text-foreground font-mono whitespace-pre-wrap leading-relaxed">
              {document.content}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <FileText className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">NÃ£o foi possÃ­vel carregar o conteÃºdo deste documento.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-card border border-border text-muted-foreground text-sm font-medium rounded-md hover:bg-background hover:text-foreground transition-colors shadow-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

