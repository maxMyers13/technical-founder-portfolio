import React from 'react';
import { Mic, Users, Radio } from 'lucide-react';
import { SPEAKING_DATA } from '../constants';

const Speaking: React.FC = () => {
  return (
    <section className="py-20 bg-[#00041F]/50 relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Description */}
          <div className="lg:col-span-4">
            <h2 className="text-3xl font-bold text-white mb-4">Speaking & <br/>Community</h2>
            <p className="text-slate-400 mb-6">
              I believe technical leadership is about elevating the collective intelligence of the room. 
              I share what I learn through talks, workshops, and open-source contributions.
            </p>
            
            <div className="flex gap-8 mt-8">
              <div className="text-center">
                 <div className="text-2xl font-bold text-brightBlue">12+</div>
                 <div className="text-xs font-mono text-slate-500 uppercase mt-1">Keynotes</div>
              </div>
              <div className="text-center">
                 <div className="text-2xl font-bold text-accentPurple">5k+</div>
                 <div className="text-xs font-mono text-slate-500 uppercase mt-1">Students</div>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="lg:col-span-8">
             <div className="border border-slate-800 rounded-sm bg-[#020617]">
                {SPEAKING_DATA.map((item, idx) => (
                  <div 
                    key={item.id} 
                    className={`p-6 flex flex-col md:flex-row md:items-center gap-4 group hover:bg-white/[0.02] transition-colors ${idx !== SPEAKING_DATA.length - 1 ? 'border-b border-slate-800' : ''}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border border-slate-800 group-hover:border-slate-600">
                       {item.type === 'Keynote' && <Mic size={20} className="text-brightBlue" />}
                       {item.type === 'Panel' && <Users size={20} className="text-accentPurple" />}
                       {item.type === 'Workshop' && <Radio size={20} className="text-emerald-400" />}
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-1">
                         <h4 className="text-lg font-semibold text-slate-200 group-hover:text-white">{item.event}</h4>
                         <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-400 uppercase tracking-wider">{item.type}</span>
                      </div>
                      <p className="text-slate-400 group-hover:text-brightBlue transition-colors">{item.title}</p>
                    </div>

                    <div className="text-right min-w-[100px]">
                      <span className="font-mono text-sm text-slate-600 group-hover:text-slate-400">{item.date}</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Speaking;