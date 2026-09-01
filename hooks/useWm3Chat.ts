import { useCallback, useEffect, useRef, useState } from 'react';
import { Match, SCORE_FLOOR, prewarm, search, toSources } from '../lib/wm3/archive';
import { streamAnswer } from '../lib/wm3/generate';
import { AssistantMessage, Message } from '../types';

/** Ceiling on how fast text is revealed, so answers read rather than blink into place. */
const CHARS_PER_SECOND = 110;
const FRAME_MS = 16;
/** How long to wait before admitting the model is downloading, not thinking. */
const SLOW_NOTICE_MS = 1800;

const NOT_IN_ARCHIVE =
  'That isn’t in the archive — and WM3 doesn’t guess. It only answers from what Max has actually published: the posts, the builds, the talks, and this site.\n\nTry asking what he’s building, why he left Microsoft, or how he tailors a resume. Or email the human: max@learnwleo.com.';

/**
 * The Ask WM3 conversation.
 *
 * Retrieval runs over the static archive index, the query is embedded on the
 * visitor's machine, and the answer is either written up by Chrome's on-device
 * model or quoted straight from the archive. No server is involved.
 */
export function useWm3Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const ticker = useRef<number | null>(null);
  const abort = useRef<AbortController | null>(null);
  const lastQuestion = useRef('');

  // The typewriter needs to know, on every frame, how much text exists and
  // whether more is coming. Both live in refs: a setState updater does not run
  // synchronously, so deciding "finished" inside one races the frame that reads it.
  const full = useRef('');
  const generating = useRef(false);

  const clearTicker = useCallback(() => {
    if (ticker.current !== null) {
      window.clearInterval(ticker.current);
      ticker.current = null;
    }
  }, []);

  useEffect(() => {
    // The index is small and the model is the slow part — start both while the
    // reader is still deciding what to ask.
    prewarm();
    return () => {
      clearTicker();
      abort.current?.abort();
    };
  }, [clearTicker]);

  const patchLast = useCallback((patch: Partial<AssistantMessage>) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== 'assistant') return prev;
      return [...prev.slice(0, -1), { ...last, ...patch }];
    });
  }, []);

  /**
   * Reveals `full` at a steady rate. Deltas from the on-device model extend it
   * as they arrive; a quoted answer arrives whole. Either way it reads as typed.
   */
  const startTicker = useCallback(() => {
    clearTicker();
    let revealed = 0;

    ticker.current = window.setInterval(() => {
      revealed += (CHARS_PER_SECOND * FRAME_MS) / 1000;
      const text = full.current.slice(0, Math.floor(revealed));
      const settled = !generating.current && text.length >= full.current.length;

      patchLast({ text, pending: false, streaming: !settled });

      if (settled) {
        clearTicker();
        setStreaming(false);
      }

      const doc = document.documentElement;
      if (window.innerHeight + window.scrollY > doc.scrollHeight - 260) {
        window.scrollTo(0, doc.scrollHeight);
      }
    }, FRAME_MS);
  }, [clearTicker, patchLast]);

  const run = useCallback(
    async (question: string) => {
      const controller = new AbortController();
      abort.current = controller;
      full.current = '';
      generating.current = true;

      const slowNotice = window.setTimeout(
        () =>
          patchLast({ pendingNote: 'first question loads the on-device model — about 24MB, once' }),
        SLOW_NOTICE_MS,
      );

      try {
        const matches = await search(question);
        window.clearTimeout(slowNotice);
        if (controller.signal.aborted) return;

        const relevant: Match[] = matches.filter((m) => m.score >= SCORE_FLOOR);

        if (relevant.length === 0) {
          full.current = NOT_IN_ARCHIVE;
          generating.current = false;
          patchLast({ pending: false, pendingNote: undefined, notFound: true });
          startTicker();
          return;
        }

        patchLast({
          pending: false,
          pendingNote: undefined,
          sources: toSources(relevant).slice(0, 3),
        });
        startTicker();

        for await (const delta of streamAnswer(question, relevant, controller.signal)) {
          if (controller.signal.aborted) break;
          full.current += delta;
        }
        generating.current = false;
      } catch (err) {
        // The reader gets a plain "couldn't reach the archive"; the cause goes
        // to the console so a failure is diagnosable from a bug report.
        console.error('[WM3] retrieval failed', err);
        window.clearTimeout(slowNotice);
        generating.current = false;
        clearTicker();
        patchLast({ pending: false, pendingNote: undefined, error: true });
        setStreaming(false);
      }
    },
    [clearTicker, patchLast, startTicker],
  );

  const ask = useCallback(
    (rawQuestion: string) => {
      const question = rawQuestion.trim();
      if (!question || streaming) return;
      lastQuestion.current = question;

      setMessages((prev) => [
        ...prev,
        { role: 'user', text: question },
        {
          role: 'assistant',
          text: '',
          sources: [],
          notFound: false,
          pending: true,
          streaming: true,
          error: false,
        },
      ]);
      setStreaming(true);
      void run(question);
    },
    [run, streaming],
  );

  const retry = useCallback(() => {
    if (!lastQuestion.current) return;
    patchLast({
      error: false,
      pending: true,
      streaming: true,
      text: '',
      sources: [],
      notFound: false,
    });
    setStreaming(true);
    void run(lastQuestion.current);
  }, [patchLast, run]);

  const stop = useCallback(() => {
    abort.current?.abort();
    clearTicker();
    generating.current = false;
    // Keep whatever was written rather than snapping to the full answer.
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== 'assistant') return prev;
      full.current = last.text;
      return [...prev.slice(0, -1), { ...last, streaming: false, pending: false }];
    });
    setStreaming(false);
  }, [clearTicker]);

  const clear = useCallback(() => {
    abort.current?.abort();
    clearTicker();
    generating.current = false;
    full.current = '';
    setMessages([]);
    setStreaming(false);
  }, [clearTicker]);

  return { messages, streaming, ask, retry, stop, clear };
}
