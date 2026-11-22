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

interface Props {
  world: WorldId;
  onClose: () => void;
  onNavigate: (route: Route) => void;
  onAsk: (question: string) => void;
}

/** Levels read 1-1, 1-2, 1-3, 2-1… in the order the builds are listed. */
const levelNumber = (i: number) => `${Math.floor(i / 3) + 1}-${(i % 3) + 1}`;

const PodPanel: React.FC<Props> = ({ world, onClose, onNavigate, onAsk }) => {
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
        onClose();
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
    <div className="pod-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="pod-dialog"
        role="dialog"
        aria-modal="true"
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
              <div className="pod-cards">
                <div className="pod-card pod-card--gold">
                  <span className="pod-card__meta">SRE Day 2026 · Seattle &amp; Austin</span>
                  <span className="pod-card__title">Killing the Cloud Sandbox</span>
                  <span className="pod-card__desc">Moving runtimes and AI inference off cloud servers and into the browser.</span>
                  <span className="pod-row">
                    <a href={TALK_VIDEO_URL} target="_blank" rel="noreferrer">Watch the talk</a>
                    <a href={SANDBOX_SLIDES} target="_blank" rel="noreferrer">Slides (PDF)</a>
                  </span>
                </div>
                <div className="pod-card pod-card--peach">
                  <span className="pod-card__meta">Techsgiving · December 2025</span>
                  <span className="pod-card__title">AI Resumes That Land Interviews</span>
                  <span className="pod-card__desc">A 15-minute workflow for tailoring a resume without inventing a single metric.</span>
                  <span className="pod-row">
                    <a href={TECHSGIVING_SLIDES} target="_blank" rel="noreferrer">Slides (PDF)</a>
                  </span>
                </div>
              </div>
              <a className="pod-textlink" href="#speaking" onClick={go('speaking')}>
                Speaking page and program bio
              </a>
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
        </div>
      </div>
    </div>
  );
};

export default PodPanel;
