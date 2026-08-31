import React from 'react';
import { LINKEDIN_ACTIVITY_URL, POSTS } from '../../constants';
import { Route } from '../../types';
import { pageIntro, pageTitle, serif } from '../ui/styles';

interface Props {
  onNavigate: (route: Route) => void;
}

const Writing: React.FC<Props> = ({ onNavigate }) => (
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
    <h1 style={pageTitle}>Writing</h1>
    <p style={{ ...pageIntro, maxWidth: 660 }}>
      Two finished things and one large archive. No fake article cards — when a piece isn’t written
      yet, it isn’t listed yet.
    </p>

    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        marginTop: 56,
        borderTop: '1px solid var(--ink)',
      }}
    >
      {POSTS.map((post) => (
        <a
          key={post.href}
          href={post.href}
          target="_blank"
          rel="noopener noreferrer"
          data-m="row"
          className="h-row"
          style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr 110px',
            gap: 32,
            alignItems: 'baseline',
            padding: '28px 12px',
            borderBottom: '1px solid var(--line)',
            color: 'inherit',
          }}
        >
          <span style={serif(15)}>{post.date}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '-.02em',
                color: 'var(--ink)',
              }}
            >
              {post.title}
            </span>
            <span
              style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--body)', maxWidth: 640 }}
            >
              {post.blurb}
            </span>
          </div>
          <span style={{ justifySelf: 'end', ...serif(15) }}>{post.kind}</span>
        </a>
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
      <span style={serif(16)}>the actual archive</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 640 }}>
        <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--ink)', textWrap: 'pretty' }}>
          The real writing is 200-some LinkedIn posts, 2022 to now — stories, opinions, and the
          occasional public mistake. It’s being ingested into this site right now: parsed, chunked,
          embedded, and made queryable through WM3. When that lands, this page stops being a list and
          starts being searchable.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 28px' }}>
          <a
            href={LINKEDIN_ACTIVITY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="h-underline"
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--ink)',
              borderBottom: '1px solid var(--hair)',
              paddingBottom: 2,
            }}
          >
            Read it on LinkedIn, for now →
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('ask');
            }}
            className="h-underline"
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--ink)',
              borderBottom: '1px solid var(--hair)',
              paddingBottom: 2,
            }}
          >
            Or interrogate it via WM3 →
          </a>
        </div>
      </div>
    </div>
  </main>
);

export default Writing;
