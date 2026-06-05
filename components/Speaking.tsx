import React from 'react';
import { Download, ExternalLink, Mic } from 'lucide-react';
import { SPEAKING_DATA } from '../constants';
import { SpeakingEngagement } from '../types';

const isExternalUrl = (url: string) => url.startsWith('http');

const TalkLink: React.FC<{ link: SpeakingEngagement['primaryLink']; external?: boolean }> = ({
  link,
  external = isExternalUrl(link.url),
}) => {
  const Icon = external ? ExternalLink : Download;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm font-mono text-brightBlue hover:text-white transition-colors"
    >
      {link.label} <Icon size={14} />
    </a>
  );
};

const FeaturedTalk: React.FC<{ talk: SpeakingEngagement }> = ({ talk }) => (
  <div className="border border-slate-800 rounded-sm bg-[#020617] overflow-hidden">
    {talk.previewImage && (
      <div className="border-b border-slate-800 bg-slate-900">
        <img
          src={talk.previewImage}
          alt={`${talk.title} slide preview`}
          className="w-full h-auto opacity-90"
        />
      </div>
    )}

    <div className="p-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center shrink-0 border border-slate-800">
          <Mic size={18} className="text-brightBlue" />
        </div>

        <div className="space-y-3 min-w-0 flex-1">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-200">{talk.event}</h3>
            <p className="text-white font-medium">&ldquo;{talk.title}&rdquo;</p>
            <p className="text-slate-400 text-sm leading-relaxed">{talk.description}</p>
          </div>

          {talk.secondaryPreviewImage && (
            <div className="rounded-sm border border-slate-800 overflow-hidden bg-slate-900/50">
              <img
                src={talk.secondaryPreviewImage}
                alt={`${talk.title} architecture decision slide`}
                className="w-full h-auto opacity-80"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
            <TalkLink link={talk.primaryLink} />
            {talk.secondaryLink && <TalkLink link={talk.secondaryLink} />}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const SecondaryTalk: React.FC<{ talk: SpeakingEngagement }> = ({ talk }) => (
  <div className="border border-slate-800/70 rounded-sm bg-[#010514] p-4">
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-slate-900/80 flex items-center justify-center shrink-0 border border-slate-800/80">
        <Mic size={14} className="text-slate-500" />
      </div>

      <div className="space-y-2 min-w-0">
        <h3 className="text-sm font-semibold text-slate-400">{talk.event}</h3>
        <p className="text-slate-300 text-sm font-medium">&ldquo;{talk.title}&rdquo;</p>
        <p className="text-slate-500 text-xs leading-relaxed">{talk.description}</p>
        <TalkLink link={talk.primaryLink} />
      </div>
    </div>
  </div>
);

const Speaking: React.FC = () => {
  const featuredTalk = SPEAKING_DATA.find((talk) => talk.featured);
  const otherTalks = SPEAKING_DATA.filter((talk) => !talk.featured);

  return (
    <section className="py-16 px-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6 font-mono">// Speaking</h2>

      <div className="space-y-4">
        {featuredTalk && <FeaturedTalk talk={featuredTalk} />}
        {otherTalks.map((talk) => (
          <SecondaryTalk key={talk.id} talk={talk} />
        ))}
      </div>
    </section>
  );
};

export default Speaking;
