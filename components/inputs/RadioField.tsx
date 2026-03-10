
import React from 'react';
import { ConfigField, SelectOption } from '../../types';

interface RadioFieldProps {
  field: ConfigField;
  onChange: (value: string) => void;
}

export const RadioField: React.FC<RadioFieldProps> = ({ field, onChange }) => {
  const options: SelectOption[] = (field.options || []).map(opt => 
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  return (
    <div className="space-y-1">
      {options.map(opt => {
        const valStr = String(opt.value);
        return (
          <label key={valStr} className="flex items-center gap-2 cursor-pointer group/radio">
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${(field.value as string) === valStr ? 'border-black bg-white' : 'border-gray-300 bg-white group-hover/radio:border-gray-400'}`}>
                {(field.value as string) === valStr && <div className="w-2 h-2 bg-black rounded-full" />}
            </div>
            <input 
              type="radio"
              name={field.id}
              className="hidden"
              checked={(field.value as string) === valStr}
              onChange={() => onChange(valStr)}
            />
            <span className={`text-sm transition-colors ${(field.value as string) === valStr ? 'text-black font-medium' : 'text-gray-600'}`}>{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
};
