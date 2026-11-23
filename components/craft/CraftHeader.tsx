import React, { useEffect, useRef, useState } from 'react';
import { Route } from '../../types';
import { WORK_ROUTES } from './TabBar';

const LINKS: { route: Route; label: string; dot: string }[] = [
  { route: 'speaking', label: 'Speaking', dot: '#B83A26' },
  { route: 'life', label: 'About', dot: '#C9A04A' },
];

/**
 * The header for every page off the pod: the pod's own dark bar, its console buttons, and a way back in.
 * Three places on the bar: Work (a folder holding LILO, Builds and Writing), Speaking and About.
 */
const CraftHeader: React.FC<{ route: Route; onNavigate: (r: Route) => void }> = ({ route, onNavigate }) => {
  const [open, setOpen] = useState(false);
  const work = useRef<HTMLLIElement>(null);
  const inWork = WORK_ROUTES.find((w) => w.route === route);

  useEffect(() => setOpen(false), [route]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (work.current && !work.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  const go = (r: Route) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
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
          <li className="craft-folder" ref={work}>
            <button
              type="button"
              className="craft-chip"
              aria-expanded={open}
              aria-controls="craft-work"
              aria-current={inWork ? 'page' : undefined}
              onClick={() => setOpen((o) => !o)}
            >
              <i style={{ background: '#2E5D8C' }} />
              {inWork ? `Work: ${inWork.label}` : 'Work'}
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.5 4.5 6 8l3.5-3.5" />
              </svg>
            </button>
            {open && (
              <ul className="craft-folder__menu" id="craft-work">
                {WORK_ROUTES.map((w) => (
                  <li key={w.route}>
                    <a href={`#${w.route}`} onClick={go(w.route)} aria-current={route === w.route ? 'page' : undefined}>
                      <b>{w.label}</b>
                      <span>{w.hint}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
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
