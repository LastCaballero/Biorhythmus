import { CURVES } from './config.js';
import { todayStart, diffDays } from './dates.js';
import { biorhythm } from './biorhythm.js';

/**
 * Initialisiert die Legende und gibt ein Objekt mit update() zurück.
 * @param {HTMLElement} root  Container, in dem nach den value-Elementen gesucht wird.
 */
export function initLegend(root) {
  const valueEls = {};
  CURVES.forEach(function (c) {
    valueEls[c.key] = root.querySelector('#val-' + c.key);
  });

  function update(birthDate) {
    if (!birthDate) {
      CURVES.forEach(function (c) { valueEls[c.key].textContent = '–'; });
      return;
    }
    const days = diffDays(birthDate, todayStart());
    CURVES.forEach(function (c) {
      const pct = Math.round(biorhythm(days, c.period) * 100);
      valueEls[c.key].textContent = (pct > 0 ? '+' : '') + pct + ' %';
    });
  }

  return { update };
}