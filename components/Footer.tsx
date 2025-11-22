import React from 'react';
import { Github, Linkedin, Twitter, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-inkNavy pt-20 border-t border-slate-800">
      <div className="max-w-5xl mx-auto px-6 pb-20 text-center">
        
        <div className="mb-12">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Ready to build?</h2>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Whether it's systems architecture, team scaling, or just nerding out about WebAssembly.
          </p>
          <a 
            href="mailto:hello@example.com"
            className="inline-block bg-white text-inkNavy px-8 py-4 font-mono font-bold text-lg rounded-sm hover:bg-brightBlue hover:text-white transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,117,255,0.4)]"
          >
            Initiate_Contact()
          </a>
        </div>

        <div className="flex justify-center gap-8 mb-12">
          <a href="#" className="text-slate-500 hover:text-white hover:scale-110 transition-all">
            <Github size={24} />
          </a>
          <a href="#" className="text-slate-500 hover:text-[#0077b5] hover:scale-110 transition-all">
            <Linkedin size={24} />
          </a>
          <a href="#" className="text-slate-500 hover:text-[#1DA1F2] hover:scale-110 transition-all">
            <Twitter size={24} />
          </a>
          <a href="#" className="text-slate-500 hover:text-red-400 hover:scale-110 transition-all">
            <Mail size={24} />
          </a>
        </div>
        
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs font-mono text-slate-600">
          <p>&copy; {new Date().getFullYear()} Max M. All systems nominal.</p>
          <p>Built with React + Tailwind + &lt;3</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;