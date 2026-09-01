import React from 'react';
import { BUILDS, BUILD_FILTERS } from '../../constants';
import { Build, BuildFilter, Route } from '../../types';
import PhotoFrame from '../ui/PhotoFrame';
import { pageIntro, pageTitle, serif } from '../ui/styles';

const REMNANTS = [
  {
    src: '/assets/photos/lilo-editor.jpg',
    placeholder: 'The LILO editor: problem prompt on the left, code and test cases on the right',
    caption: 'the editor, mid-problem',
    tilt: -0.8,
  },
  {
    src: '/assets/photos/whiteboard.jpg',
    placeholder: 'A hand-drawn diagram of how the hackathon project fits together',
    caption: 'working out how the hackathon fit together',
    tilt: 1,
  },
  {
    src: '/assets/photos/design-player-bug.jpg',
    placeholder: 'The system design player showing a layout bug',
    caption: 'a bug in the design player, caught mid-build',
    tilt: -0.4,
  },
];

const filterStyle = (active: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  height: 38,
  padding: '0 18px',
  borderRadius: 9999,
  fontSize: 13,
  ...(active
    ? { background: 'var(--ink)', color: 'var(--bg)', fontWeight: 600 }
    : { border: '1px solid var(--hair)', color: 'var(--body)', fontWeight: 500 }),
});

interface Props {
  onNavigate: (route: Route) => void;
  filter: BuildFilter;
  onFilterChange: (filter: BuildFilter) => void;
}

const BuildRow: React.FC<{ build: Build; onNavigate: (route: Route) => void }> = ({
  build,
  onNavigate,
}) => {
  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '130px 1fr 150px',
    gap: 32,
    alignItems: 'baseline',
    padding: '28px 12px',
    borderBottom: '1px solid var(--line)',
    color: 'inherit',
  };

  const body = (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{build.year}</span>
        <span style={serif(15)}>{build.tag}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <span
          style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--ink)' }}
        >
          {build.title}
        </span>
        <span style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--body)', maxWidth: 640 }}>
          {build.desc}
        </span>
        {build.img && (
          <>
            <div
              style={{
                marginTop: 12,
                maxWidth: 440,
                border: '1px solid var(--line)',
                borderRadius: 8,
                overflow: 'hidden',
                background: 'var(--bg2)',
              }}
            >
              <div
                role="img"
                aria-label={build.title}
                style={{
                  width: '100%',
                  aspectRatio: '16 / 10',
                  backgroundImage: `url("${build.img}")`,
                  // Screenshots lose their point when cropped — fit the whole
                  // frame rather than filling it.
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                }}
              />
            </div>
            <span style={serif(13)}>{build.caption}</span>
          </>
        )}
      </div>
      <span style={{ justifySelf: 'end', fontSize: 14, fontWeight: 600, color: 'var(--mute)' }}>
        {build.cta}
      </span>
    </>
  );

  if (build.route) {
    const route = build.route;
    return (
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onNavigate(route);
        }}
        data-m="row"
        className="h-row"
        style={rowStyle}
      >
        {body}
      </a>
    );
  }

  if (build.href) {
    return (
      <a
        href={build.href}
        target="_blank"
        rel="noopener noreferrer"
        data-m="row"
        className="h-row"
        style={rowStyle}
      >
        {body}
      </a>
    );
  }

  // No destination — the row is a record, not a link.
  return (
    <div data-m="row" style={rowStyle}>
      {body}
    </div>
  );
};

const Builds: React.FC<Props> = ({ onNavigate, filter, onFilterChange }) => {
  const visible = BUILDS.filter((b) => filter === 'everything' || b.kind === filter);

  return (
    <main style={{ maxWidth: 1140, margin: '0 auto', padding: '84px 44px 128px' }}>
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
      <h1 style={pageTitle}>Builds</h1>
      <p style={{ ...pageIntro, maxWidth: 680 }}>
        Everything I’ve made that survived long enough to have a name, with the actual artifacts —
        screenshots, metrics, slides. Startup infrastructure sits next to hackathon one-offs on
        purpose; they come from the same place.
      </p>

      <div style={{ display: 'flex', gap: 8, marginTop: 44 }}>
        {BUILD_FILTERS.map((f) => (
          <a
            key={f.key}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onFilterChange(f.key);
            }}
            style={filterStyle(f.key === filter)}
          >
            {f.label}
          </a>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginTop: 24,
          borderTop: '1px solid var(--ink)',
        }}
      >
        {visible.map((build) => (
          <BuildRow key={build.title} build={build} onNavigate={onNavigate} />
        ))}
      </div>

      <div
        style={{
          marginTop: 72,
          paddingTop: 36,
          borderTop: '1px solid var(--ink)',
          display: 'grid',
          gridTemplateColumns: '180px 1fr',
          gap: 44,
        }}
      >
        <span style={serif(16)}>remnants</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--body)', maxWidth: 560 }}>
            Screenshots, whiteboards and dead ends that don’t deserve a row but did happen. More
            get dropped in as I dig them up.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {REMNANTS.map((r) => (
              <PhotoFrame key={r.caption} {...r} height={160} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Builds;
