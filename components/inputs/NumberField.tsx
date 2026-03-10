
import React from 'react';
import { ConfigField } from '../../types';
import { inputBaseClass } from './styles';

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
