
import React, { useRef, useState } from 'react';
import { ConfigField } from '../../types';
import { Upload, Trash2, FileJson, AlertCircle, CheckCircle2 } from '../ui/Icons';

interface UploadFieldProps {
  field: ConfigField;
  onChange: (value: string | string[]) => void; // Aceita array de strings
}

export const UploadField: React.FC<UploadFieldProps> = ({ field, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const acceptString = field.allowedFileTypes?.join(',') || '';

  // Garante que o valor seja um array para manipulação segura
  const currentValues: string[] = Array.isArray(field.value) 
    ? field.value 
    : (field.value ? [field.value as string] : []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    
    if (files && files.length > 0) {
      const newFileNames: string[] = [];
      
      // Validação por arquivo
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (field.maxFileSize) {
            const fileSizeMB = file.size / (1024 * 1024);
            if (fileSizeMB > field.maxFileSize) {
                setError(`O arquivo "${file.name}" excede o limite de ${field.maxFileSize}MB.`);
                if (fileInputRef.current) fileInputRef.current.value = ''; 
                return; // Interrompe se qualquer arquivo for inválido
            }
        }
        newFileNames.push(file.name);
      }

      // Adiciona novos arquivos aos já existentes
      onChange([...currentValues, ...newFileNames]);
      
      // Limpa input para permitir selecionar o mesmo arquivo novamente se desejar
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
      const updated = currentValues.filter((_, idx) => idx !== indexToRemove);
      onChange(updated);
  };

  return (
    <div className="flex flex-col gap-2">
        {/* Drop/Click Zone */}
        <label className={`
            flex flex-col items-center justify-center gap-2 p-4 bg-white border border-dashed rounded-md cursor-pointer transition-colors shadow-sm group/upload relative overflow-hidden
            ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-black hover:bg-gray-50'}
        `}>
            <div className="p-2 bg-gray-50 rounded-full border border-gray-100 group-hover/upload:bg-white transition-colors">
                <Upload className={`w-4 h-4 transition-colors ${error ? 'text-red-500' : 'text-gray-400 group-hover/upload:text-black'}`} />
            </div>
            <div className="text-center">
                 <span className={`text-xs font-medium ${error ? 'text-red-600' : 'text-gray-600'}`}>
                    {error ? error : (field.placeholder || 'Clique para selecionar arquivos')}
                </span>
                <p className="text-[10px] text-gray-400 mt-1">Multi-upload habilitado</p>
            </div>
            
            <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept={acceptString}
                onChange={handleFileChange}
                multiple // Habilita múltipla seleção
            />
        </label>
        
        {/* File List */}
        {currentValues.length > 0 && (
            <div className="space-y-1.5 animate-fade-in bg-gray-50/50 p-2 rounded-md border border-gray-100">
                <div className="flex items-center justify-between px-1 pb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Selecionados ({currentValues.length})</span>
                    <button 
                        onClick={() => onChange([])} 
                        className="text-[10px] text-red-400 hover:text-red-600 hover:underline"
                    >
                        Limpar Tudo
                    </button>
                </div>
                {currentValues.map((fileName, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-md shadow-sm">
                        <div className="flex items-center gap-2 truncate">
                            <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                            <span className="text-xs text-gray-700 truncate font-medium">{fileName}</span>
                        </div>
                        <button 
                            onClick={() => handleRemoveFile(idx)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-red-50"
                            title="Remover"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        )}

        {/* Info Footer */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 pl-1">
             {field.allowedFileTypes && field.allowedFileTypes.length > 0 && (
                <div className="flex items-center gap-1">
                    <FileJson className="w-3 h-3" />
                    <span>{field.allowedFileTypes.join(', ')}</span>
                </div>
            )}
            {field.maxFileSize && (
                 <div className="flex items-center gap-1">
                    <span className="font-semibold bg-gray-100 px-1 rounded text-gray-500">Máx: {field.maxFileSize}MB</span>
                </div>
            )}
        </div>
    </div>
  );
};
