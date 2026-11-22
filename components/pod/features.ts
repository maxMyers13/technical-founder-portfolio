/**
 * Feature flags for the pod. Flip a default here to change what everyone sees; any flag can also be overridden for
 * one visit from the URL, e.g. `?drums=1` to show the drum kit or `?drums=0` to hide it.
 */
const DEFAULTS = {
  /** The red drum kit in the front-right corner. Off: it crowded the right side of the room. */
  drums: false,
};

export type FeatureName = keyof typeof DEFAULTS;

const fromUrl = (name: FeatureName): boolean | null => {
  if (typeof window === 'undefined') return null;
  const v = new URLSearchParams(window.location.search).get(name);
  if (v === '1' || v === 'true' || v === 'on') return true;
  if (v === '0' || v === 'false' || v === 'off') return false;
  return null;
};

export const feature = (name: FeatureName): boolean => fromUrl(name) ?? DEFAULTS[name];
