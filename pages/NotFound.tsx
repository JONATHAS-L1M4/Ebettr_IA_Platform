import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Ban, FileQuestion, Home } from '../components/ui/Icons';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center animate-fade-in">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full flex flex-col items-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-400">
          <FileQuestion className="w-10 h-10" />
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Página não encontrada</h2>
        
        <p className="text-gray-500 mb-8 leading-relaxed">
          Ops! A página que você está procurando parece ter sido movida, excluída ou nunca existiu.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button 
            onClick={() => navigate(-1)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          
          <button 
            onClick={() => navigate('/agents')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Home className="w-4 h-4" />
            Ir para Início
          </button>
        </div>
      </div>
      
      <div className="mt-8 text-xs text-gray-400 font-mono">
        Error Code: 404_NOT_FOUND
      </div>
    </div>
  );
};

export default NotFound;
