import React from 'react';
import { Linkedin, Twitter, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-inkNavy pt-20 border-t border-slate-800">
      <div className="max-w-5xl mx-auto px-6 pb-20 text-center">
        
        <div className="mb-12">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Ready to build?</h2>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Edge AI, WebAssembly, browser internals, or building education infrastructure. Happy to talk.
          </p>
          <a 
            href="mailto:max@learnwleo.com"
            className="inline-block bg-white text-inkNavy px-8 py-4 font-mono font-bold text-lg rounded-sm hover:bg-brightBlue hover:text-white transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,117,255,0.4)]"
          >
            Initiate_Contact()
          </a>
        </div>

        <div className="flex justify-center gap-8 mb-12">
          <a href="https://github.com/maxMyers13" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white hover:scale-110 transition-all">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </a>
          <a href="https://www.linkedin.com/in/maxwellmyers1/" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-[#0077b5] hover:scale-110 transition-all">
            <Linkedin size={24} />
          </a>
          <a href="https://x.com/wmMaxm" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-[#1DA1F2] hover:scale-110 transition-all">
            <Twitter size={24} />
          </a>
          <a href="mailto:max@learnwleo.com" className="text-slate-500 hover:text-red-400 hover:scale-110 transition-all">
            <Mail size={24} />
          </a>
        </div>
        
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs font-mono text-slate-600">
          <p>&copy; {new Date().getFullYear()} Maxwell Myers.</p>
          <p>Built with React + Tailwind.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
