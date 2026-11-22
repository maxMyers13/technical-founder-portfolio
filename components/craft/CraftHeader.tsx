import React from 'react';
import { Route } from '../../types';

const LINKS: { route: Route; label: string; dot: string }[] = [
  { route: 'lilo', label: 'LILO', dot: '#2E5D8C' },
  { route: 'builds', label: 'Builds', dot: '#B39A6E' },
  { route: 'life', label: 'Life', dot: '#C9A04A' },
  { route: 'speaking', label: 'Speaking', dot: '#B83A26' },
  { route: 'writing', label: 'Writing', dot: '#2F6F6B' },
  { route: 'ask', label: 'Ask WM3', dot: '#FFF6E5' },
];

/** The header for every page off the pod: the pod's own dark bar, its console buttons, and a way back in. */
const CraftHeader: React.FC<{ route: Route; onNavigate: (r: Route) => void }> = ({ route, onNavigate }) => {
  const go = (r: Route) => (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate(r);
  };
  return (
    <header className="craft-head">
      <a className="craft-head__back" href="#now" onClick={go('home')}>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4l-6 6 6 6" />
        </svg>
        <span>The pod</span>
      </a>
      <a className="craft-head__brand" href="#now" onClick={go('home')}>
        <span className="craft-display craft-head__name">Max Myers</span>
        <span className="craft-head__role">Co-founder &amp; CEO, LinkedInOrLeftOut</span>
      </a>
      <nav aria-label="Pages">
        <ul className="craft-head__nav">
          {LINKS.map((l) => (
            <li key={l.route}>
              <a
                className="craft-chip"
                href={`#${l.route}`}
                aria-current={route === l.route ? 'page' : undefined}
                onClick={go(l.route)}
              >
                <i style={{ background: l.dot }} />
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default CraftHeader;
