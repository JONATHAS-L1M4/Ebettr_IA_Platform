
import React from 'react';
import { Menu } from '../ui/Icons';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu
}) => {
  return (
    // Header visível apenas no mobile (md:hidden)
    <header className="md:hidden h-16 bg-gray-50 px-4 flex items-center justify-between border-b border-gray-200 shrink-0">
      
      {/* Mobile Menu Trigger & Logo */}
      <div className="flex items-center gap-4">
          <button 
            onClick={onOpenMobileMenu}
            className="p-2 -ml-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-md transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div>
            <img src="http://img.ebettr.com/images/2026/03/06/logotipo.png" alt="Ebettr IA" className="h-6 w-auto object-contain brightness-0" />
          </div>
      </div>
    </header>
  );
};
