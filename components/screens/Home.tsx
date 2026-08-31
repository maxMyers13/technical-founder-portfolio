import React from 'react';
import { COOKBOOK_URL, LILO_URL, NOW_ITEMS, RESUME_POST_URL, WEBVIEW2_RELEASE_NOTES_URL } from '../../constants';
import { Route } from '../../types';
import { inlineLink, sectionHeader, sectionTitle, serif } from '../ui/styles';

const section: React.CSSProperties = {
  maxWidth: 1240,
  margin: '0 auto',
  padding: '110px 44px 0',
};

const rowStyle = (lastColumn: number): React.CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: `120px 1fr ${lastColumn}px`,
  gap: 32,
  alignItems: 'baseline',
  padding: '26px 12px',
  borderBottom: '1px solid var(--line)',
  color: 'inherit',
});

const rowTitle: React.CSSProperties = {
  fontSize: 21,
  fontWeight: 700,
  letterSpacing: '-.02em',
  color: 'var(--ink)',
};

const rowBlurb: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.55,
  color: 'var(--body)',
  maxWidth: 660,
};

const changelogRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '150px 1fr',
  gap: 32,
  alignItems: 'baseline',
  padding: '20px 12px',
  borderBottom: '1px solid var(--line)',
};

interface Props {
  onNavigate: (route: Route) => void;
  askValue: string;
  onAskChange: (value: string) => void;
  onAsk: (question: string) => void;
}

const Home: React.FC<Props> = ({ onNavigate, askValue, onAskChange, onAsk }) => {
  const go = (route: Route) => (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate(route);
  };

  return (
    <main>
      <section
        style={{
          ...section,
          padding: '96px 44px 0',
          display: 'grid',
          gridTemplateColumns: '1.15fr .85fr',
          gap: 72,
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <h1
            style={{
              fontSize: 'clamp(52px,6.4vw,92px)',
              fontWeight: 900,
              letterSpacing: '-.05em',
              lineHeight: 0.94,
              color: 'var(--ink)',
            }}
          >
            Yo, I’m Max.
          </h1>
          <p
            style={{
              fontSize: 19,
              lineHeight: 1.65,
              color: 'var(--body)',
              maxWidth: 600,
              textWrap: 'pretty',
            }}
          >
            I run{' '}
            <a
              href={LILO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="h-underline"
              style={inlineLink}
            >
              LILO
            </a>
            , a coding-education thing that lives entirely in the browser. Before that: five years in
            and around Microsoft Edge — three internships, then full-time in the engine. This site is
            neither of those things.
          </p>
          <p
            style={{
              fontSize: 19,
              lineHeight: 1.65,
              color: 'var(--body)',
              maxWidth: 600,
              textWrap: 'pretty',
            }}
          >
            It’s my archive — what I’m building, writing, and currently obsessed with. Poke around,
            or skip the browsing and{' '}
            <a href="#" onClick={go('ask')} className="h-underline" style={inlineLink}>
              ask WM3
            </a>
            .
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px 26px',
              ...serif(16),
            }}
          >
            <span>Baltimore, most days</span>
            <span>·</span>
            <span>ex–track captain, still fast-ish</span>
            <span>·</span>
            <span>professionally allergic to unclear instructions</span>
          </div>
        </div>

        <div
          data-m="tilt"
          style={{
            transform: 'rotate(-1.5deg)',
            justifySelf: 'end',
            width: '100%',
            maxWidth: 400,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            background: 'var(--card)',
            border: '1px solid var(--line)',
            borderRadius: 4,
            padding: '14px 14px 16px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <img
            src="/assets/max-portrait.jpeg"
            alt="Max Myers"
            style={{
              width: '100%',
              height: 420,
              objectFit: 'cover',
              objectPosition: '50% 14%',
              borderRadius: 2,
            }}
          />
          <span style={{ ...serif(15), textAlign: 'center' }}>
            me, pretending the photographer isn’t there
          </span>
        </div>
      </section>

      <section style={section}>
        <div style={sectionHeader}>
          <h2 style={sectionTitle}>Now</h2>
          <span style={serif(16)}>hand-updated · August 2026</span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 0,
            borderLeft: '1px solid var(--line)',
          }}
        >
          {NOW_ITEMS.map((item) => (
            <div
              key={item.label}
              style={{
                padding: '30px 28px',
                borderRight: '1px solid var(--line)',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <span style={serif(16)}>{item.label}</span>
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: 'var(--ink)',
                  fontWeight: 500,
                }}
              >
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section style={section}>
        <div style={sectionHeader}>
          <h2 style={sectionTitle}>Writing</h2>
          <a
            href="#"
            onClick={go('writing')}
            className="h-ink"
            style={{ fontSize: 14, fontWeight: 600, color: 'var(--body)' }}
          >
            The whole archive →
          </a>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <a
            href={RESUME_POST_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-m="row"
            className="h-row"
            style={rowStyle(130)}
          >
            <span style={serif(15)}>2025</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={rowTitle}>How to tailor your resume</span>
              <span style={rowBlurb}>
                The full method I teach students, documented properly instead of as a thread.
              </span>
            </div>
            <span style={{ justifySelf: 'end', ...serif(15) }}>guide</span>
          </a>
          <a
            href={COOKBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-m="row"
            className="h-row"
            style={rowStyle(130)}
          >
            <span style={serif(15)}>2025</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={rowTitle}>LLM prompt cookbook</span>
              <span style={rowBlurb}>
                Recipes for structured extraction that survive contact with real data.
              </span>
            </div>
            <span style={{ justifySelf: 'end', ...serif(15) }}>cookbook</span>
          </a>
          <a href="#" onClick={go('writing')} data-m="row" className="h-row" style={rowStyle(130)}>
            <span style={serif(15)}>2022–now</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={rowTitle}>The LinkedIn archive</span>
              <span style={rowBlurb}>
                200-some posts — the actual writing. Currently being ingested into this site, so WM3
                can quote it back at you.
              </span>
            </div>
            <span style={{ justifySelf: 'end', ...serif(15) }}>archive · ingesting</span>
          </a>
        </div>
      </section>

      <section style={section}>
        <div style={sectionHeader}>
          <h2 style={sectionTitle}>Builds</h2>
          <a
            href="#"
            onClick={go('builds')}
            className="h-ink"
            style={{ fontSize: 14, fontWeight: 600, color: 'var(--body)' }}
          >
            Everything, serious and stupid →
          </a>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <a href="#" onClick={go('lilo')} data-m="row" className="h-row" style={rowStyle(150)}>
            <span style={serif(15)}>the big one</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={rowTitle}>LILO</span>
              <span style={rowBlurb}>
                Coding education with no cloud sandbox — Python, Java, C/C++/Rust and an AI tutor,
                all inside the student’s browser.
              </span>
            </div>
            <span
              style={{ justifySelf: 'end', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}
            >
              Case study →
            </span>
          </a>
          <a
            href={WEBVIEW2_RELEASE_NOTES_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-m="row"
            className="h-row"
            style={rowStyle(150)}
          >
            <span style={serif(15)}>day job, once</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={rowTitle}>Find on Page API, WebView2</span>
              <span style={rowBlurb}>
                Led it end-to-end at Microsoft: 14 features, three language projections, shipped to
                stable.
              </span>
            </div>
            <span
              style={{ justifySelf: 'end', fontSize: 14, fontWeight: 600, color: 'var(--mute)' }}
            >
              Docs →
            </span>
          </a>
          <a href="#" onClick={go('builds')} data-m="row" className="h-row" style={rowStyle(150)}>
            <span style={serif(15)}>hackathon</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={rowTitle}>Media Telemetry Copilot</span>
              <span style={rowBlurb}>
                A VS Code extension that lets Copilot diagnose PlayReady media failures from
                telemetry. Screenshot in Builds.
              </span>
            </div>
            <span
              style={{ justifySelf: 'end', fontSize: 14, fontWeight: 600, color: 'var(--mute)' }}
            >
              More →
            </span>
          </a>
          <a href="#" onClick={go('ask')} data-m="row" className="h-row" style={rowStyle(150)}>
            <span style={serif(15)}>meta · new</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={rowTitle}>WM3, this site’s brain</span>
              <span style={rowBlurb}>
                Retrieval over my public archive — embeddings, an allowlist, streamed answers with
                citations. You’re inside it right now.
              </span>
            </div>
            <span
              style={{ justifySelf: 'end', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}
            >
              Ask WM3 →
            </span>
          </a>
        </div>
      </section>

      <section style={section}>
        <div style={sectionHeader}>
          <h2 style={sectionTitle}>Ask WM3</h2>
          <span style={serif(16)}>an interface to the archive — not the man</span>
        </div>
        <div
          style={{
            marginTop: 40,
            maxWidth: 780,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 16,
              alignItems: 'flex-end',
              borderBottom: '2px solid var(--ink)',
              paddingBottom: 14,
            }}
          >
            <input
              value={askValue}
              onChange={(e) => onAskChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onAsk(askValue);
                }
              }}
              placeholder="Ask about anything I’ve built, written, or run…"
              style={{
                flex: 1,
                minWidth: 0,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 21,
                fontWeight: 500,
                color: 'var(--ink)',
                fontFamily: "'Poppins', system-ui, sans-serif",
                padding: 0,
              }}
            />
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onAsk(askValue);
              }}
              className="h-mute"
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--ink)',
                whiteSpace: 'nowrap',
                paddingBottom: 2,
              }}
            >
              Ask →
            </a>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 28px', ...serif(16) }}>
            {[
              'What is Max building right now?',
              'Why did he leave Microsoft?',
              'What does WM3 actually stand for?',
            ].map((q) => (
              <a
                key={q}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onAsk(q);
                }}
                className="h-chip"
                style={{ color: 'var(--mute)', borderBottom: '1px solid transparent' }}
              >
                {q}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section style={{ ...section, padding: '110px 44px 128px' }}>
        <div style={sectionHeader}>
          <h2 style={sectionTitle}>Changelog</h2>
          <span style={serif(16)}>proof this thing is alive</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={changelogRow}>
            <span style={serif(15)}>Aug 31, 2026</span>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--ink)', maxWidth: 680 }}>
              Rebuilt this site around the archive. WM3 streams answers with citations now — demo
              slice until ingestion finishes.
            </p>
          </div>
          <div style={changelogRow}>
            <span style={serif(15)}>Aug 2026</span>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--body)', maxWidth: 680 }}>
              WM3’s retrieval backend in progress: a deny-by-default allowlist over the public posts,
              embeddings, receipts.
            </p>
          </div>
          <div style={changelogRow}>
            <span style={serif(15)}>Jul 2026</span>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--body)', maxWidth: 680 }}>
              Last day at Microsoft.{' '}
              <a href="#" onClick={go('lilo')} className="h-underline" style={inlineLink}>
                LILO
              </a>{' '}
              is the whole job now.
            </p>
          </div>
          <div style={changelogRow}>
            <span style={serif(15)}>Q2 2026</span>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--body)', maxWidth: 680 }}>
              SRE Day, Seattle + Austin: “Killing the Cloud Sandbox.”{' '}
              <a href="#" onClick={go('speaking')} className="h-underline" style={inlineLink}>
                Talk &amp; slides
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
