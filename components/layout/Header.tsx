import React from 'react';
import { SidebarTrigger } from '../ui/sidebar';

export const Header: React.FC = () => {
  return (
    <header className="md:hidden h-16 mt-2 bg-gray-50 px-4 flex items-center justify-between border-b border-gray-200 shrink-0">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="h-10 w-10 -ml-2 text-gray-500 hover:text-black hover:bg-gray-100" />
        <div>
          <img
            src="http://img.ebettr.com/images/2026/03/06/logotipo.png"
            alt="Ebettr IA"
            className="h-6 w-auto object-contain brightness-0"
          />
        </div>
      </div>
    </header>
  );
};
