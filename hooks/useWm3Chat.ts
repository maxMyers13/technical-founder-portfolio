import { useCallback, useEffect, useRef, useState } from 'react';
import { answerFor } from '../constants';
import { AssistantMessage, Message } from '../types';

/** Characters revealed per second while an answer streams in. */
const CHARS_PER_SECOND = 110;
/** How long WM3 "reads the archive" before the first character lands. */
const THINKING_MS = 480;
const FRAME_MS = 16;

/**
 * The Ask WM3 conversation. Answers come from the demo slice in constants.ts
 * and are revealed at a steady rate so the page behaves like the real
 * retrieval backend will once it is wired up.
 */
export function useWm3Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const timer = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const patchLast = useCallback((patch: Partial<AssistantMessage>) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last.role !== 'assistant') return prev;
      return [...prev.slice(0, -1), { ...last, ...patch }];
    });
  }, []);

  const startStream = useCallback(() => {
    clearTimer();
    const startedAt = Date.now();

    timer.current = window.setInterval(() => {
      let finished = false;

      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (last.role !== 'assistant' || !last.streaming) {
          finished = true;
          return prev;
        }

        const revealed = Math.floor(((Date.now() - startedAt) / 1000) * CHARS_PER_SECOND);
        const text = last.full.slice(0, revealed);
        const done = text.length >= last.full.length;
        if (done) finished = true;

        return [...prev.slice(0, -1), { ...last, text, pending: false, streaming: !done }];
      });

      if (finished) {
        clearTimer();
        setStreaming(false);
      }

      // Follow the answer down the page, but only if the reader is already there.
      const doc = document.documentElement;
      if (window.innerHeight + window.scrollY > doc.scrollHeight - 260) {
        window.scrollTo(0, doc.scrollHeight);
      }
    }, FRAME_MS);
  }, [clearTimer]);

  const ask = useCallback(
    (rawQuestion: string) => {
      const question = rawQuestion.trim();
      if (!question || streaming) return;

      const answer = answerFor(question);
      setMessages((prev) => [
        ...prev,
        { role: 'user', text: question },
        {
          role: 'assistant',
          text: '',
          full: answer.text,
          sources: answer.sources,
          notFound: !!answer.notFound,
          pending: true,
          streaming: true,
          error: false,
        },
      ]);
      setStreaming(true);
      window.setTimeout(startStream, THINKING_MS);
    },
    [startStream, streaming],
  );

  const retry = useCallback(() => {
    setMessages((prev) => {
      const question = prev.length > 1 ? prev[prev.length - 2] : undefined;
      if (!question || question.role !== 'user') return prev;
      const answer = answerFor(question.text);
      const last = prev[prev.length - 1];
      if (last.role !== 'assistant') return prev;
      return [
        ...prev.slice(0, -1),
        {
          ...last,
          error: false,
          pending: true,
          streaming: true,
          text: '',
          full: answer.text,
          sources: answer.sources,
          notFound: !!answer.notFound,
        },
      ];
    });
    setStreaming(true);
    window.setTimeout(startStream, THINKING_MS);
  }, [startStream]);

  const stop = useCallback(() => {
    clearTimer();
    patchLast({ streaming: false, pending: false });
    setStreaming(false);
  }, [clearTimer, patchLast]);

  const clear = useCallback(() => {
    clearTimer();
    setMessages([]);
    setStreaming(false);
  }, [clearTimer]);

  return { messages, streaming, ask, retry, stop, clear };
}
