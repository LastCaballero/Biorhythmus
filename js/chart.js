import { CURVES, DAYS_VISIBLE, WEEKDAYS, FONT } from './config.js';
import { addDays, todayStart, diffDays, fmtShort } from './dates.js';
import { biorhythm } from './biorhythm.js';

/**
 * Zeichnet das Liniendiagramm.
 * @param {HTMLCanvasElement} canvas
 * @param {{ birthDate: Date|null, offset: number }} state
 *        offset = Tagesversatz gegenüber heute (z. B. -3 → 3 Tage zurück)
 */
export function drawChart(canvas, state) {
  const { birthDate, offset } = state;
  const ctx = canvas.getContext('2d');

  const rect = canvas.getBoundingClientRect();
  const W = Math.round(rect.width);
  const H = Math.round(rect.height);
  if (W === 0 || H === 0) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.textBaseline = 'middle';

  if (!birthDate) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '15px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText('Bitte zuerst das Geburtsdatum eingeben', W / 2, H / 2);
    return;
  }

  const narrow = W < 480;
  const padL = narrow ? 38 : 48;
  const padR = 16;
  const padT = 14;
  const padB = narrow ? 38 : 42;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  // ← hier: offset ist direkt die Anzahl der Tage
  const start    = addDays(todayStart(), offset);
  const baseDays = diffDays(birthDate, start);

  const xFor = function (i) { return padL + (i / (DAYS_VISIBLE - 1)) * plotW; };
  const yFor = function (v) { return padT + ((1 - v) / 2) * plotH; };

  const idxToday = diffDays(start, todayStart());
  if (idxToday >= 0 && idxToday < DAYS_VISIBLE) {
    const step = plotW / (DAYS_VISIBLE - 1);
    ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
    ctx.fillRect(xFor(idxToday) - step / 2, padT, step, plotH);
  }

  ctx.lineWidth = 1;
  ctx.font = (narrow ? 10 : 11) + 'px ' + FONT;
  ctx.textAlign = 'right';

  for (let k = -2; k <= 2; k++) {
    const v = k / 2;
    const y = Math.round(yFor(v)) + 0.5;

    ctx.strokeStyle = (v === 0) ? '#cbd5e1' : '#eef2f7';
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + plotW, y);
    ctx.stroke();

    if (k === -2 || k === 0 || k === 2) {
      ctx.fillStyle = '#94a3b8';
      const label = (k === 0) ? '0' : (k > 0 ? '+100%' : '-100%');
      ctx.fillText(label, padL - 6, y);
    }
  }

  ctx.strokeStyle = '#eef2f7';
  for (let i = 0; i < DAYS_VISIBLE; i++) {
    const x = Math.round(xFor(i)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, padT);
    ctx.lineTo(x, padT + plotH);
    ctx.stroke();
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const labelStep = narrow ? 2 : 1;
  for (let i = 0; i < DAYS_VISIBLE; i += labelStep) {
    const d = addDays(start, i);
    const x = xFor(i);

    ctx.fillStyle = '#64748b';
    ctx.font = '600 ' + (narrow ? 10 : 11) + 'px ' + FONT;
    ctx.fillText(WEEKDAYS[d.getDay()], x, padT + plotH + 7);

    ctx.fillStyle = '#94a3b8';
    ctx.font = (narrow ? 10 : 11) + 'px ' + FONT;
    ctx.fillText(fmtShort(d), x, padT + plotH + 7 + (narrow ? 12 : 14));
  }

  const samples = 200;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = 2;

  CURVES.forEach(function (c) {
    ctx.beginPath();
    for (let s = 0; s <= samples; s++) {
      const t = (s / samples) * (DAYS_VISIBLE - 1);
      const v = biorhythm(baseDays + t, c.period);
      const x = xFor(t);
      const y = yFor(v);
      if (s === 0) ctx.moveTo(x, y);
      else         ctx.lineTo(x, y);
    }
    ctx.strokeStyle = c.color;
    ctx.stroke();
  });

  CURVES.forEach(function (c) {
    ctx.fillStyle = c.color;
    for (let i = 0; i < DAYS_VISIBLE; i++) {
      const v = biorhythm(baseDays + i, c.period);
      ctx.beginPath();
      ctx.arc(xFor(i), yFor(v), 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}
