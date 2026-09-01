import React from 'react';
import { LILO_URL } from '../../constants';
import { Route } from '../../types';
import DemoClip from '../ui/DemoClip';
import { outlineButton, serif, solidButton } from '../ui/styles';

/** Two clips side by side, stacking on the mobile pass in index.css. */
const clipGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
  marginTop: 8,
};

const block = (topBorder: string, marginTop: number): React.CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: '180px 1fr',
  gap: 44,
  marginTop,
  paddingTop: 36,
  borderTop: topBorder,
});

interface Props {
  onNavigate: (route: Route) => void;
}

const Lilo: React.FC<Props> = ({ onNavigate }) => (
  <main style={{ maxWidth: 1000, margin: '0 auto', padding: '84px 44px 128px' }}>
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onNavigate('builds');
      }}
      className="h-ink"
      style={serif(15)}
    >
      ← back to Builds
    </a>
    <span style={{ display: 'block', ...serif(16), marginTop: 44 }}>case study</span>
    <h1
      style={{
        fontSize: 62,
        fontWeight: 900,
        letterSpacing: '-.05em',
        lineHeight: 0.98,
        color: 'var(--ink)',
        marginTop: 16,
      }}
    >
      LILO runs the whole classroom in the browser.
    </h1>
    <p
      style={{
        fontSize: 20,
        lineHeight: 1.6,
        color: 'var(--body)',
        marginTop: 26,
        maxWidth: 770,
        textWrap: 'pretty',
      }}
    >
      Every online coding course pays a cloud bill each time a student presses Run. That bill is why
      free tiers are stingy, why feedback is slow, and why a $60 Chromebook is a second-class
      citizen. LILO deletes the bill.
    </p>

    <div style={{ marginTop: 52 }}>
      <DemoClip
        src="/assets/demos/browser-preview.mp4"
        label="A student edits files on the left while their web app builds and runs on the right, with no server in the loop."
        caption="the student’s app compiling and running in the tab — esbuild in the browser, their own /api handler answering the request"
      />
    </div>

    <div style={block('1px solid var(--ink)', 76)}>
      <span style={serif(16)}>the runtime</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--ink)' }}>
          Python runs on Pyodide. Java — the hard one — runs on CheerpJ. C, C++ and Rust compile
          through the WASI component model. Nothing leaves the tab, so marginal execution cost is
          zero and cold start stops being a server problem.
        </p>
        <p style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--body)' }}>
          Behind it: an async Go API orchestrating Cloudflare edge workers, which took p95 cold start
          from about 15 seconds to under 150ms on low-spec hardware. TypeScript and Tailwind on top,
          Postgres and Kubernetes underneath.
        </p>
        <div style={clipGrid}>
          <DemoClip
            src="/assets/demos/python-debugger.mp4"
            label="Stepping through Python line by line inside the editor, watching variables update."
            caption="the Python step debugger, running in the tab"
          />
          <DemoClip
            src="/assets/demos/offline-downloads.mp4"
            label="A downloaded module opening in airplane mode — lessons, readings and figures all load."
            caption="airplane mode — a downloaded module still works"
          />
        </div>
      </div>
    </div>

    <div style={block('1px solid var(--line)', 48)}>
      <span style={serif(16)}>the tutor</span>
      <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--ink)' }}>
        A quantized model runs locally through WebNN, so hints arrive without an inference bill or a
        privacy conversation. It reads the student’s actual code, not a lesson template — and it’s
        allowed to say “you’re close” instead of grading.
      </p>
    </div>

    <div style={block('1px solid var(--line)', 48)}>
      <span style={serif(16)}>why me</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--ink)' }}>
          LinkedInOrLeftOut started in July 2022 as mock interviews and resume rewrites. Since then:
          3,000+ students equipped for SWE roles, interviews at 100+ companies — every FAANG among
          them — and ten-plus workshops with NSBE, ColorStack, UMD and USF. Teaching first, platform
          second; the product knows where people get stuck because we watched it happen.
        </p>
        <div style={clipGrid}>
          <DemoClip
            src="/assets/demos/predict-before-run.mp4"
            label="An exercise that locks the Run button until the student has written down what they think the code will do, then shows predicted against actual."
            caption="Run stays locked until you commit to a prediction"
          />
          <DemoClip
            src="/assets/demos/mock-interview-rooms.mp4"
            label="Two people editing the same file live in a mock interview room, with the interviewer's private notes rail alongside."
            caption="the mock interviews, now a room in the product"
          />
        </div>
      </div>
    </div>

    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 64 }}>
      <a
        data-m="btn"
        href={LILO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="h-btn-solid"
        style={{ ...solidButton, fontWeight: 600 }}
      >
        Try LILO
      </a>
      <a
        data-m="btn"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onNavigate('speaking');
        }}
        className="h-btn-outline"
        style={outlineButton}
      >
        See the talk about it
      </a>
    </div>
  </main>
);

export default Lilo;
