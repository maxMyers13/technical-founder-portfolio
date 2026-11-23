import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Route } from '../../types';
import { startPodRoom, type BuilderView, type PodRoom } from '../pod/roomGL';
import { COCO, COCO_BASE, CONTROLS, PRESETS, normalizeCoco, type CocoParams, type Control } from '../pod/coco';
import './builder.css';

/**
 * The character builder: Coco on a stage, every part of her on a slider, the way a create-a-player screen works.
 * She is drawn by the site's own room renderer, so what you see here is exactly what lies under the desk.
 *
 * Changes save to this browser as you go. "Save to the room" writes them into the site (on the dev server); on the
 * live site, "Copy link" carries the whole build in the URL so it can be sent over and applied.
 */

type ViewMode = 'studio' | 'room' | 'desk';
const CAMS: { id: string; label: string; yaw: number; pitch: number; dist: number; on: 'body' | 'head' }[] = [
  { id: 'three', label: '3/4', yaw: 0.8, pitch: 0.3, dist: 1.25, on: 'body' },
  { id: 'side', label: 'Side', yaw: 0, pitch: 0.1, dist: 1.25, on: 'body' },
  { id: 'front', label: 'Front', yaw: Math.PI / 2, pitch: 0.15, dist: 1.1, on: 'body' },
  { id: 'top', label: 'Top', yaw: 0.4, pitch: 1.35, dist: 1.4, on: 'body' },
  { id: 'face', label: 'Face', yaw: 1.1, pitch: 0.12, dist: 0.45, on: 'head' },
];
const STORE = 'wm3-builder-coco';
const SLOTS = 'wm3-builder-coco-slots';
const isDev = typeof window !== 'undefined' && /^(localhost|127\.|0\.0\.0\.0)/.test(window.location.hostname);

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const writeJson = (key: string, v: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* private window: the build still works, it just isn't remembered */
  }
};
/** Only what differs from the base, so links and saved files stay short. */
const diff = (p: CocoParams) =>
  Object.fromEntries(Object.entries(p).filter(([k, v]) => COCO_BASE[k as keyof CocoParams] !== v)) as Partial<CocoParams>;
const fromUrl = (): Partial<CocoParams> | null => {
  const raw = new URLSearchParams(window.location.search).get('coco');
  if (!raw) return null;
  try {
    return JSON.parse(atob(raw.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
};

const fmt = (c: Control, v: number) => {
  if (c.type !== 'range') return '';
  if (c.min < 0) return `${v > 0 ? '+' : ''}${Math.round(v * 100)}`;
  if (c.max <= 1.01) return `${Math.round(v * 100)}`;
  return `${Math.round(v * 100)}%`;
};

const Builder: React.FC<{ onNavigate: (r: Route) => void }> = ({ onNavigate }) => {
  const [params, setParams] = useState<CocoParams>(() => normalizeCoco({ ...COCO, ...readJson<Partial<CocoParams>>(STORE, {}), ...(fromUrl() ?? {}) }));
  const [group, setGroup] = useState(CONTROLS[0].group);
  const [mode, setMode] = useState<ViewMode>('studio');
  const [cam, setCam] = useState({ ...CAMS[0] });
  const [spin, setSpin] = useState(false);
  const [compare, setCompare] = useState(false);
  const [toast, setToast] = useState('');
  const [failed, setFailed] = useState('');
  const [ready, setReady] = useState(false);
  const [wide, setWide] = useState(() => window.innerWidth > 760);
  useEffect(() => {
    const onResize = () => setWide(window.innerWidth > 760);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const [slots, setSlots] = useState<(Partial<CocoParams> | null)[]>(() => readJson(SLOTS, [null, null, null, null, null, null]));
  const history = useRef<{ past: CocoParams[]; future: CocoParams[] }>({ past: [], future: [] });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const roomRef = useRef<PodRoom | null>(null);
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);

  // the room, driven by the builder
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const room = startPodRoom(canvas, {
      calm: false,
      builder: true,
      coco: params,
      onReady: () => setReady(true),
      onFail: (m) => setFailed(m),
      onAnchors: () => {},
    });
    roomRef.current = room;
    return () => {
      room.dispose();
      roomRef.current = null;
    };
    // the room is made once; later changes go through setCoco
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // rebuild her at most once a frame while a slider moves
  const shown = compare ? COCO : params;
  const pending = useRef<number | null>(null);
  useEffect(() => {
    if (!ready) return;
    if (pending.current) cancelAnimationFrame(pending.current);
    pending.current = requestAnimationFrame(() => {
      roomRef.current?.setCoco(shown);
      pending.current = null;
    });
    writeJson(STORE, diff(params));
  }, [shown, ready, params]);

  // the camera
  const view: BuilderView = useMemo(
    () => ({
      studio: mode === 'studio',
      orbit:
        mode === 'room'
          ? null
          : {
              yaw: cam.yaw,
              pitch: cam.pitch,
              dist: cam.dist,
              on: cam.on,
              // wide screens: sit her right of the panel; phones: above the sheet
              shift: wide ? [0.3, 0.05] : [0, 0.42],
            },
    }),
    [mode, cam, wide],
  );
  useEffect(() => {
    if (ready) roomRef.current?.setView(view);
    // the stage gets a brighter exposure than the night room, so a black coat still shows its form
    const w = window as unknown as { __podFx?: Record<string, number> };
    w.__podFx = mode === 'studio' ? { blur: 0.003 } : mode === 'desk' ? { blur: 0.004 } : {};
    return () => {
      w.__podFx = {};
    };
  }, [view, ready, mode]);
  useEffect(() => {
    if (!spin || mode === 'room') return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setCam((c) => ({ ...c, yaw: c.yaw + dt * 0.5 }));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [spin, mode]);

  const say = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast((t) => (t === m ? '' : t)), 2200);
  };

  const commit = useCallback((next: CocoParams) => {
    setParams((prev) => {
      history.current.past.push(prev);
      if (history.current.past.length > 200) history.current.past.shift();
      history.current.future = [];
      return next;
    });
  }, []);
  const set = <K extends keyof CocoParams>(key: K, value: CocoParams[K]) => commit({ ...params, [key]: value });
  const undo = useCallback(() => {
    const prev = history.current.past.pop();
    if (!prev) return;
    setParams((cur) => {
      history.current.future.push(cur);
      return prev;
    });
  }, []);
  const redo = useCallback(() => {
    const next = history.current.future.pop();
    if (!next) return;
    setParams((cur) => {
      history.current.past.push(cur);
      return next;
    });
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const randomize = (only?: string) => {
    const next = { ...params } as Record<string, unknown>;
    for (const g of CONTROLS) {
      if (only && g.group !== only) continue;
      for (const c of g.controls) {
        if (c.type === 'range') {
          // stay near the middle of each range, so a roll gives a dog rather than a creature
          const mid = (c.min + c.max) / 2;
          const span = (c.max - c.min) / 2;
          next[c.key] = Math.round((mid + (Math.random() * 2 - 1) * span * 0.6) * 100) / 100;
        } else if (c.type === 'select' && c.key !== 'pose') next[c.key] = c.options[Math.floor(Math.random() * c.options.length)].value;
        else if (c.type === 'color') next[c.key] = c.swatches[Math.floor(Math.random() * c.swatches.length)];
      }
    }
    commit(next as CocoParams);
  };

  const link = () => {
    const code = btoa(JSON.stringify(diff(params))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `${window.location.origin}/?coco=${code}#builder`;
  };
  const copy = async (text: string, done: string) => {
    try {
      await navigator.clipboard.writeText(text);
      say(done);
    } catch {
      window.prompt('Copy this', text);
    }
  };
  const saveToRoom = async () => {
    try {
      const res = await fetch('/__builder/coco', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(diff(params)) });
      if (!res.ok) throw new Error(String(res.status));
      say('Saved. The room now shows this Coco.');
    } catch {
      say('Could not save: run the dev server, or use Copy link.');
    }
  };
  const saveSlot = (i: number) => {
    const next = slots.slice();
    next[i] = diff(params);
    setSlots(next);
    writeJson(SLOTS, next);
    say(`Saved to slot ${i + 1}`);
  };

  // drag to turn her, wheel to come closer
  const onPointerDown = (e: React.PointerEvent) => {
    if (mode === 'room') return;
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch };
    setSpin(false);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setCam((c) => ({
      ...c,
      yaw: d.yaw - (e.clientX - d.x) * 0.008,
      pitch: Math.max(-0.05, Math.min(1.45, d.pitch + (e.clientY - d.y) * 0.006)),
    }));
  };
  const onPointerUp = () => {
    drag.current = null;
  };
  const onWheel = (e: React.WheelEvent) => {
    if (mode === 'room') return;
    setCam((c) => ({ ...c, dist: Math.max(0.2, Math.min(1.7, c.dist * Math.exp(e.deltaY * 0.0012))) }));
  };

  useEffect(() => {
    // a handle for scripted screenshots on the dev server
    if (isDev) (window as unknown as { __builder?: unknown }).__builder = { commit, setMode, setCam, CAMS, COCO, roomRef, ready, view };
  });

  const controls = CONTROLS.find((g) => g.group === group)!.controls;
  const changed = (k: keyof CocoParams) => params[k] !== COCO[k];
  const groupChanged = (g: string) => CONTROLS.find((x) => x.group === g)!.controls.some((c) => changed(c.key));

  return (
    <div className={`bld${mode === 'room' ? ' bld--room' : ''}`}>
      <canvas
        ref={canvasRef}
        className={`bld__stage${mode === 'room' ? '' : ' bld__stage--grab'}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      />
      {failed && <p className="bld__fail">The 3D view could not start: {failed}</p>}

      <header className="bld__top">
        <a
          className="bld__back"
          href="#now"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('home');
          }}
        >
          ← The pod
        </a>
        <div className="bld__title">
          <span className="bld__kicker">Character builder</span>
          <h1>Coco</h1>
        </div>
        <div className="bld__views" role="group" aria-label="Where to see her">
          {(
            [
              ['studio', 'Studio'],
              ['desk', 'Under the desk'],
              ['room', 'Room view'],
            ] as [ViewMode, string][]
          ).map(([id, label]) => (
            <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)}>
              {label}
            </button>
          ))}
        </div>
      </header>

      <nav className="bld__tabs" aria-label="Parts">
        {CONTROLS.map((g) => (
          <button key={g.group} type="button" aria-current={group === g.group ? 'true' : undefined} onClick={() => setGroup(g.group)}>
            {g.group}
            {groupChanged(g.group) && <i aria-label="changed" />}
          </button>
        ))}
      </nav>

      <section className="bld__panel" aria-label={group}>
        <div className="bld__panelhead">
          <h2>{group}</h2>
          <button type="button" className="bld__ghost" onClick={() => randomize(group)}>
            Roll {group.toLowerCase()}
          </button>
        </div>
        <div className="bld__controls">
          {controls.map((c) => {
            const v = params[c.key];
            const reset = changed(c.key) ? (
              <button type="button" className="bld__reset" title="Back to Coco's" onClick={() => set(c.key, COCO[c.key] as never)}>
                ↺
              </button>
            ) : null;
            if (c.type === 'range')
              return (
                <label key={c.key} className="bld__row">
                  <span className="bld__label">
                    {c.label}
                    {reset}
                  </span>
                  <span className="bld__slider">
                    <input
                      type="range"
                      min={c.min}
                      max={c.max}
                      step={c.step ?? 0.01}
                      value={v as number}
                      onChange={(e) => setParams((p) => ({ ...p, [c.key]: Number(e.target.value) }))}
                      onPointerDown={() => history.current.past.push(params)}
                      onKeyDown={() => history.current.past.push(params)}
                    />
                    <output>{fmt(c, v as number)}</output>
                  </span>
                </label>
              );
            if (c.type === 'select')
              return (
                <div key={c.key} className="bld__row">
                  <span className="bld__label">
                    {c.label}
                    {reset}
                  </span>
                  <div className="bld__chips">
                    {c.options.map((o) => (
                      <button key={o.value} type="button" aria-pressed={v === o.value} onClick={() => set(c.key, o.value as never)}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            if (c.type === 'color')
              return (
                <div key={c.key} className="bld__row">
                  <span className="bld__label">
                    {c.label}
                    {reset}
                  </span>
                  <div className="bld__swatches">
                    {c.swatches.map((sw) => (
                      <button
                        key={sw}
                        type="button"
                        aria-label={sw}
                        aria-pressed={v === sw}
                        style={{ background: sw }}
                        onClick={() => set(c.key, sw as never)}
                      />
                    ))}
                    <input type="color" aria-label={`${c.label}: any colour`} value={v as string} onChange={(e) => set(c.key, e.target.value as never)} />
                  </div>
                </div>
              );
            return (
              <label key={c.key} className="bld__row bld__row--toggle">
                <span className="bld__label">
                  {c.label}
                  {reset}
                </span>
                <input type="checkbox" checked={v as boolean} onChange={(e) => set(c.key, e.target.checked as never)} />
              </label>
            );
          })}
        </div>
      </section>

      {mode !== 'room' && (
        <div className="bld__cams" role="group" aria-label="Camera">
          {CAMS.map((c) => (
            <button key={c.id} type="button" onClick={() => setCam({ ...c })}>
              {c.label}
            </button>
          ))}
          <button type="button" aria-pressed={spin} onClick={() => setSpin((s) => !s)}>
            Turntable
          </button>
        </div>
      )}

      <footer className="bld__bar">
        <div className="bld__presets" role="group" aria-label="Presets">
          {PRESETS.map((pr) => (
            <button key={pr.name} type="button" onClick={() => commit({ ...COCO_BASE, ...pr.params })}>
              {pr.name}
            </button>
          ))}
        </div>
        <div className="bld__slots" role="group" aria-label="Save slots">
          {slots.map((sl, i) => (
            <span key={i} className="bld__slot">
              <button type="button" disabled={!sl} onClick={() => sl && commit(normalizeCoco({ ...COCO_BASE, ...sl }))} title={sl ? 'Load' : 'Empty'}>
                {i + 1}
              </button>
              <button type="button" className="bld__slotsave" onClick={() => saveSlot(i)} title={`Save to slot ${i + 1}`}>
                Save
              </button>
            </span>
          ))}
        </div>
        <div className="bld__actions">
          <button type="button" onClick={undo} title="Undo (⌘Z)">
            Undo
          </button>
          <button type="button" onClick={redo} title="Redo (⇧⌘Z)">
            Redo
          </button>
          <button type="button" onClick={() => randomize()}>
            Randomize
          </button>
          <button
            type="button"
            onPointerDown={() => setCompare(true)}
            onPointerUp={() => setCompare(false)}
            onPointerLeave={() => setCompare(false)}
            title="Hold to see the Coco that's in the room now"
          >
            Hold: before
          </button>
          <button type="button" onClick={() => commit({ ...COCO })}>
            Reset
          </button>
          <button type="button" onClick={() => copy(link(), 'Link copied')}>
            Copy link
          </button>
          {isDev && (
            <button type="button" className="bld__primary" onClick={saveToRoom}>
              Save to the room
            </button>
          )}
        </div>
      </footer>
      {toast && (
        <p className="bld__toast" role="status">
          {toast}
        </p>
      )}
      {compare && <p className="bld__compare">Showing the Coco in the room now</p>}
    </div>
  );
};

export default Builder;
