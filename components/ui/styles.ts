import React from 'react';

/** The Newsreader italic used for every label, aside and caption on the site. */
export const serif = (size: number, color = 'var(--mute)'): React.CSSProperties => ({
  fontFamily: "'Newsreader', serif",
  fontStyle: 'italic',
  fontSize: size,
  color,
});

/** Underline that darkens on hover — pair with className="h-underline". */
export const inlineLink: React.CSSProperties = {
  fontWeight: 600,
  borderBottom: '1px solid var(--hair)',
};

export const sectionHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 24,
  paddingBottom: 18,
  borderBottom: '1px solid var(--ink)',
};

export const sectionTitle: React.CSSProperties = {
  fontSize: 34,
  fontWeight: 800,
  letterSpacing: '-.03em',
  color: 'var(--ink)',
};

export const pageTitle: React.CSSProperties = {
  fontSize: 62,
  fontWeight: 900,
  letterSpacing: '-.05em',
  lineHeight: 0.98,
  color: 'var(--ink)',
  marginTop: 44,
};

export const pageIntro: React.CSSProperties = {
  fontSize: 19,
  lineHeight: 1.6,
  color: 'var(--body)',
  marginTop: 20,
  textWrap: 'pretty',
};

export const solidButton: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 52,
  padding: '0 26px',
  borderRadius: 6,
  background: 'var(--ink)',
  color: 'var(--bg)',
  fontWeight: 700,
  fontSize: 15,
};

export const outlineButton: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 52,
  padding: '0 26px',
  borderRadius: 6,
  border: '1px solid var(--hair)',
  color: 'var(--ink)',
  fontWeight: 600,
  fontSize: 15,
};

/** The two-column "label on the left, prose on the right" block. */
export const asideRow = (labelWidth: number, gap = 44): React.CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: `${labelWidth}px 1fr`,
  gap,
});
