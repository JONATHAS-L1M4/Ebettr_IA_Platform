
import React from 'react';
import { DashedAddCard } from '../ui/DashedAddCard';

interface CreateAgentCardProps {
  onClick: () => void;
}

export const CreateAgentCard: React.FC<CreateAgentCardProps> = ({ onClick }) => {
  return (
    <DashedAddCard
      label="Criar Agente"
      onClick={onClick}
    />
  );
};
