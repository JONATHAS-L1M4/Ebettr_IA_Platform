import React, { useEffect, useState } from 'react';
import { ConfigField } from '../../types';

const inputBaseClass =
  'w-full px-3 py-2 bg-background border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background text-sm placeholder:text-muted-foreground shadow-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50';
import { Link, AlertCircle } from '../ui/Icons';

interface UrlFieldProps {
  field: ConfigField;
  onChange: (value: string) => void;
}

export const UrlField: React.FC<UrlFieldProps> = ({ field, onChange }) => {
  const [error, setError] = useState('');
  const value = field.value as string;

  useEffect(() => {
    if (value && !value.includes('://')) {
      setError('A URL deve conter o protocolo (ex: https://)');
    } else {
      setError('');
    }
  }, [value]);

  return (
    <div className="space-y-1">
      <div className="group relative">
        <div className="absolute left-3 top-2.5 text-muted-foreground transition-colors group-focus-within:text-foreground">
          <Link className="h-4 w-4" />
        </div>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || 'https://exemplo.com'}
          className={`${inputBaseClass} pl-10 ${error ? 'border-destructive/40 focus-visible:border-destructive focus-visible:ring-destructive' : ''}`}
        />
      </div>

      {error && (
        <div className="flex items-center gap-1 text-[10px] text-destructive animate-fade-in">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
