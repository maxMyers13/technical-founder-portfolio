import React from 'react';
import { ExternalLink, Mic } from 'lucide-react';
import { SPEAKING_DATA } from '../constants';

const Speaking: React.FC = () => {
  const talk = SPEAKING_DATA[0];

  return (
    <section className="py-16 px-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6 font-mono">// Speaking</h2>

      <div className="border border-slate-800 rounded-sm bg-[#020617] p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center shrink-0 border border-slate-800">
            <Mic size={18} className="text-brightBlue" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-200">
              {talk.event}
            </h3>
            <p className="text-white font-medium">&ldquo;{talk.title}&rdquo;</p>
            <p className="text-slate-400 text-sm leading-relaxed">{talk.description}</p>
            <a
              href={talk.recordingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-mono text-brightBlue hover:text-white transition-colors pt-1"
            >
              Watch recording <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Speaking;
