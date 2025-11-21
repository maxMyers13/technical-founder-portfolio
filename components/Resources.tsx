import React from 'react';
import { Book, FileText, Terminal } from 'lucide-react';
import { RESOURCES } from '../constants';
import Card from './ui/Card';

const Resources: React.FC = () => {
  return (
    <section id="resources" className="py-24 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-white">Knowledge Base</h2>
        <div className="h-1 w-20 bg-gradient-to-r from-brightBlue to-accentPurple mx-auto mt-4 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {RESOURCES.map((resource) => (
          <Card key={resource.id} className="bg-[#010514]">
             <div className="mb-4 p-3 bg-slate-900/50 w-fit rounded-md border border-slate-800">
                {resource.type === 'GitBook' && <Book className="text-brightBlue" size={24} />}
                {resource.type === 'SOP' && <FileText className="text-accentPurple" size={24} />}
                {resource.type === 'Cookbook' && <Terminal className="text-emerald-400" size={24} />}
             </div>
             <h3 className="text-xl font-bold text-white mb-2">{resource.title}</h3>
             <p className="text-slate-400 mb-6 text-sm">{resource.description}</p>
             <a href={resource.link} className="inline-flex items-center text-xs font-mono font-bold text-slate-500 hover:text-white uppercase tracking-wider transition-colors">
               Read Entry_ <span className="ml-1 text-brightBlue">&rarr;</span>
             </a>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default Resources;