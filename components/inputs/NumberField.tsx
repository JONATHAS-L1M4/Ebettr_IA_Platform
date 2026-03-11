
import React from 'react';
import { ConfigField } from '../../types';

const inputBaseClass =
  'w-full px-3 py-2 bg-background border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background text-sm placeholder:text-muted-foreground shadow-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50';

interface NumberFieldProps {
  field: ConfigField;
  onChange: (value: number) => void;
}

export const NumberField: React.FC<NumberFieldProps> = ({ field, onChange }) => (
  <input 
    type="number" 
    step={field.type === 'number_dec' ? "0.01" : "1"}
    value={field.value as number}
    onChange={(e) => onChange(Number(e.target.value))}
    placeholder={field.placeholder}
    min={field.min}
    max={field.max}
    className={inputBaseClass}
  />
);
