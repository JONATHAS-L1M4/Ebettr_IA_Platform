
import React from 'react';
import { ConfigField } from '../../types';

interface CheckboxFieldProps {
  field: ConfigField;
  onChange: (checked: boolean) => void;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({ field, onChange }) => (
  <label className="flex items-center gap-2 p-2 border border-gray-200 rounded-md bg-white hover:border-gray-300 cursor-pointer transition-all">
    <input 
      type="checkbox"
      checked={field.value as boolean}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black accent-black"
    />
    <span className="text-sm text-gray-700">{field.placeholder || 'Ativar opção'}</span>
  </label>
);
