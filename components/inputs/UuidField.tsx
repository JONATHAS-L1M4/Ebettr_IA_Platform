
import React, { useEffect, useState } from 'react';
import { ConfigField } from '../../types';
import { inputBaseClass } from './styles';
import { RotateCcw, Link, Copy, CheckCircle2 } from '../ui/Icons';
import { useNotification } from '../../context/NotificationContext';

interface UuidFieldProps {
  field: ConfigField;
  onChange: (value: string) => void;
}

export const UuidField: React.FC<UuidFieldProps> = ({ field, onChange }) => {
  const { addNotification } = useNotification();
  const [copied, setCopied] = useState(false);

  // Ensure initial value from baseUrl if value is empty
  useEffect(() => {
    if (!field.value && field.baseUrl) {
      onChange(field.baseUrl);
    }
  }, []);

  const displayValue = String(field.value || '');

  const handleCopy = () => {
      navigator.clipboard.writeText(displayValue);
      setCopied(true);
      addNotification('success', 'Link copiado', 'URL do webhook copiada para a área de transferência.');
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
          <div className="absolute left-3 top-2.5 text-gray-400">
              <Link className="w-4 h-4" />
          </div>
          <input 
            type="text"
            value={displayValue}
            readOnly
            className={`${inputBaseClass} pl-9 pr-12 bg-gray-50 text-gray-500 font-mono text-xs focus:ring-0 shadow-inner cursor-pointer select-all`}
            placeholder="Link do webhook..."
            onClick={handleCopy}
          />
          <button 
            type="button"
            onClick={handleCopy}
            className="absolute right-2 top-1.5 p-1 text-gray-400 hover:text-black transition-colors rounded hover:bg-gray-200"
            title="Copiar Link"
          >
             {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
      </div>
    </div>
  );
};
