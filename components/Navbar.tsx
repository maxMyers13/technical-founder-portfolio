import React from 'react';
import { Route, Theme } from '../types';

const THEME_ORDER: Theme[] = ['system', 'light', 'dark'];
const THEME_GLYPH: Record<Theme, string> = { system: '◐', light: '○', dark: '●' };
const themeWord = (t: Theme) => (t === 'system' ? 'auto' : t);

const linkStyle: React.CSSProperties = { color: 'inherit' };

interface Props {
  onNavigate: (route: Route) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const Navbar: React.FC<Props> = ({ onNavigate, theme, onThemeChange }) => {
  const nextTheme = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length];

  const go = (route: Route) => (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate(route);
  };

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--nav)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          padding: '0 44px',
          height: 70,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        <a
          href="#"
          onClick={go('home')}
          style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}
        >
          <span
            style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-.02em', color: 'var(--ink)' }}
          >
            Max Runtime
          </span>
          <span
            style={{
              fontFamily: "'Newsreader', serif",
              fontStyle: 'italic',
              fontSize: 14,
              color: 'var(--mute)',
            }}
          >
            wm3.ai
          </span>
        </a>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--body)',
          }}
        >
          <a href="#" onClick={go('home')} className="h-ink" style={linkStyle}>
            Now
          </a>
          <a href="#" onClick={go('writing')} className="h-ink" style={linkStyle}>
            Writing
          </a>
          <a href="#" onClick={go('builds')} className="h-ink" style={linkStyle}>
            Builds
          </a>
          <a href="#" onClick={go('life')} className="h-ink" style={linkStyle}>
            Life
          </a>
          <a
            href="#"
            onClick={go('ask')}
            className="h-pill"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 36,
              padding: '0 16px',
              borderRadius: 9999,
              border: '1px solid var(--ink)',
              color: 'var(--ink)',
              fontWeight: 600,
              fontSize: 13,
              whiteSpace: 'nowrap',
            }}
          >
            Ask WM3
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onThemeChange(nextTheme);
            }}
            title={`theme: ${themeWord(theme)} — click for ${themeWord(nextTheme)}`}
            className="h-theme"
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: 'var(--mute)',
              flex: 'none',
            }}
          >
            {THEME_GLYPH[theme]}
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
