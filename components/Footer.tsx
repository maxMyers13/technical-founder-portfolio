import React from 'react';
import { EMAIL, GITHUB_URL, LINKEDIN_URL, X_URL } from '../constants';
import { Route } from '../types';

const serif: React.CSSProperties = {
  fontFamily: "'Newsreader', serif",
  fontStyle: 'italic',
  fontSize: 15,
  color: 'var(--mute)',
};

interface Props {
  onNavigate: (route: Route) => void;
  onNavigateToName: () => void;
}

const Footer: React.FC<Props> = ({ onNavigate, onNavigateToName }) => (
  <footer style={{ borderTop: '1px solid var(--line)', background: 'var(--bg)' }}>
    <div
      style={{
        maxWidth: 1240,
        margin: '0 auto',
        padding: '38px 44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        flexWrap: 'wrap',
      }}
    >
      <span style={serif}>
        © 2026 Max Myers · Baltimore · last touched Aug 31, 2026 · WM3: once “what made Max mad,” now{' '}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onNavigateToName();
          }}
          className="h-footname"
          style={{ color: 'var(--mute)', borderBottom: '1px solid var(--hair)' }}
        >
          “what made Max”
        </a>
      </span>
      <div
        style={{ display: 'flex', gap: 26, fontSize: 13, fontWeight: 500, color: 'var(--body)' }}
      >
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="h-ink"
          style={{ color: 'inherit' }}
        >
          GitHub
        </a>
        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="h-ink"
          style={{ color: 'inherit' }}
        >
          LinkedIn
        </a>
        <a
          href={X_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="h-ink"
          style={{ color: 'inherit' }}
        >
          X
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('speaking');
          }}
          className="h-ink"
          style={{ color: 'inherit' }}
        >
          Speaking
        </a>
        <a href={`mailto:${EMAIL}`} className="h-ink" style={{ color: 'inherit' }}>
          Email
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;
