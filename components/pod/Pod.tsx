import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EMAIL, GITHUB_URL, LINKEDIN_URL, X_URL } from '../../constants';
import { Route } from '../../types';
import PodPanel from './PodPanel';
import { EVENTS } from './events';
import { startPodRoom, PodRoom } from './roomGL';
import { WORLDS, WORLD_HASH_PREFIX, WorldId, worldFromHash } from './worlds';
import './pod.css';

const CALM_KEY = 'wm3-pod-calm';

/** The controller's buttons: the d-pad's four arms and the four face buttons, each a section. */
const PAD_DPAD: ['up' | 'left' | 'right' | 'down', WorldId][] = [
  ['up', 'speaking'],
  ['left', 'writing'],
  ['right', 'library'],
  ['down', 'life'],
];
const PAD_FACE: ['triangle' | 'circle' | 'cross', WorldId][] = [
  ['triangle', 'lilo'],
  ['circle', 'builds'],
  ['cross', 'ask'],
];

interface Props {
  onNavigate: (route: Route) => void;
  onAsk: (question: string) => void;
}

/**
 * The home screen: a room you stand in, with the site's sections as objects
 * in it. The objects are mouse targets only; the console (and the header on
 * wide screens) is the real, keyboard and screen reader navigation, so nobody
 * has to know the game this room is a nod to.
 */
const Pod: React.FC<Props> = ({ onNavigate, onAsk }) => {
  const [open, setOpen] = useState<WorldId | null>(worldFromHash);
  const [calm, setCalm] = useState(false);
  const openedHere = useRef(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const roomRef = useRef<PodRoom | null>(null);
  const hitRefs = useRef<Record<string, HTMLElement | null>>({});
  const [glOn, setGlOn] = useState(false);
  // Desk view: the camera stepped up to the desk (not a section, so no panel).
  const [atDesk, setAtDesk] = useState(false);
  // A conference badge was clicked: Speaking opens straight onto that event.
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    try {
      setCalm(localStorage.getItem(CALM_KEY) === '1');
    } catch {
      // A blocked localStorage just means motion stays on.
    }
  }, []);

  // The hash is the source of truth, so back and forward open and close worlds.
  useEffect(() => {
    const sync = () => setOpen(worldFromHash());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  // Nothing behind an open world scrolls.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Clicking anything glides the camera in to its object first, then opens the world (straight away when
  // motion is reduced or the room isn't rendering).
  const flight = useRef(0);
  const openWorld = useCallback(
    (id: WorldId) => {
      returnFocus.current = document.activeElement as HTMLElement | null;
      openedHere.current = true;
      window.clearTimeout(flight.current);
      const go = () => {
        window.location.hash = WORLD_HASH_PREFIX + id;
      };
      if (roomRef.current && glOn && !calm) {
        roomRef.current.focus(id);
        flight.current = window.setTimeout(go, 560);
      } else go();
    },
    [glOn, calm],
  );

  // The camera follows the open world: in when one opens (deep links too), back out when it closes.
  useEffect(() => {
    roomRef.current?.focus(open ?? (atDesk ? 'desk' : null));
  }, [open, atDesk]);

  // Esc steps back from the desk when no panel is open.
  useEffect(() => {
    if (!atDesk || open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAtDesk(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [atDesk, open]);

  const close = useCallback(() => {
    if (openedHere.current) {
      // Undo our own history entry so back doesn't reopen the world.
      openedHere.current = false;
      window.history.back();
    } else {
      // Arrived by a shared link: leave history alone and just drop the world.
      window.history.replaceState(null, '', '#now');
      setOpen(null);
    }
    const target = returnFocus.current;
    window.setTimeout(() => target?.focus(), 0);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const room = startPodRoom(canvas, {
      calm,
      onReady: () => setGlOn(true),
      onFail: () => setGlOn(false),
      onAnchors: (anchors) => {
        for (const anchor of anchors) {
          const el = hitRefs.current[anchor.id];
          if (!el) continue;
          el.style.left = `${anchor.x}px`;
          el.style.top = `${anchor.y}px`;
        }
      },
    });
    roomRef.current = room;
    // A deep link (#now/library) set `open` before the room existed, so aim the camera now that it does.
    room.focus(worldFromHash());
    return () => {
      room.dispose();
      roomRef.current = null;
    };
    // The room reads calm at start; later changes go through setCalm.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    roomRef.current?.setCalm(calm);
  }, [calm]);

  const toggleCalm = () => {
    const next = !calm;
    setCalm(next);
    try {
      localStorage.setItem(CALM_KEY, next ? '1' : '0');
    } catch {
      // Still applies for this visit.
    }
  };

  // Scene objects: clickable, but out of the tab order and the accessibility
  // tree, because the console offers the same six doors.
  const hot = (id: WorldId) => ({
    type: 'button' as const,
    tabIndex: -1,
    'aria-hidden': true,
    onClick: () => openWorld(id),
  });

  return (
    <div className={`pod${calm ? ' pod--calm' : ''}${atDesk ? ' pod--desk' : ''}${open === 'library' ? ' pod--lib' : ''}`}>
      <header className="pod-header" inert={open ? true : undefined}>
        <a className="pod-brand" href="#now">
          <span className="pod-display pod-brand__name">Max Myers</span>
          <span className="pod-brand__role">Co-founder &amp; CEO, LinkedInOrLeftOut · building LILO</span>
        </a>
        <ul className="pod-header__nav" aria-label="Sections">
          {WORLDS.map((w) => (
            <li key={w.id}>
              <button type="button" className="pod-navbtn" aria-pressed={open === w.id} onClick={() => openWorld(w.id)}>
                {w.label}
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="pod-navbtn pod-navbtn--dashed" aria-pressed={calm} onClick={toggleCalm}>
          Reduce motion
        </button>
      </header>

      <main className="pod-stage" inert={open && open !== 'library' ? true : undefined}>
        <div
          className={`pod-scene${glOn ? ' pod-scene--gl' : ''}`}
          onPointerMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            roomRef.current?.setPointer(
              ((e.clientX - rect.left) / rect.width) * 2 - 1,
              ((e.clientY - rect.top) / rect.height) * 2 - 1,
            );
          }}
        >
          <canvas ref={canvasRef} className="pod-room" aria-hidden="true" />
          {glOn &&
            WORLDS.map((w) => (
              <button
                key={w.id}
                {...hot(w.id)}
                className="pod-hit"
                ref={(el) => {
                  hitRefs.current[w.id] = el;
                }}
                style={{ left: -9999, top: -9999 }}
              >
                <span
                  className={`pod-tag${w.id === 'lilo' ? ' pod-tag--lg pod-glow' : ''}${
                    w.id === 'ask' || w.id === 'builds' ? ' pod-tag--sm' : ''
                  }`}
                >
                  {w.label}
                </span>
              </button>
            ))}
          {glOn && !atDesk && (
            <button
              type="button"
              className="pod-hit pod-hit--spot"
              tabIndex={-1}
              aria-hidden="true"
              ref={(el) => {
                hitRefs.current.desk = el;
              }}
              style={{ left: -9999, top: -9999 }}
              onClick={() => setAtDesk(true)}
            >
              <span className="pod-tag pod-tag--sm">Desk</span>
            </button>
          )}
          {glOn && (
            <ul className="pod-badgehits" aria-label="Conference badges">
              {EVENTS.map((ev) => (
                <li key={ev.id}>
                  <button
                    type="button"
                    className="pod-badgehit"
                    ref={(el) => {
                      hitRefs.current[`badge:${ev.id}`] = el;
                    }}
                    style={{ left: -9999, top: -9999 }}
                    onClick={() => {
                      setEventId(ev.id);
                      openWorld('speaking');
                    }}
                  >
                    <span className="pod-badgehit__label">{ev.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {glOn && (
            <ul className="pod-padhits" aria-label="Controller: go anywhere">
              {[...PAD_DPAD.map(([slot, id]) => ({ slot, id })), ...PAD_FACE.map(([slot, id]) => ({ slot, id }))].map(({ slot, id }) => {
                const w = WORLDS.find((x) => x.id === id)!;
                return (
                  <li key={slot}>
                    <button
                      type="button"
                      className={`pod-padhit pod-padhit--${slot}`}
                      ref={(el) => {
                        hitRefs.current[`pad:${slot}`] = el;
                      }}
                      style={{ left: -9999, top: -9999 }}
                      onClick={() => openWorld(id)}
                    >
                      <span className="pod-padhit__label">{w.label}</span>
                      <span className="pod-sr">: {w.hint}</span>
                    </button>
                  </li>
                );
              })}
              <li>
                <a
                  className="pod-padhit pod-padhit--square"
                  href={`mailto:${EMAIL}`}
                  ref={(el) => {
                    hitRefs.current['pad:square'] = el;
                  }}
                  style={{ left: -9999, top: -9999 }}
                >
                  <span className="pod-padhit__label">Contact</span>
                  <span className="pod-sr">: email Max</span>
                </a>
              </li>
            </ul>
          )}
          <div className="pod-flat">
          <div className="pod-ceiling" aria-hidden="true">
            <div className="pod-ceiling__rib pod-ceiling__rib--l" />
            <div className="pod-ceiling__rib pod-ceiling__rib--r" />
          </div>

          <div className="pod-wings" aria-hidden="true">
            <div className="pod-wing pod-wing--left">
              <span className="pod-star pod-tw" style={{ left: '62%', top: '10%' }} />
              <span className="pod-star pod-tw" style={{ left: '24%', top: '78%', animationDelay: '-1.2s' }} />
              <div className="pod-sconce" style={{ left: '70%', top: '58%' }} />
              <button {...hot('life')} className="pod-hot pod-life">
                <img className="pod-life__portrait" src="/assets/max-portrait.jpeg" alt="" />
                <img className="pod-life__track" src="/assets/photos/track-race.jpg" alt="" />
                <span className="pod-tag pod-life__tag">Life</span>
              </button>
            </div>

            <div className="pod-wing pod-wing--right">
              <span className="pod-star pod-tw" style={{ left: '30%', top: '16%', animationDelay: '-0.6s' }} />
              <span className="pod-star pod-tw" style={{ left: '58%', top: '64%', animationDelay: '-2s' }} />
              <div className="pod-sconce" style={{ left: '74%', top: '58%' }} />
              <button {...hot('speaking')} className="pod-hot pod-speak">
                <img className="pod-speak__photo" src="/assets/photos/yc-startup-school.jpg" alt="" />
                <span className="pod-tag">Speaking</span>
              </button>
              <button {...hot('writing')} className="pod-hot pod-shelf">
                <span className="pod-shelf__books">
                  <i style={{ background: '#2E5D8C', height: '92%' }} />
                  <i style={{ background: '#B83A26', height: '78%' }} />
                  <i style={{ background: '#E8B23A', height: '100%' }} />
                  <i style={{ background: '#2F6F6B', height: '72%' }} />
                  <i className="pod-shelf__lean" style={{ background: '#5B4B8A', height: '86%' }} />
                </span>
                <span className="pod-shelf__paper" />
                <span className="pod-shelf__board" />
                <span className="pod-tag pod-shelf__tag">Writing</span>
              </button>
            </div>
          </div>

          <div className="pod-post pod-post--l" aria-hidden="true" />
          <div className="pod-post pod-post--r" aria-hidden="true" />
          <div className="pod-arch" aria-hidden="true" />

          <div className="pod-window">
            <div className="pod-pendant pod-sway" aria-hidden="true">
              <span className="pod-pendant__wire" />
              <span className="pod-pendant__bulbs">
                <i />
                <i />
                <i />
              </span>
            </div>

            <button {...hot('ask')} className="pod-hot pod-ask">
              <span className="pod-ask__bubble pod-bob2">
                <svg width="46%" viewBox="0 0 48 48" fill="none" stroke="#FFF6E5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 10h32v22H22l-9 8v-8H8z" />
                  <path d="M18 21h12" />
                </svg>
              </span>
              <span className="pod-tag pod-tag--sm">Ask WM3</span>
            </button>

            <button {...hot('lilo')} className="pod-hot pod-globe">
              <span className="pod-globe__ball pod-bob">
                <i className="pod-globe__land pod-globe__land--a" />
                <i className="pod-globe__land pod-globe__land--b" />
                <i className="pod-globe__land pod-globe__land--c" />
                <i className="pod-globe__pin" />
              </span>
              <span className="pod-tag pod-tag--lg pod-glow">Pathion</span>
            </button>

            <button {...hot('builds')} className="pod-hot pod-moon">
              <span className="pod-moon__ball pod-bob2">
                <i style={{ left: '22%', top: '24%', width: '22%' }} />
                <i style={{ left: '56%', top: '50%', width: '18%' }} />
                <i style={{ left: '28%', top: '62%', width: '14%' }} />
              </span>
              <span className="pod-tag pod-tag--sm">Builds</span>
            </button>

            <div className="pod-sill" aria-hidden="true">
              <span className="pod-crab">
                <i className="pod-crab__body" />
                <i className="pod-crab__claw pod-crab__claw--l" />
                <i className="pod-crab__claw pod-crab__claw--r" />
                <i className="pod-crab__eye pod-crab__eye--l" />
                <i className="pod-crab__eye pod-crab__eye--r" />
              </span>
              <span className="pod-plant">
                <i className="pod-plant__leaf pod-plant__leaf--a" />
                <i className="pod-plant__leaf pod-plant__leaf--b" />
                <i className="pod-plant__pot" />
              </span>
            </div>
          </div>

          <div className="pod-floor" aria-hidden="true" />

          <div className="pod-standee" aria-hidden="true">
            <img src="/assets/photos/yc-startup-school.jpg" alt="" />
            <i className="pod-standee__neck" />
            <i className="pod-standee__foot" />
          </div>
          </div>

          <div className="pod-welcome">
            <h1 className="pod-display pod-welcome__title">Welcome to Max's pod</h1>
            <p className="pod-welcome__sub">Click anything with a label, or use the controller below.</p>
          </div>

          <nav className="pod-pad" aria-label="Controller: go anywhere">
            <div className="pod-pad__body">
              <div className="pod-pad__grip pod-pad__grip--l" aria-hidden="true" />
              <div className="pod-pad__grip pod-pad__grip--r" aria-hidden="true" />
              <ul className="pod-pad__dpad">
                {PAD_DPAD.map(([dir, id]) => {
                  const w = WORLDS.find((x) => x.id === id)!;
                  return (
                    <li key={id} className={`pod-pad__slot pod-pad__slot--${dir}`}>
                      <button type="button" className={`pod-pad__arm pod-pad__arm--${dir}`} onClick={() => openWorld(id)}>
                        <span className="pod-pad__label">{w.label}</span>
                        <span className="pod-sr">: {w.hint}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <ul className="pod-pad__face">
                {PAD_FACE.map(([shape, id]) => {
                  const w = WORLDS.find((x) => x.id === id)!;
                  return (
                    <li key={id} className={`pod-pad__slot pod-pad__slot--${shape}`}>
                      <button type="button" className={`pod-pad__btn pod-pad__btn--${shape}`} onClick={() => openWorld(id)}>
                        <span className="pod-pad__glyph" aria-hidden="true" />
                        <span className="pod-pad__label">{w.label}</span>
                        <span className="pod-sr">: {w.hint}</span>
                      </button>
                    </li>
                  );
                })}
                <li className="pod-pad__slot pod-pad__slot--square">
                  <a className="pod-pad__btn pod-pad__btn--square" href={`mailto:${EMAIL}`}>
                    <span className="pod-pad__glyph" aria-hidden="true" />
                    <span className="pod-pad__label">Contact</span>
                    <span className="pod-sr">: email Max</span>
                  </a>
                </li>
              </ul>
              <div className="pod-pad__mid" aria-hidden="true">
                <span className="pod-pad__pill" />
                <span className="pod-pad__home" />
                <span className="pod-pad__pill" />
              </div>
              <div className="pod-pad__stick pod-pad__stick--l" aria-hidden="true" />
              <div className="pod-pad__stick pod-pad__stick--r" aria-hidden="true" />
            </div>
          </nav>

          <nav className="pod-console" aria-label="Console">
            <p className="pod-console__label">Console: go anywhere</p>
            <ul className="pod-console__grid">
              {WORLDS.map((w) => (
                <li key={w.id}>
                  <button type="button" className="pod-console__btn" onClick={() => openWorld(w.id)}>
                    <span className="pod-console__dot" style={{ background: w.dot }} aria-hidden="true" />
                    <span>{w.label}</span>
                    <span className="pod-sr">: {w.hint}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </main>

      <footer className="pod-footer" inert={open ? true : undefined}>
        <span>Handmade by Max Myers. WM3 = What Made Max?</span>
        <span className="pod-footer__links">
          <a href={`mailto:${EMAIL}`}>Email</a>
          <a href={LINKEDIN_URL} target="_blank" rel="noreferrer">LinkedIn</a>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub</a>
          <a href={X_URL} target="_blank" rel="noreferrer">X</a>
        </span>
      </footer>

      {atDesk && !open && (
        <button type="button" className="pod-back" onClick={() => setAtDesk(false)}>
          Back to the pod
        </button>
      )}

      {open && (
        <PodPanel
          world={open}
          event={open === 'speaking' ? eventId : null}
          onEvent={setEventId}
          onClose={() => {
            setEventId(null);
            close();
          }}
          onNavigate={onNavigate}
          onAsk={onAsk}
        />
      )}
    </div>
  );
};

export default Pod;
