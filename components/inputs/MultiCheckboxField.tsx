
import React from 'react';
import { ConfigField, SelectOption } from '../../types';
import { CheckCircle2 } from '../ui/Icons';

interface MultiCheckboxFieldProps {
  field: ConfigField;
  onChange: (option: string, isMulti: boolean) => void;
}

export const MultiCheckboxField: React.FC<MultiCheckboxFieldProps> = ({ field, onChange }) => {
  const options: SelectOption[] = (field.options || []).map(opt => 
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  return (
    <div className="space-y-1">
      {options.map(opt => {
        const valStr = String(opt.value);
        const isSelected = (field.value as string[]).includes(valStr);
        return (
          <label key={valStr} className="flex items-center gap-2 cursor-pointer group/chk">
            <div className={`w-4 h-4 flex items-center justify-center border rounded transition-colors ${isSelected ? 'bg-black border-black' : 'bg-white border-gray-300 group-hover/chk:border-gray-400'}`}>
                {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
            </div>
            <input 
              type="checkbox"
              className="hidden"
              checked={isSelected}
              onChange={() => onChange(valStr, true)}
            />
            <span className={`text-sm transition-colors ${isSelected ? 'text-black font-medium' : 'text-gray-600'}`}>{opt.label}</span>
          </label>
        )
      })}
    </div>
  );
};
