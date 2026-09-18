(function () {
  'use strict';

  /* ============ Konfiguration ============ */
  const STORAGE_KEY = 'biorhythmus.geburtsdatum';
  const DAYS_VISIBLE = 10;   // sichtbare Tage im Diagramm
  const STEP_DAYS = 10;      // Tage pro Regler-Schritt

  const CURVES = [
    { key: 'physical',     period: 23, color: '#ef4444' },
    { key: 'emotional',    period: 28, color: '#3b82f6' },
    { key: 'intellectual', period: 33, color: '#22c55e' }
  ];

  const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

  /* ============ DOM ============ */
  const canvas     = document.getElementById('chart');
  const ctx        = canvas.getContext('2d');
  const birthInput = document.getElementById('birthdate');
  const slider     = document.getElementById('slider');
  const rangeText  = document.getElementById('rangeText');
  const todayBtn   = document.getElementById('todayBtn');

  const valueEls = {};
  CURVES.forEach(function (c) {
    valueEls[c.key] = document.getElementById('val-' + c.key);
  });

  /* ============ Zustand ============ */
  let birthDate = null;   // Date oder null
  let offset    = 0;      // Verschiebung in 10-Tage-Schritten

  /* ============ Datums-Helfer ============ */
  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function todayStart() {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }

  function addDays(date, days) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  }

  /** Ganze Tage von "from" bis "to" (DST-sicher über UTC). */
  function diffDays(from, to) {
    const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
    const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.round((b - a) / 86400000);
  }

  function parseISODate(value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    if (!m) return null;
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d.getTime()) ? null : d;
  }

  function toISODate(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function fmtShort(d) {
    return pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.';
  }

  function fmtMedium(d) {
    return pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.' + d.getFullYear();
  }

  /* ============ Biorhythmus ============ */
  function biorhythm(days, period) {
    return Math.sin((2 * Math.PI * days) / period);
  }

  /* ============ Zeichnen ============ */
  function draw() {
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

    /* --- Noch kein Geburtsdatum --- */
    if (!birthDate) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '15px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText('Bitte zuerst das Geburtsdatum eingeben', W / 2, H / 2);
      return;
    }

    /* --- Layout --- */
    const narrow = W < 480;
    const padL = narrow ? 38 : 48;
    const padR = 16;
    const padT = 14;
    const padB = narrow ? 38 : 42;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const start    = addDays(todayStart(), offset * STEP_DAYS);
    const baseDays = diffDays(birthDate, start);

    const xFor = function (i) { return padL + (i / (DAYS_VISIBLE - 1)) * plotW; };
    const yFor = function (v) { return padT + ((1 - v) / 2) * plotH; };

    /* --- Hintergrund-Band für "heute" --- */
    const idxToday = diffDays(start, todayStart());
    if (idxToday >= 0 && idxToday < DAYS_VISIBLE) {
      const step = plotW / (DAYS_VISIBLE - 1);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
      ctx.fillRect(xFor(idxToday) - step / 2, padT, step, plotH);
    }

    /* --- Horizontale Gitterlinien + Y-Beschriftung --- */
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

    /* --- Vertikale Tageslinien --- */
    ctx.strokeStyle = '#eef2f7';
    for (let i = 0; i < DAYS_VISIBLE; i++) {
      const x = Math.round(xFor(i)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
    }

    /* --- X-Beschriftung (Wochentag + Datum) --- */
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

    /* --- Kurven --- */
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
        if (s === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle = c.color;
      ctx.stroke();
    });

    /* --- Punkte an ganzen Tagen --- */
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

  /* ============ Anzeige aktualisieren ============ */
  function updateLegend() {
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

  function updateRangeText() {
    const start = addDays(todayStart(), offset * STEP_DAYS);
    const end   = addDays(start, DAYS_VISIBLE - 1);
    rangeText.textContent = fmtMedium(start) + ' – ' + fmtMedium(end);
    todayBtn.disabled = (offset === 0);
  }

  function refresh() {
    updateRangeText();
    updateLegend();
    draw();
  }

  /* ============ LocalStorage ============ */
  function loadBirthDate() {
    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    return parseISODate(saved);
  }

  function saveBirthDate(value) {
    try {
      if (value) {
        localStorage.setItem(STORAGE_KEY, value);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) { /* ignore */ }
  }

  /* ============ Events ============ */
  birthInput.addEventListener('change', function () {
    const d = parseISODate(birthInput.value);
    if (d) {
      birthDate = d;
      saveBirthDate(birthInput.value);
    } else {
      birthDate = null;
      saveBirthDate(null);
    }
    refresh();
  });

  slider.addEventListener('input', function () {
    offset = Number(slider.value) || 0;
    updateRangeText();
    draw();
  });

  todayBtn.addEventListener('click', function () {
    offset = 0;
    slider.value = '0';
    updateRangeText();
    draw();
  });

  /* ============ Resize (gebündelt) ============ */
  let rafId = null;
  function scheduleDraw() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(function () {
      rafId = null;
      draw();
    });
  }
  window.addEventListener('resize', scheduleDraw);
  window.addEventListener('orientationchange', scheduleDraw);

  /* ============ Start ============ */
  function init() {
    birthInput.max = toISODate(todayStart());

    const saved = loadBirthDate();
    if (saved) {
      birthDate = saved;
      birthInput.value = toISODate(saved);
    }

    slider.value = '0';
    offset = 0;

    refresh();
  }

  init();
})();