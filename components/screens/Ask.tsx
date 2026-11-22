import React from 'react';
import { STARTER_QUESTIONS } from '../../constants';
import { NanoStatus } from '../../lib/wm3/nano';
import { AnswerLane, AssistantMessage, LanePreference, Message, Route, Source } from '../../types';

/** Says which lane wrote a given answer, so the receipts cover the model too. */
const LANE_NOTE: Record<AnswerLane, string> = {
  cloud: 'Written by a hosted model, from the sources below',
  nano: 'Written on your device by Gemini Nano, from the sources below',
  quoted: 'Quoted straight from the archive. No model wrote this',
};

/** The lane switcher. Ask the same thing twice and watch them differ. `says` is what that choice does with a question. */
const LANE_OPTIONS: { key: LanePreference; label: string; says: string }[] = [
  { key: 'auto', label: 'Auto', says: 'Tries a hosted model first, then Chrome’s on-device model, then plain quotes.' },
  { key: 'cloud', label: 'Cloud', says: 'A hosted model writes the answer, so your question is sent to this site’s server.' },
  { key: 'nano', label: 'On-device', says: 'Chrome’s built-in model writes the answer on your machine. Your question stays in this tab.' },
  { key: 'quoted', label: 'Quotes', says: 'No model at all: the closest passages from the archive, word for word, matched in this tab.' },
];

/** How far along Chrome's on-device model is, when that matters to the lane in use. */
function nanoNote(nano: NanoStatus, preference: LanePreference): string | null {
  if (preference === 'cloud' || preference === 'quoted') return null;
  switch (nano.state) {
    case 'ready':
      return preference === 'nano' ? 'On-device model ready.' : null;
    case 'downloading':
      return `Fetching Chrome’s on-device model: ${nano.percent}%.`;
    case 'downloadable':
      return 'Ask something and Chrome’s on-device model starts downloading in the background.';
    default:
      return preference === 'nano' ? 'This browser has no on-device model, so answers fall back to quotes.' : null;
  }
}

interface Props {
  messages: Message[];
  streaming: boolean;
  nano: NanoStatus;
  preference: LanePreference;
  onPreferenceChange: (p: LanePreference) => void;
  composer: string;
  expanded: Record<string, boolean>;
  onToggleSource: (key: string) => void;
  onComposerChange: (value: string) => void;
  onAsk: (question: string) => void;
  onSend: () => void;
  onStop: () => void;
  onClear: () => void;
  onRetry: () => void;
  onNavigate: (route: Route) => void;
}

const SourceCard: React.FC<{ source: Source; onNavigate: (route: Route) => void }> = ({ source, onNavigate }) => (
  <div className="ask-source">
    <b>{source.title}</b>
    <span>
      {source.date} · {source.path}
    </span>
    <a
      href={source.url ?? '#'}
      target={source.url ? '_blank' : undefined}
      rel="noopener noreferrer"
      onClick={
        source.route
          ? (e) => {
              e.preventDefault();
              onNavigate(source.route!);
            }
          : undefined
      }
    >
      Open source →
    </a>
  </div>
);

const AssistantBubble: React.FC<{
  message: AssistantMessage;
  index: number;
  expanded: Record<string, boolean>;
  onToggleSource: (key: string) => void;
  onRetry: () => void;
  onNavigate: (route: Route) => void;
}> = ({ message, index, expanded, onToggleSource, onRetry, onNavigate }) => {
  const settled = !message.streaming && !message.pending && !message.error;
  const openSources = message.sources.filter((_, j) => expanded[`${index}-${j}`]);

  return (
    <div data-m="msg" className="ask-a">
      <span className="ask-a__badge" aria-hidden="true">
        WM3
      </span>
      <div className="ask-a__body">
        {message.pending && !message.error && (
          <div className="ask-a__pending">
            <b>
              Reading the archive
              <span style={{ animation: 'wm3dot 1.2s ease-in-out 0s infinite' }}>.</span>
              <span style={{ animation: 'wm3dot 1.2s ease-in-out .2s infinite' }}>.</span>
              <span style={{ animation: 'wm3dot 1.2s ease-in-out .4s infinite' }}>.</span>
            </b>
            {message.pendingNote && <span>{message.pendingNote}</span>}
          </div>
        )}

        {message.text.length > 0 && !message.error && (
          <p className="ask-a__text">{message.text + (message.streaming && !message.pending ? ' ▍' : '')}</p>
        )}

        {message.error && (
          <div className="ask-a__error">
            <span>WM3 couldn’t reach the archive just now. Nothing was made up in the meantime.</span>
            <button type="button" className="ask-link" onClick={onRetry}>
              Try again
            </button>
          </div>
        )}

        {settled && message.lane && <span className="ask-a__lane">{LANE_NOTE[message.lane]}</span>}

        {settled && message.sources.length > 0 && (
          <div className="ask-sources">
            <div className="ask-sources__row">
              <span className="ask-label">Sources</span>
              {message.sources.map((source, j) => (
                <button
                  key={source.title}
                  type="button"
                  className="ask-chip"
                  aria-expanded={!!expanded[`${index}-${j}`]}
                  onClick={() => onToggleSource(`${index}-${j}`)}
                >
                  {source.title} · {source.date}
                </button>
              ))}
            </div>
            {openSources.map((source) => (
              <SourceCard key={source.title} source={source} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Ask: React.FC<Props> = ({
  messages,
  streaming,
  nano,
  preference,
  onPreferenceChange,
  composer,
  expanded,
  onToggleSource,
  onComposerChange,
  onAsk,
  onSend,
  onStop,
  onClear,
  onRetry,
  onNavigate,
}) => {
  const empty = messages.length === 0;
  const lane = LANE_OPTIONS.find((o) => o.key === preference) ?? LANE_OPTIONS[0];
  const note = nanoNote(nano, preference);

  const box = (
    <div className={`ask-box${empty ? '' : ' ask-box--dock'}`}>
      <div className="ask-box__field">
        <textarea
          rows={empty ? 2 : 1}
          value={composer}
          aria-label="Your question"
          onChange={(e) => onComposerChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Ask about LILO, a talk, a post, the track years…"
        />
        {streaming ? (
          <button type="button" className="craft-btn ask-send ask-send--stop" onClick={onStop}>
            Stop
          </button>
        ) : (
          <button type="button" className="craft-btn ask-send" onClick={onSend} aria-label="Send">
            Ask
          </button>
        )}
      </div>
      <div className="ask-lanes">
        <span className="ask-label" id="ask-lane-label">
          Answer with
        </span>
        <div className="ask-seg" role="group" aria-labelledby="ask-lane-label">
          {LANE_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={option.key === preference}
              onClick={() => onPreferenceChange(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="ask-lanes__says">
          {lane.says}
          {note ? ` ${note}` : ''}
        </p>
      </div>
    </div>
  );

  return (
    <main className="ask">
      <h1 className="craft-dup">Ask WM3</h1>

      <div className="ask-top">
        <p className="ask-lede">
          Ask anything about my work. Answers come from my public archive, <b>213 posts plus the pages of this site</b>,
          with the sources shown. If it isn’t in there, WM3 says so.
        </p>
        {!empty && (
          <button type="button" className="ask-link" onClick={onClear}>
            Clear conversation
          </button>
        )}
      </div>

      {empty && box}

      {empty && (
        <section className="ask-starters" aria-label="Try one of these">
          <p className="ask-label">Or start with one of these</p>
          <ul>
            {STARTER_QUESTIONS.map((q) => (
              <li key={q}>
                <button type="button" onClick={() => onAsk(q)}>
                  <span aria-hidden="true">?</span>
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!empty && (
        <div className="ask-thread">
          {messages.map((message, i) =>
            message.role === 'user' ? (
              <p key={i} className="ask-q">
                {message.text}
              </p>
            ) : (
              <AssistantBubble
                key={i}
                message={message}
                index={i}
                expanded={expanded}
                onToggleSource={onToggleSource}
                onRetry={onRetry}
                onNavigate={onNavigate}
              />
            ),
          )}
        </div>
      )}

      {!empty && box}
    </main>
  );
};

export default Ask;
