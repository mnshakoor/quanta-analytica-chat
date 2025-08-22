
import React from 'react';
import { IconGemini } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="flex items-center p-4 border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
      <IconGemini className="w-8 h-8 mr-3 text-gray-300" />
      <h1 className="text-xl font-semibold text-gray-200">Gemini Chat</h1>
    </header>
  );
};

export default Header;
