import React from 'react';
import { DashedAddCard } from './ui/DashedAddCard';
import { Key } from './ui/Icons';

interface AddCredentialCardProps {
  onClick: () => void;
}

export const AddCredentialCard: React.FC<AddCredentialCardProps> = ({ onClick }) => {
  return (
    <DashedAddCard
      label="Adicionar Credencial"
      onClick={onClick}
      icon={Key}
      className="min-h-[200px]"
    />
  );
};
