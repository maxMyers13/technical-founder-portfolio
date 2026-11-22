import React, { useEffect, useRef, useState } from 'react';
import {
  BUILDS,
  LILO_URL,
  LINKEDIN_ACTIVITY_URL,
  POSTS,
  SANDBOX_SLIDES,
  STARTER_QUESTIONS,
  TALK_VIDEO_URL,
  TECHSGIVING_SLIDES,
} from '../../constants';
import { Route } from '../../types';
import { WORLDS, WorldId } from './worlds';
import { SHELF_TOPICS, libraryList, nowReading } from './books';
import { GAMES } from './games';
import { LEARNING } from './learning';
import { AUDIOBOOKS, audibleLink } from './audiobooks';
import { EVENTS, eventById } from './events';

interface Props {
  world: WorldId;
  /** Speaking only: an event to open straight onto (a badge in the room was clicked). */
  event?: string | null;
  onEvent?: (id: string | null) => void;
  onClose: () => void;
  onNavigate: (route: Route) => void;
  onAsk: (question: string) => void;
}

/** Levels read 1-1, 1-2, 1-3, 2-1… in the order the builds are listed. */
const levelNumber = (i: number) => `${Math.floor(i / 3) + 1}-${(i % 3) + 1}`;

const PodPanel: React.FC<Props> = ({ world, event = null, onEvent, onClose, onNavigate, onAsk }) => {
  // The Speaking wall's lightbox: which event, and which of its photos.
  const [shown, setShown] = useState<{ id: string; i: number } | null>(event ? { id: event, i: 0 } : null);
  const shownRef = useRef(shown);
  shownRef.current = shown;
  useEffect(() => {
    if (event) setShown({ id: event, i: 0 });
  }, [event]);
  const closeShown = () => {
    setShown(null);
    onEvent?.(null);
  };
  // The Library opens beside the bookcase instead of over the room: the camera frames the real shelves.
  const side = world === 'library';
  const meta = WORLDS.find((w) => w.id === world)!;
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [question, setQuestion] = useState('');

  // Focus lands inside the dialog when it opens; Esc closes it; Tab stays in it.
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        // Esc steps out of an open photo first, then out of the world.
        if (shownRef.current) {
          setShown(null);
          onEvent?.(null);
        } else onClose();
        return;
      }
      if (shownRef.current && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        const cur = shownRef.current;
        const ev = eventById(cur.id);
        if (ev) {
          const n = ev.photos.length;
          setShown({ id: cur.id, i: (cur.i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n });
        }
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [world, onClose]);

  const go = (route: Route) => (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate(route);
  };

  const ask = (q: string) => {
    if (!q.trim()) return;
    onAsk(q);
  };

  return (
    <div className={`pod-overlay${side ? ' pod-overlay--side' : ''}`} onClick={side ? undefined : onClose}>
      <div
        ref={dialogRef}
        className="pod-dialog"
        role="dialog"
        aria-modal={side ? undefined : true}
        aria-labelledby="pod-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pod-dialog__inner">
          <div className="pod-dialog__head">
            <h2 id="pod-dialog-title" className="pod-display pod-dialog__title">
              {meta.label}
            </h2>
            <button
              ref={closeRef}
              type="button"
              className="pod-close"
              onClick={onClose}
              aria-label="Close and go back to the pod"
            >
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M4 4l12 12M16 4L4 16" />
              </svg>
            </button>
          </div>

          {world === 'lilo' && (
            <div className="pod-stack">
              <img className="pod-photo-wide" src="/assets/photos/lilo-editor.jpg" alt="The LILO editor running student code in the browser" />
              <p className="pod-lede">
                Every online coding course pays a cloud bill each time a student presses Run. LILO deletes the bill:
                Python, Java, C, C++ and Rust run in the student's browser, and a quantized tutor gives hints on-device.
              </p>
              <div className="pod-row">
                <a className="pod-btn pod-btn--teal" href="#lilo" onClick={go('lilo')}>
                  Play the level: the case study
                </a>
                <a className="pod-btn" href={LILO_URL} target="_blank" rel="noreferrer">
                  Try LILO
                </a>
              </div>
            </div>
          )}

          {world === 'builds' && (
            <div className="pod-stack">
              <p className="pod-lede">
                Every build is a level. Serious ones from five years in Microsoft Edge and Chromium, plus side quests.
              </p>
              <ul className="pod-levels">
                {BUILDS.map((b, i) => {
                  const body = (
                    <>
                      <span className={`pod-level__num pod-level__num--${b.kind}`}>{levelNumber(i)}</span>
                      <span className="pod-level__text">
                        <span className="pod-level__meta">
                          {b.year} · {b.tag}
                        </span>
                        <span className="pod-level__title">{b.title}</span>
                        <span className="pod-level__desc">{b.desc}</span>
                      </span>
                    </>
                  );
                  return (
                    <li key={b.title}>
                      {b.route ? (
                        <a className="pod-level" href={`#${b.route}`} onClick={go(b.route)}>
                          {body}
                        </a>
                      ) : b.href ? (
                        <a className="pod-level" href={b.href} target="_blank" rel="noreferrer">
                          {body}
                        </a>
                      ) : (
                        <div className="pod-level pod-level--static">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
              <a className="pod-textlink" href="#builds" onClick={go('builds')}>
                See every build with photos and filters
              </a>
            </div>
          )}

          {world === 'ask' && (
            <form
              className="pod-stack"
              onSubmit={(e) => {
                e.preventDefault();
                ask(question);
              }}
            >
              <p className="pod-lede">
                WM3 answers from Max's public posts, searched and written up right in your browser, with receipts. No
                server, and no question leaves the page.
              </p>
              <label htmlFor="pod-ask" className="pod-label">
                Ask anything
              </label>
              <div className="pod-row">
                <input
                  id="pod-ask"
                  className="pod-input"
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What is Max building right now?"
                />
                <button type="submit" className="pod-btn pod-btn--plum">
                  Ask
                </button>
              </div>
              <div className="pod-row">
                {STARTER_QUESTIONS.map((q) => (
                  <button key={q} type="button" className="pod-chip" onClick={() => ask(q)}>
                    {q}
                  </button>
                ))}
              </div>
            </form>
          )}

          {world === 'life' && (
            <div className="pod-lifecard">
              <img className="pod-photo-round" src="/assets/photos/track-race.jpg" alt="Max racing on the track at Maryland" />
              <div className="pod-stack">
                <p className="pod-lede">
                  A Maryland kid. First paychecks came from bagging groceries at the Fort Meade commissary. Computer
                  science at UMD and captain of the Division I track team. Three Microsoft internships, then full-time on
                  Edge and Chromium. In July 2026 he left to build LILO full-time. He lives in Baltimore and will defend it.
                </p>
                <ul className="pod-stickers">
                  <li className="pod-sticker pod-sticker--gold">D1 track captain</li>
                  <li className="pod-sticker pod-sticker--teal">Gossett Fellow</li>
                  <li className="pod-sticker pod-sticker--red">YC Startup School 2026</li>
                  <li className="pod-sticker pod-sticker--peach">3,000+ students prepped</li>
                </ul>
                <a className="pod-textlink" href="#life" onClick={go('life')}>
                  Read the whole story
                </a>
              </div>
            </div>
          )}

          {world === 'speaking' && (
            <div className="pod-stack">
              {(() => {
                const ev = shown ? eventById(shown.id) : null;
                if (ev && shown) {
                  const photo = ev.photos[shown.i] ?? ev.photos[0];
                  return (
                    <div className="pod-event">
                      <button type="button" className="pod-textlink pod-event__back" onClick={closeShown}>
                        ← All events
                      </button>
                      <figure className="pod-event__figure">
                        <div className="pod-frame pod-frame--big">
                          <img src={photo.src} alt={photo.alt} />
                        </div>
                        <figcaption>{photo.caption}</figcaption>
                      </figure>
                      {ev.photos.length > 1 && (
                        <div className="pod-event__thumbs" role="group" aria-label={`${ev.name} photos`}>
                          {ev.photos.map((p, i) => (
                            <button
                              key={p.src}
                              type="button"
                              className="pod-event__thumb"
                              aria-pressed={i === shown.i}
                              aria-label={p.caption}
                              onClick={() => setShown({ id: ev.id, i })}
                            >
                              <img src={p.src} alt="" />
                            </button>
                          ))}
                        </div>
                      )}
                      <span className="pod-card__meta">
                        {ev.when}
                        {ev.where ? ` · ${ev.where}` : ''}
                      </span>
                      <h3 className="pod-event__name">{ev.name}</h3>
                      <p className="pod-card__desc">{ev.about}</p>
                      {ev.links.length > 0 && (
                        <span className="pod-row">
                          {ev.links.map((l) => (
                            <a key={l.href} href={l.href} target="_blank" rel="noreferrer">
                              {l.label}
                            </a>
                          ))}
                        </span>
                      )}
                    </div>
                  );
                }
                return (
                  <>
                    <p className="pod-card__desc">Every event Max has a badge from. Open a frame to see the photos and read about it.</p>
                    <ul className="pod-wall" aria-label="Events">
                      {EVENTS.map((e, k) => (
                        <li key={e.id} className={`pod-wall__item pod-wall__item--${k % 3}`}>
                          <button type="button" className="pod-wall__btn" onClick={() => setShown({ id: e.id, i: 0 })}>
                            <span className="pod-frame">
                              <img src={e.photos[0].src} alt="" loading="lazy" />
                            </span>
                            <span className="pod-wall__plate">
                              <strong>{e.name}</strong>
                              <span>
                                {e.when}
                                {e.where ? ` · ${e.where}` : ''}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <a className="pod-textlink" href="#speaking" onClick={go('speaking')}>
                      Speaking page and program bio
                    </a>
                  </>
                );
              })()}
            </div>
          )}

          {world === 'writing' && (
            <div className="pod-stack">
              {POSTS.map((p) => (
                <a key={p.href} className="pod-note" href={p.href} target="_blank" rel="noreferrer">
                  <span className="pod-card__meta">
                    {p.kind} · {p.date}
                  </span>
                  <span className="pod-card__title">{p.title}</span>
                  <span className="pod-card__desc">{p.blurb}</span>
                </a>
              ))}
              <div className="pod-row">
                <a className="pod-textlink" href="#writing" onClick={go('writing')}>
                  All writing
                </a>
                <a className="pod-textlink" href={LINKEDIN_ACTIVITY_URL} target="_blank" rel="noreferrer">
                  Everything else is on LinkedIn
                </a>
              </div>
            </div>
          )}
          {world === 'library' && (
            <div className="pod-stack">
              {(() => {
                const now = nowReading();
                const read = libraryList().filter((b) => b.title !== nowReading()?.title);
                return (
                  <>
                    {now && now.title && (
                      <div className="pod-card pod-card--gold">
                        <span className="pod-card__meta">Now reading</span>
                        <span className="pod-card__title">{now.title}</span>
                        {now.author && <span className="pod-card__desc">{now.author}</span>}
                      </div>
                    )}
                    {read.length > 0 && (
                      <section aria-labelledby="pod-lib-books">
                        <h3 id="pod-lib-books" className="pod-label">
                          On the shelf · {read.length} {read.length === 1 ? 'title' : 'titles'}
                        </h3>
                        {[...new Set(read.map((b) => SHELF_TOPICS[b.shelf] ?? 'Other'))].map((topic) => (
                          <div key={topic}>
                            <p className="pod-shelflist__group">{topic}</p>
                            <ul className="pod-shelflist">
                              {read
                                .filter((b) => (SHELF_TOPICS[b.shelf] ?? 'Other') === topic)
                                .map((b) => (
                                  <li key={b.title}>
                                    <strong>{b.title}</strong>
                                    {b.author && <span> · {b.author}</span>}
                                    {b.detail && <span className="pod-shelflist__note">{b.detail}</span>}
                                    <span className="pod-shelflist__row">
                                      <span className="pod-booktag">{b.own ? 'Written by Max' : topic}</span>
                                      {b.link && (
                                        <a className="pod-shelflist__link" href={b.link.href} target="_blank" rel="noopener noreferrer">
                                          {b.link.label} ↗<span className="pod-sr"> ({b.title}, opens in a new tab)</span>
                                        </a>
                                      )}
                                    </span>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        ))}
                      </section>
                    )}
                    {LEARNING.length > 0 && (
                      <section aria-labelledby="pod-lib-learning">
                        <h3 id="pod-lib-learning" className="pod-label">
                          Learning right now
                        </h3>
                        <ul className="pod-shelflist">
                          {LEARNING.map((t) => (
                            <li key={t.topic}>
                              <strong>{t.topic}</strong>
                              {t.note && <span className="pod-shelflist__note">{t.note}</span>}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                    <section aria-labelledby="pod-lib-audible">
                      <h3 id="pod-lib-audible" className="pod-label">
                        On Audible · {AUDIOBOOKS.length} audiobooks
                      </h3>
                      {(
                        [
                          ['listening', 'Listening now'],
                          ['finished', 'Finished'],
                          ['queued', 'Up next'],
                        ] as const
                      ).map(([status, heading]) => {
                        const list = AUDIOBOOKS.filter((a) => a.status === status);
                        if (!list.length) return null;
                        return (
                          <div key={status}>
                            <p className="pod-shelflist__group">
                              {heading} · {list.length}
                            </p>
                            <ul className="pod-shelflist pod-shelflist--compact">
                              {list.map((a) => (
                                <li key={a.title}>
                                  <strong>{a.title}</strong>
                                  <span> · {a.author}</span>
                                  <span className="pod-shelflist__row">
                                    <span className="pod-booktag">Audiobook · {heading.toLowerCase()}</span>
                                    <a className="pod-shelflist__link" href={audibleLink(a)} target="_blank" rel="noopener noreferrer">
                                      Open on Audible ↗<span className="pod-sr"> ({a.title}, opens in a new tab)</span>
                                    </a>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </section>
                    <section aria-labelledby="pod-lib-games">
                      <h3 id="pod-lib-games" className="pod-label">
                        Favourite games
                      </h3>
                      <ul className="pod-shelflist">
                        {GAMES.map((g) => (
                          <li key={g.title}>
                            <strong>{g.title}</strong>
                            {g.platform && <span> · {g.platform}</span>}
                            {g.note && <span className="pod-shelflist__note">{g.note}</span>}
                            {g.href && (
                              <a className="pod-shelflist__link" href={g.href} target="_blank" rel="noreferrer">
                                Open the game ↗
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    </section>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PodPanel;
