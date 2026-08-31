import React from 'react';
import { EMAIL, SANDBOX_SLIDES, TALK_VIDEO_URL, TECHSGIVING_SLIDES } from '../../constants';
import { Route } from '../../types';
import { pageIntro, pageTitle, serif, solidButton } from '../ui/styles';

interface Props {
  onNavigate: (route: Route) => void;
}

const Speaking: React.FC<Props> = ({ onNavigate }) => (
  <main style={{ maxWidth: 1000, margin: '0 auto', padding: '84px 44px 128px' }}>
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onNavigate('life');
      }}
      className="h-ink"
      style={serif(15)}
    >
      ← back to Life
    </a>
    <h1 style={pageTitle}>Speaking</h1>
    <p style={{ ...pageIntro, maxWidth: 700 }}>
      I give the talk I’d want to sit through: one hard technical decision, the numbers behind it,
      and what broke. Conferences, podcasts, campus sessions and workshops.
    </p>

    <div
      style={{
        marginTop: 56,
        border: '1px solid var(--line)',
        borderRadius: 12,
        overflow: 'hidden',
        background: 'var(--card)',
      }}
    >
      <div
        style={{
          background: 'var(--bg2)',
          borderBottom: '1px solid var(--line)',
          padding: 26,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
      >
        <img
          src="/assets/talk-costs.png"
          alt="Projected costs slide"
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: 6,
            border: '1px solid var(--line)',
          }}
        />
        <img
          src="/assets/talk-fork.png"
          alt="Architecture decision slide"
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: 6,
            border: '1px solid var(--line)',
          }}
        />
      </div>
      <div style={{ padding: 36, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span style={serif(15)}>SRE Day 2026 · Seattle + Austin · invited</span>
        <h3
          style={{
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: '-.03em',
            color: 'var(--ink)',
          }}
        >
          Killing the Cloud Sandbox
        </h3>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--body)' }}>
          How we moved language runtimes and AI inference off cloud servers and into the student’s
          browser, eliminating per-execution cost: the cost model, the Java challenge, and the
          on-device AI economics.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, paddingTop: 6 }}>
          <a
            href={TALK_VIDEO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="h-underline"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--ink)',
              borderBottom: '1px solid var(--hair)',
              paddingBottom: 2,
            }}
          >
            Watch the talk
          </a>
          <a
            href={SANDBOX_SLIDES}
            target="_blank"
            rel="noopener noreferrer"
            className="h-ink"
            style={{ fontSize: 14, fontWeight: 600, color: 'var(--body)' }}
          >
            Download slides (PDF)
          </a>
        </div>
      </div>
    </div>

    <div
      style={{
        marginTop: 20,
        border: '1px solid var(--line)',
        borderRadius: 12,
        background: 'var(--bg2)',
        padding: 30,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <span style={serif(15)}>Techsgiving Workshop · Nov 2025 · invited</span>
      <h3
        style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--ink)' }}
      >
        AI Resumes That Land Interviews
      </h3>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--body)' }}>
        A 15-minute workflow for tailoring a resume to a job description without fabricating a single
        metric.
      </p>
      <a
        href={TECHSGIVING_SLIDES}
        target="_blank"
        rel="noopener noreferrer"
        className="h-underline"
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--ink)',
          alignSelf: 'flex-start',
          borderBottom: '1px solid var(--hair)',
          paddingBottom: 2,
        }}
      >
        Download slides (PDF)
      </a>
    </div>

    <div
      style={{
        marginTop: 60,
        paddingTop: 36,
        borderTop: '1px solid var(--ink)',
        display: 'grid',
        gridTemplateColumns: '180px 1fr',
        gap: 44,
      }}
    >
      <span style={serif(16)}>bio for programs</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--ink)' }}>
          Maxwell Myers is the co-founder and CEO of LinkedInOrLeftOut, where he’s building LILO —
          coding education that runs language runtimes and an AI tutor entirely in the browser. He
          spent five years in and around Microsoft Edge — three internships, then full-time on the
          Web Platform team — leading the WebView2 Find on Page API end-to-end and working upstream
          in Chromium’s media pipeline. He studied computer science at the University of Maryland,
          where he also captained the Division I track and field team.
        </p>
        <a
          data-m="btn"
          href={`mailto:${EMAIL}`}
          className="h-btn-solid"
          style={{ ...solidButton, alignSelf: 'flex-start' }}
        >
          Invite me to speak
        </a>
      </div>
    </div>
  </main>
);

export default Speaking;
