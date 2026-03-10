
import React from 'react';
import { ConfigField } from '../../types';
import Toggle from '../ui/Toggle';

interface SwitchFieldProps {
  field: ConfigField;
  onChange: (checked: boolean) => void;
}

export const SwitchField: React.FC<SwitchFieldProps> = ({ field, onChange }) => (
  <div className="flex items-center justify-between py-2 px-1">
    <span className="text-xs text-gray-500 font-medium">{field.value ? 'Ativo' : 'Inativo'}</span>
    <Toggle 
      checked={field.value as boolean} 
      onChange={onChange}
      size="sm"
    />
  </div>
);
