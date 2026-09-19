import { CURVES } from './config.js';

export function biorhythm(days, period) {
  return Math.sin((2 * Math.PI * days) / period);
}

/** Liefert ein Objekt { physical, emotional, intellectual } für N Tage seit Geburt. */
export function valuesFor(days) {
  const out = {};
  CURVES.forEach(function (c) {
    out[c.key] = biorhythm(days, c.period);
  });
  return out;
}