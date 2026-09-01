import React from 'react';
import { serif } from './styles';

interface Props {
  /** The photo. Without one the frame is honest about being empty. */
  src?: string;
  /** Alt text when there is a photo; the promise of one when there isn't. */
  placeholder: string;
  caption: string;
  /** Degrees of tilt, so a row of frames reads as a stack rather than a grid. */
  tilt: number;
  height: number;
}

/**
 * A tilted photo frame. Real photos are cropped to the frame rather than the
 * frame to the photo, so a row stays level whatever mix of portrait and
 * landscape goes into it. Stands in for the design's <image-slot>, which only
 * exists inside the design canvas.
 */
const PhotoFrame: React.FC<Props> = ({ src, placeholder, caption, tilt, height }) => (
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
    {src ? (
      <img
        src={src}
        alt={placeholder}
        loading="lazy"
        style={{
          width: '100%',
          height,
          objectFit: 'cover',
          borderRadius: 2,
          display: 'block',
        }}
      />
    ) : (
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
    )}
    <span
      style={{
        ...serif(13),
        textAlign: 'center',
      }}
    >
      {caption}
    </span>
  </div>
);

export default PhotoFrame;
