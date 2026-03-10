
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
        sparkColor="oklch(0.5393 0.2713 286.7462)" // Violet Primary
    />
  );
};
