import React from 'react';

interface Props {
  /** What the photo will be, once there is one. */
  placeholder: string;
  caption: string;
  /** Degrees of tilt, so a row of frames reads as a stack rather than a grid. */
  tilt: number;
  height: number;
}

/**
 * A tilted photo frame that is honest about being empty. Stands in for the
 * design's <image-slot>, which only exists inside the design canvas.
 */
const PhotoFrame: React.FC<Props> = ({ placeholder, caption, tilt, height }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      background: 'var(--card)',
      border: '1px solid var(--line)',
      borderRadius: 4,
      padding: '10px 10px 12px',
      boxShadow: 'var(--shadow)',
      transform: `rotate(${tilt}deg)`,
    }}
  >
    <div
      style={{
        height,
        border: '1px dashed var(--hair)',
        borderRadius: 2,
        background: 'var(--bg2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px',
        textAlign: 'center',
        fontFamily: "'Newsreader', serif",
        fontStyle: 'italic',
        fontSize: 14,
        lineHeight: 1.5,
        color: 'var(--mute)',
      }}
    >
      {placeholder}
    </div>
    <span
      style={{
        fontFamily: "'Newsreader', serif",
        fontStyle: 'italic',
        fontSize: 13,
        color: 'var(--mute)',
        textAlign: 'center',
      }}
    >
      {caption}
    </span>
  </div>
);

export default PhotoFrame;
