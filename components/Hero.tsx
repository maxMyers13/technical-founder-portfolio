import React from 'react';
import { ArrowRight, Cpu, Database, Layers } from 'lucide-react';
import Card from './ui/Card';
import { HERO_PROJECTS } from '../constants';

const Hero: React.FC = () => {
  return (
    <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen flex flex-col justify-center">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: Intro */}
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-deepBlue/20 border border-deepBlue/40 text-brightBlue text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brightBlue opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brightBlue"></span>
            </span>
            <span>System Status: ONLINE</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight">
            I build engineering systems that feel <span className="text-transparent bg-clip-text bg-gradient-to-r from-brightBlue to-accentPurple">simple</span>.
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
            No matter how complex they are underneath. Technical Founder & Full-stack Engineer specializing in Browser Internals, AI, and WebAssembly.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
             <button className="group relative px-6 py-3 bg-brightBlue text-white font-mono text-sm font-semibold overflow-hidden rounded-sm">
                <span className="relative z-10 flex items-center gap-2">
                  Explore Projects <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
             </button>
             <button className="px-6 py-3 border border-slate-700 text-slate-300 font-mono text-sm hover:border-slate-500 hover:text-white transition-colors rounded-sm">
                Read Documentation
             </button>
          </div>
          
          {/* Tech Stack Badges */}
          <div className="pt-8 flex gap-6 text-slate-500 border-t border-slate-800/50 mt-8">
            <div className="flex items-center gap-2">
               <Cpu size={18} /> <span className="font-mono text-xs">WASM</span>
            </div>
            <div className="flex items-center gap-2">
               <Database size={18} /> <span className="font-mono text-xs">Infra</span>
            </div>
            <div className="flex items-center gap-2">
               <Layers size={18} /> <span className="font-mono text-xs">Chromium</span>
            </div>
          </div>
        </div>

        {/* Right Column: Project Highlight Cards */}
        <div className="lg:col-span-5 space-y-4 relative">
           <div className="absolute -inset-4 bg-gradient-to-b from-brightBlue/10 to-transparent blur-2xl -z-10" />
           
           {HERO_PROJECTS.map((project, index) => (
             <Card key={project.id} className={`transform ${index === 1 ? 'lg:-translate-x-8' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-brightBlue uppercase">{project.category}</span>
                  <ArrowRight size={14} className="text-slate-600 -rotate-45" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{project.title}</h3>
                <p className="text-sm text-slate-400 line-clamp-2">{project.description}</p>
             </Card>
           ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;