import React, { useEffect, useRef, useState } from 'react';
import { Route } from '../../types';

/**
 * The phone dock: a frosted pill that floats at the bottom of every screen, the room included, so any big
 * section is one tap away wherever you are (the way Instagram's and Snapchat's tab bars work). Five tabs fit a
 * phone; the rest sit behind More. Hidden above 760px, where the headers carry the navigation.
 */

const Icon = ({ d }: { d: React.ReactNode }) => (
  <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

// the room's gate, a microphone, a person, a code bracket, three dots
const GATE = (
  <>
    <path d="M3 6.5c3 .9 15 .9 18 0" />
    <path d="M5 10h14" />
    <path d="M7 7.3V20M17 7.3V20" />
  </>
);
const CODE = <path d="M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5" />;
const MIC = (
  <>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
  </>
);
const PERSON = (
  <>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.8 20.2c1-3.8 3.8-5.7 7.2-5.7s6.2 1.9 7.2 5.7" />
  </>
);
const MORE = (
  <>
    <circle cx="5.5" cy="12" r="1.3" fill="currentColor" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" />
    <circle cx="18.5" cy="12" r="1.3" fill="currentColor" />
  </>
);

const TABS: { route: Route; label: string; icon: React.ReactNode }[] = [
  { route: 'home', label: 'Pod', icon: GATE },
  { route: 'lilo', label: 'LILO', icon: CODE },
  { route: 'speaking', label: 'Speaking', icon: MIC },
  { route: 'life', label: 'Life', icon: PERSON },
];
const MORE_ROUTES: { route: Route; label: string; hint: string }[] = [
  { route: 'builds', label: 'Builds', hint: 'Edge, Chromium and side quests' },
  { route: 'writing', label: 'Writing', hint: 'guides, written properly' },
  { route: 'ask', label: 'Ask WM3', hint: 'ask the post archive anything' },
];
const HASH: Partial<Record<Route, string>> = { home: 'now' };

const TabBar: React.FC<{ route: Route; onNavigate: (r: Route) => void }> = ({ route, onNavigate }) => {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const inMore = MORE_ROUTES.some((m) => m.route === route);

  useEffect(() => setOpen(false), [route]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
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
    <div className="tabbar" ref={wrap}>
      {open && (
        <ul className="tabbar__more" id="tabbar-more">
          {MORE_ROUTES.map((m) => (
            <li key={m.route}>
              <a href={`#${HASH[m.route] ?? m.route}`} onClick={go(m.route)} aria-current={route === m.route ? 'page' : undefined}>
                <b>{m.label}</b>
                <span>{m.hint}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      <nav className="tabbar__pill" aria-label="Sections">
        {TABS.map((t) => (
          <a
            key={t.route}
            className="tabbar__tab"
            href={`#${HASH[t.route] ?? t.route}`}
            onClick={go(t.route)}
            aria-current={route === t.route ? 'page' : undefined}
          >
            <Icon d={t.icon} />
            <span>{t.label}</span>
          </a>
        ))}
        <button
          type="button"
          className="tabbar__tab"
          aria-expanded={open}
          aria-controls="tabbar-more"
          aria-current={inMore ? 'page' : undefined}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon d={MORE} />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
};

export default TabBar;
