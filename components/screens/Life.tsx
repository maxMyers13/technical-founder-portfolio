import React from 'react';
import { EMAIL, GITHUB_URL, LILO_URL, LINKEDIN_URL, X_URL } from '../../constants';
import { Route } from '../../types';
import PhotoFrame from '../ui/PhotoFrame';
import { outlineButton, pageTitle, serif, solidButton } from '../ui/styles';

const CHAPTERS: { label: string; text: string }[] = [
  {
    label: 'first paychecks',
    text: 'Maryland kid. The money came from bagging groceries at the Fort Meade commissary — two years of it — and a McDonald’s register in Columbia for one summer. No lesson in there. It was a job, and then another job.',
  },
  {
    label: 'college',
    text: 'At UMD I studied computer science and ran track — captain of the Division I team my last two years, which on paper meant “primary liaison between coaching staff and 30 athletes” and in practice meant a lot of phone calls. Two years as a Gossett Fellow ran alongside it. Dean’s List happened at least once; it’s on the LinkedIn.',
  },
  {
    label: 'the Edge years',
    text: 'Microsoft was three internships before it was a job: PWA Hub on a two-person team in 2021, draggable window regions for Outlook in 2022, the first programmatic Find API in 2023. Then full-time from January 2024 — the Find on Page API end-to-end on WebView2, then media pipeline work upstream in Chromium until July 2026. Somewhere in there I learned to love the boring parts: docs, quickstarts, the second day of using a thing.',
  },
  {
    label: 'the side thing that won',
    text: 'The whole time, LinkedInOrLeftOut was running on the side: mock interviews and resume rewrites, then ten-plus workshops with NSBE, ColorStack, UMD and USF, then a 17,000-follower community with 800-some active members, then an eighteen-person team, then a genuinely hard engineering question — how do you give a kid on a $60 Chromebook an instant, private coding environment? In July 2026 I left Microsoft to answer it full-time. That answer is LILO. 3,000+ students so far, interviews at 100+ companies, every FAANG among them.',
  },
  {
    label: 'now',
    text: 'I live in Baltimore and will defend it in conversation. I still run — badly by my old standards, happily by anyone else’s. The rest of this page is allowed to stay unfinished.',
  },
];

/**
 * Captions say only what the photo's own capture date and the post archive can
 * support. Where the event isn't confirmed, the caption gives the month and
 * stops rather than inventing a name.
 */
const PHOTOS = [
  {
    src: '/assets/photos/track-race.jpg',
    placeholder: 'Max mid-race in a Maryland singlet',
    caption: 'still fast-ish, once',
    tilt: -1,
  },
  {
    src: '/assets/photos/microsoft-badge.jpg',
    placeholder: 'A Microsoft intern badge held up to the camera',
    caption: 'the intern badge · 2023',
    tilt: 1.2,
  },
  {
    src: '/assets/photos/the-team.jpg',
    placeholder: 'Max and three others in suits',
    caption: 'the team · October 2025',
    tilt: -0.6,
  },
  {
    src: '/assets/photos/on-stage-room.jpg',
    placeholder: 'Max presenting to a full room',
    caption: 'a full room · December 2025',
    tilt: 0.8,
  },
  {
    src: '/assets/photos/towson-week-one.jpg',
    placeholder: 'Max and Brian at the StarTUp at the Armory sign in Towson tees',
    caption: 'week one at the Armory · June 2026',
    tilt: -1.1,
  },
  {
    src: '/assets/photos/the-announcement.jpg',
    placeholder: 'A Times Square billboard reading TRADE: Microsoft to LinkedInOrLeftOut',
    caption: 'the trade announcement · July 2026',
    tilt: 0.5,
  },
  {
    src: '/assets/photos/microsoft-campus.jpg',
    placeholder: 'Max at the Microsoft campus sign',
    caption: 'Redmond · days before he left',
    tilt: -0.7,
  },
  {
    src: '/assets/photos/towson-last-day.jpg',
    placeholder: 'Max and Brian in suits at the StarTUp at the Armory sign',
    caption: 'the last day of the accelerator · July 2026',
    tilt: 1,
  },
  {
    src: '/assets/photos/yc-startup-school.jpg',
    placeholder: 'Max in front of the Y Combinator wall',
    caption: 'YC Startup School · July 2026',
    tilt: -0.4,
  },
];

const FRAGMENTS: { label: string; body: React.ReactNode }[] = [
  {
    label: 'cities',
    body: 'Columbia → College Park → Redmond → Baltimore. Seattle for a minute, on paper.',
  },
  { label: '2026', body: 'YC Startup School.' },
  { label: 'running', body: 'Current status: happens. Numbers withheld.' },
  {
    label: 'cosplay',
    body: (
      <>
        Real, photographed, not yet public.{' '}
        <em style={{ ...serif(15), fontSize: 'inherit' }}>to be written</em>
      </>
    ),
  },
  {
    label: 'internet lore',
    body: (
      <>
        How “Mad Max” became a whole naming scheme.{' '}
        <em style={{ ...serif(15), fontSize: 'inherit' }}>to be written</em>
      </>
    ),
  },
  {
    label: 'friendships',
    body: (
      <>
        Some of them are in the photos above. The rest haven’t been photographed yet.{' '}
        <em style={{ ...serif(15), fontSize: 'inherit' }}>to be written</em>
      </>
    ),
  },
];

const elsewhereLink: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--ink)',
};

interface Props {
  onNavigate: (route: Route) => void;
}

const Life: React.FC<Props> = ({ onNavigate }) => (
  <main style={{ maxWidth: 1040, margin: '0 auto', padding: '84px 44px 128px' }}>
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
    <h1 style={pageTitle}>Life</h1>
    <p style={{ ...serif(18), marginTop: 18 }}>accumulated memories, roughly chronological</p>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: 60,
        marginTop: 52,
        alignItems: 'start',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {CHAPTERS.map((chapter, i) => (
          <div
            key={chapter.label}
            style={{
              display: 'grid',
              gridTemplateColumns: '150px 1fr',
              gap: 32,
              padding: '26px 0',
              borderTop: '1px solid var(--line)',
              ...(i === CHAPTERS.length - 1 ? { borderBottom: '1px solid var(--line)' } : {}),
            }}
          >
            <span style={serif(15)}>{chapter.label}</span>
            <p
              style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--body)', textWrap: 'pretty' }}
            >
              {chapter.text}
            </p>
          </div>
        ))}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 16,
            marginTop: 44,
          }}
        >
          {PHOTOS.map((p) => (
            <PhotoFrame key={p.caption} {...p} height={180} />
          ))}
        </div>

        <div
          style={{
            marginTop: 64,
            paddingTop: 34,
            borderTop: '1px solid var(--ink)',
            display: 'grid',
            gridTemplateColumns: '150px 1fr',
            gap: 32,
          }}
        >
          <span style={serif(15)}>fragments</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {FRAGMENTS.map((f) => (
              <div
                key={f.label}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '130px 1fr',
                  gap: 24,
                  padding: '13px 0',
                  borderBottom: '1px solid var(--line)',
                }}
              >
                <span style={serif(14)}>{f.label}</span>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--body)' }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div
          id="the-name"
          style={{
            marginTop: 64,
            paddingTop: 34,
            borderTop: '1px solid var(--ink)',
            display: 'grid',
            gridTemplateColumns: '150px 1fr',
            gap: 32,
          }}
        >
          <span style={serif(15)}>the name</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p
              style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--body)', textWrap: 'pretty' }}
            >
              WM3 originally meant{' '}
              <em style={{ color: 'var(--ink)', fontStyle: 'italic' }}>“What Made Max Mad?”</em> —
              three M’s, courtesy of the Mad Max moniker, and a running list of things that set me
              off. Unclear instructions, mostly.
            </p>
            <p
              style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--body)', textWrap: 'pretty' }}
            >
              Over time I changed the framing to a better question:{' '}
              <em style={{ color: 'var(--ink)', fontStyle: 'italic' }}>“What Made Max?”</em> This
              site is the attempt to answer it.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 48 }}>
          <a data-m="btn" href={`mailto:${EMAIL}`} className="h-btn-solid" style={solidButton}>
            {EMAIL}
          </a>
          <a
            data-m="btn"
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="h-btn-outline"
            style={outlineButton}
          >
            LinkedIn
          </a>
        </div>
      </div>

      <div
        data-m="sticky-side"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          position: 'sticky',
          top: 110,
        }}
      >
        <div
          style={{
            background: 'var(--bg2)',
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid var(--line)',
          }}
        >
          <img
            src="/assets/max-portrait.jpeg"
            alt="Max Myers"
            style={{ width: '100%', height: 'auto' }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: 22,
            border: '1px solid var(--line)',
            borderRadius: 12,
            background: 'var(--card)',
          }}
        >
          <span style={serif(15)}>elsewhere</span>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="h-mute"
            style={elsewhereLink}
          >
            GitHub →
          </a>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="h-mute"
            style={elsewhereLink}
          >
            LinkedIn →
          </a>
          <a
            href={X_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="h-mute"
            style={elsewhereLink}
          >
            X →
          </a>
          <a
            href={LILO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="h-mute"
            style={elsewhereLink}
          >
            learnwleo.com →
          </a>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: 22,
            border: '1px solid var(--line)',
            borderRadius: 12,
            background: 'var(--bg2)',
          }}
        >
          <span style={serif(15)}>credentials, if you need them</span>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--body)' }}>
            Microsoft Edge 2021–2026, intern to full-time · WebView2 Find on Page, draggable window
            regions, PWA Hub (330M+ users), Chromium media · UMD CS + D1 track captain · SRE Day 2026
            speaker.
          </p>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('speaking');
            }}
            className="h-underline"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--ink)',
              borderBottom: '1px solid var(--hair)',
              paddingBottom: 2,
              alignSelf: 'flex-start',
            }}
          >
            Speaking &amp; formal bio →
          </a>
        </div>
      </div>
    </div>
  </main>
);

export default Life;
