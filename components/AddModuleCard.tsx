
import React from 'react';
import { DashedAddCard } from './ui/DashedAddCard';
import { Plus } from './ui/Icons';

interface AddModuleCardProps {
  onClick: () => void;
}

export const AddModuleCard: React.FC<AddModuleCardProps> = ({ onClick }) => {
  return (
    <DashedAddCard 
        label="Adicionar Módulo" 
        onClick={onClick} 
        sparkColor="oklch(0.5393 0.2713 286.7462)" // Violet Primary
        icon={Plus}
        className="min-h-[200px]" // Ajuste de altura para alinhar com ConfigCards
    />
  );
};
