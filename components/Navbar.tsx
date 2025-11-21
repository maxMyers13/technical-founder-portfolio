import React from 'react';
import { Menu, Terminal } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-inkNavy/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-brightBlue">
          <Terminal size={20} />
          <span className="font-mono font-bold tracking-tight text-white">DEVON_K</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8 text-sm font-mono text-slate-400">
          <a href="#work" className="hover:text-brightBlue transition-colors">~/work</a>
          <a href="#about" className="hover:text-brightBlue transition-colors">~/about</a>
          <a href="#resources" className="hover:text-brightBlue transition-colors">~/resources</a>
          <a 
            href="#contact" 
            className="px-4 py-2 border border-slate-700 text-white hover:bg-brightBlue hover:border-brightBlue transition-all rounded-sm"
          >
            Contact.exec
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-slate-300 hover:text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-800 bg-inkNavy">
          <div className="flex flex-col space-y-4 p-6 font-mono text-sm text-slate-300">
            <a href="#work" onClick={() => setIsOpen(false)}>~/work</a>
            <a href="#about" onClick={() => setIsOpen(false)}>~/about</a>
            <a href="#resources" onClick={() => setIsOpen(false)}>~/resources</a>
            <a href="#contact" onClick={() => setIsOpen(false)} className="text-brightBlue">Contact.exec</a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;