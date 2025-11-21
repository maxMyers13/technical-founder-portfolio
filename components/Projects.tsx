import React from 'react';
import { ExternalLink, Github } from 'lucide-react';
import { FEATURED_PROJECTS } from '../constants';
import Card from './ui/Card';

const Projects: React.FC = () => {
  return (
    <section id="work" className="py-24 px-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-12 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Featured Work</h2>
          <p className="text-slate-400 mt-2 font-mono text-sm">Index of /projects/public</p>
        </div>
        <span className="hidden md:block text-xs font-mono text-slate-600">Total: {FEATURED_PROJECTS.length} items</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURED_PROJECTS.map((project) => (
          <Card key={project.id} className="h-full flex flex-col">
            <div className="relative h-48 mb-6 overflow-hidden rounded-sm bg-slate-900 border border-slate-800 group-hover:border-slate-700">
               <img 
                 src={project.image} 
                 alt={project.title}
                 className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 grayscale group-hover:grayscale-0" 
               />
               <div className="absolute inset-0 bg-gradient-to-t from-[#00041F] via-transparent to-transparent" />
               <div className="absolute bottom-2 left-2">
                  <span className="px-2 py-1 bg-brightBlue/20 text-brightBlue text-[10px] font-mono border border-brightBlue/30 rounded-sm backdrop-blur-md">
                    {project.category}
                  </span>
               </div>
            </div>
            
            <div className="flex-grow">
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brightBlue transition-colors">
                {project.title}
              </h3>
              <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {project.techStack.map(tech => (
                  <span key={tech} className="text-xs font-mono text-slate-500">#{tech}</span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800/50 mt-auto">
               <a href={project.link} className="flex items-center gap-2 text-sm font-medium text-white hover:text-accentPurple transition-colors">
                 View Project <ExternalLink size={14} />
               </a>
               <Github size={16} className="text-slate-600 hover:text-white transition-colors cursor-pointer" />
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default Projects;