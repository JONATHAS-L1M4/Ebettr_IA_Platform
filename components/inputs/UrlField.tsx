
import React, { useState, useEffect } from 'react';
import { ConfigField } from '../../types';
import { inputBaseClass } from './styles';
import { Link, AlertCircle } from '../ui/Icons';

interface UrlFieldProps {
  field: ConfigField;
  onChange: (value: string) => void;
}

export const UrlField: React.FC<UrlFieldProps> = ({ field, onChange }) => {
  const [error, setError] = useState('');
  const value = field.value as string;

  // Validação simples ao digitar
  useEffect(() => {
    if (value && !value.includes('://')) {
        setError('A URL deve conter o protocolo (ex: https://)');
    } else {
        setError('');
    }
  }, [value]);

  return (
    <div className="space-y-1">
        <div className="relative group">
            <div className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-black transition-colors">
                <Link className="w-4 h-4" />
            </div>
            <input 
                type="url"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={field.placeholder || "https://exemplo.com"}
                className={`${inputBaseClass} pl-10 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
        </div>
        {error && (
            <div className="flex items-center gap-1 text-[10px] text-red-500 animate-fade-in">
                <AlertCircle className="w-3 h-3" />
                <span>{error}</span>
            </div>
        )}
    </div>
  );
};
