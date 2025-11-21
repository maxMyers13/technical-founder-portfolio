import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  noHover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', noHover = false }) => {
  return (
    <div 
      className={`
        relative group overflow-hidden rounded-sm border border-slate-800 bg-[#00041F]/80 backdrop-blur-sm p-6 transition-all duration-300
        ${!noHover ? 'hover:border-brightBlue/50 hover:shadow-[0_0_20px_rgba(0,117,255,0.15)] hover:-translate-y-1' : ''}
        ${className}
      `}
    >
      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-slate-600 group-hover:border-brightBlue transition-colors duration-300" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-slate-600 group-hover:border-accentPurple transition-colors duration-300" />
      
      {children}
    </div>
  );
};

export default Card;