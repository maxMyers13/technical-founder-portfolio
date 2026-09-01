import React from 'react';
import { STARTER_QUESTIONS } from '../../constants';
import { NanoStatus } from '../../lib/wm3/nano';
import { AnswerLane, AssistantMessage, LanePreference, Message, Route, Source } from '../../types';
import { serif } from '../ui/styles';

const eyebrow: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: '.16em',
  textTransform: 'uppercase',
  color: 'var(--mute)',
};

/** Says which lane wrote a given answer, so the receipts cover the model too. */
const LANE_NOTE: Record<AnswerLane, string> = {
  cloud: 'written by a hosted model, from the sources below',
  nano: 'written on your device by Gemini Nano, from the sources below',
  quoted: 'quoted straight from the archive — no model wrote this',
};

/** The lane switcher. Ask the same thing twice and watch them differ. */
const LANE_OPTIONS: { key: LanePreference; label: string }[] = [
  { key: 'auto', label: 'Auto' },
  { key: 'cloud', label: 'Cloud' },
  { key: 'nano', label: 'On-device' },
  { key: 'quoted', label: 'Quotes' },
];

const lanePill = (active: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  height: 26,
  padding: '0 11px',
  borderRadius: 9999,
  fontSize: 11.5,
  ...(active
    ? { background: 'var(--ink)', color: 'var(--bg)', fontWeight: 600 }
    : { border: '1px solid var(--hair)', color: 'var(--body)', fontWeight: 500 }),
});

/** One line about which lane is answering, and how far off the other one is. */
function laneNote(nano: NanoStatus): string | null {
  switch (nano.state) {
    case 'ready':
      return 'writing answers with Chrome’s on-device model — nothing leaves this page';
    case 'downloading':
      return `fetching Chrome’s on-device model — ${nano.percent}% · quoting the archive until it lands`;
    case 'downloadable':
      return 'ask something and Chrome’s on-device model starts downloading in the background';
    default:
      return null;
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

const SourceCard: React.FC<{ source: Source; onNavigate: (route: Route) => void }> = ({
  source,
  onNavigate,
}) => (
  <div
    style={{
      border: '1px solid var(--line)',
      borderRadius: 10,
      background: 'var(--bg2)',
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
    }}
  >
    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{source.title}</span>
    <span style={{ fontSize: 12, color: 'var(--mute)' }}>
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
      className="h-underline"
      style={{
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--ink)',
        borderBottom: '1px solid var(--hair)',
        paddingBottom: 1,
        alignSelf: 'flex-start',
        marginTop: 4,
      }}
    >
      open source →
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
    <div
      data-m="msg"
      style={{
        marginTop: 22,
        display: 'grid',
        gridTemplateColumns: '34px 1fr',
        gap: 18,
        alignItems: 'start',
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          border: '1px solid var(--ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 7.5,
          fontWeight: 800,
          letterSpacing: '.1em',
          color: 'var(--ink)',
          marginTop: 3,
        }}
      >
        WM3
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        {message.pending && !message.error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
            <span style={serif(15)}>
              reading the archive
              <span style={{ animation: 'wm3dot 1.2s ease-in-out 0s infinite' }}>.</span>
              <span style={{ animation: 'wm3dot 1.2s ease-in-out .2s infinite' }}>.</span>
              <span style={{ animation: 'wm3dot 1.2s ease-in-out .4s infinite' }}>.</span>
            </span>
            {message.pendingNote && (
              <span style={{ fontSize: 12, color: 'var(--mute)' }}>{message.pendingNote}</span>
            )}
          </div>
        )}

        {message.text.length > 0 && !message.error && (
          <p
            style={{
              fontSize: 16.5,
              lineHeight: 1.75,
              color: 'var(--ink)',
              whiteSpace: 'pre-wrap',
              textWrap: 'pretty',
            }}
          >
            {message.text + (message.streaming && !message.pending ? ' ▍' : '')}
          </p>
        )}

        {message.error && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              border: '1px solid var(--line)',
              borderRadius: 10,
              background: 'var(--bg2)',
              padding: '16px 18px',
            }}
          >
            <span style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--body)' }}>
              WM3 couldn’t reach the archive just now. Nothing was made up in the meantime.
            </span>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onRetry();
              }}
              className="h-underline"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--ink)',
                borderBottom: '1px solid var(--hair)',
                paddingBottom: 1,
                alignSelf: 'flex-start',
              }}
            >
              Try again
            </a>
          </div>
        )}

        {settled && message.lane && (
          <span style={serif(13)}>{LANE_NOTE[message.lane]}</span>
        )}

        {settled && message.sources.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span style={{ ...eyebrow, marginRight: 2 }}>sources</span>
              {message.sources.map((source, j) => (
                <a
                  key={source.title}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onToggleSource(`${index}-${j}`);
                  }}
                  className="h-source"
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--body)',
                    border: '1px solid var(--hair)',
                    borderRadius: 9999,
                    padding: '6px 13px',
                  }}
                >
                  {source.title} · {source.date}
                </a>
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
}) => (
  <main
    style={{
      maxWidth: 760,
      margin: '0 auto',
      padding: '64px 24px 0',
      minHeight: 'calc(100vh - 71px)',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 20 }}>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onNavigate('home');
        }}
        className="h-ink"
        style={serif(15)}
      >
        ← back
      </a>
      {messages.length > 0 && (
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onClear();
          }}
          className="h-clear"
          style={{ ...serif(14), borderBottom: '1px solid transparent' }}
        >
          clear conversation
        </a>
      )}
    </div>

    <h1
      style={{
        fontSize: 44,
        fontWeight: 900,
        letterSpacing: '-.045em',
        lineHeight: 1,
        color: 'var(--ink)',
        marginTop: 36,
      }}
    >
      Ask WM3
    </h1>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 20,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ ...eyebrow, marginRight: 2 }}>lane</span>
      {LANE_OPTIONS.map((option) => (
        <a
          key={option.key}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onPreferenceChange(option.key);
          }}
          style={lanePill(option.key === preference)}
        >
          {option.label}
        </a>
      ))}
    </div>

    <p
      style={{
        fontSize: 15.5,
        lineHeight: 1.65,
        color: 'var(--mute)',
        marginTop: 14,
        maxWidth: 560,
        textWrap: 'pretty',
      }}
    >
      WM3 answers from my public archive — the builds, talks and posts on this site. It’s an
      interface to the archive, not a digital me, and it says so when something isn’t in there.
    </p>

    {messages.length === 0 && (
      <div style={{ marginTop: 52, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ ...eyebrow, fontSize: 10, marginBottom: 14 }}>try one of these</span>
        {STARTER_QUESTIONS.map((q) => (
          <a
            key={q}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onAsk(q);
            }}
            className="h-starter"
            style={{
              ...serif(19, 'var(--body)'),
              padding: '11px 0',
              borderBottom: '1px solid var(--line)',
            }}
          >
            {q}
          </a>
        ))}
        <span style={{ ...serif(13.5), marginTop: 22, maxWidth: 520 }}>
          runs entirely in your browser — your question is embedded on your machine and matched
          against 213 of Max’s posts plus the pages of this site. Nothing is sent anywhere, and when
          the archive has no answer it says so instead of guessing.
        </span>
      </div>
    )}

    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {messages.map((message, i) =>
        message.role === 'user' ? (
          <div
            key={i}
            style={{ marginTop: 44, paddingTop: 26, borderTop: '1px solid var(--line)' }}
          >
            <span style={serif(17.5)}>“{message.text}”</span>
          </div>
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

    <div style={{ flex: 1 }} />

    <div
      style={{
        position: 'sticky',
        bottom: 0,
        marginTop: 44,
        padding: '24px 0 26px',
        background: 'linear-gradient(to top, var(--bg) 76%, transparent)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 10,
          border: '1px solid var(--hair)',
          borderRadius: 14,
          background: 'var(--card)',
          padding: '11px 11px 11px 18px',
        }}
      >
        <textarea
          rows={1}
          value={composer}
          onChange={(e) => onComposerChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Ask the archive…"
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            resize: 'none',
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontSize: 15.5,
            lineHeight: 1.55,
            color: 'var(--ink)',
            maxHeight: 170,
            overflow: 'auto',
            padding: '6px 0',
          }}
        />
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSend();
          }}
          title="Send"
          className="h-btn-solid"
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'var(--ink)',
            color: 'var(--bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 17,
            fontWeight: 700,
            flex: 'none',
          }}
        >
          ↑
        </a>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 9,
          padding: '0 4px',
        }}
      >
        <span style={{ fontSize: 11, color: 'var(--mute)' }}>
          {laneNote(nano) ?? 'Enter sends · Shift+Enter for a new line'}
        </span>
        {streaming && (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onStop();
            }}
            className="h-stop"
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: 'var(--mute)',
              borderBottom: '1px solid var(--hair)',
            }}
          >
            stop
          </a>
        )}
      </div>
    </div>
  </main>
);

export default Ask;
