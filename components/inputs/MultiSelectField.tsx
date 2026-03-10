
import React from 'react';
import { ConfigField, SelectOption } from '../../types';

interface MultiSelectFieldProps {
  field: ConfigField;
  onChange: (option: string, isMulti: boolean) => void;
}

export const MultiSelectField: React.FC<MultiSelectFieldProps> = ({ field, onChange }) => {
  const options: SelectOption[] = (field.options || []).map(opt => 
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  return (
    <div className="border border-gray-200 rounded-md p-2 max-h-32 overflow-y-auto bg-gray-50/50">
      {options.map(opt => {
        const valStr = String(opt.value);
        const isSelected = (field.value as string[]).includes(valStr);
        return (
          <label key={valStr} className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded cursor-pointer transition-colors">
            <input 
              type="checkbox"
              checked={isSelected}
              onChange={() => onChange(valStr, true)}
              className="w-3.5 h-3.5 rounded border-gray-300 text-black focus:ring-black accent-black"
            />
            <span className="text-xs text-gray-700">{opt.label}</span>
          </label>
        )
      })}
    </div>
  );
};
