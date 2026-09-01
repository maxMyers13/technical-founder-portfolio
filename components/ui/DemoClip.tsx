import React, { useEffect, useRef } from 'react';
import { serif } from './styles';

interface Props {
  src: string;
  /** Describes the clip for anyone who can't watch it. */
  label: string;
  caption: string;
}

/**
 * A silent looping screen recording, framed like the stills around it.
 * Only the clips actually on screen play — five simultaneous loops is a lot
 * of decode work for a laptop that is only showing one of them.
 */
const DemoClip: React.FC<Props> = ({ src, label, caption }) => {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = video.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        style={{
          border: '1px solid var(--line)',
          borderRadius: 12,
          overflow: 'hidden',
          background: 'var(--bg2)',
        }}
      >
        <video
          ref={video}
          src={src}
          aria-label={label}
          muted
          loop
          playsInline
          preload="metadata"
          style={{ width: '100%', aspectRatio: '1152 / 720', display: 'block' }}
        />
      </div>
      <figcaption style={serif(13)}>{caption}</figcaption>
    </figure>
  );
};

export default DemoClip;
