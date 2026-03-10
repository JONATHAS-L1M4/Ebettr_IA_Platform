import React from 'react';
import { DashedAddCard } from './ui/DashedAddCard';
import { Plus } from './ui/Icons';

interface AddModuleCardProps {
  onClick: () => void;
}

export const AddModuleCard: React.FC<AddModuleCardProps> = ({ onClick }) => {
  return (
    <DashedAddCard
      label="Adicionar Modulo"
      onClick={onClick}
      icon={Plus}
      className="min-h-[200px]"
    />
  );
};
