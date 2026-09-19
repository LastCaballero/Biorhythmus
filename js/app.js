import { DAYS_VISIBLE, DAY_OFFSET_MAX } from './config.js';
import { todayStart, addDays, fmtMedium } from './dates.js';
import { loadBirthDate, saveBirthDate } from './storage.js';
import { initBirthdatePicker } from './birthdatePicker.js';
import { initLegend } from './legend.js';
import { drawChart } from './chart.js';

/* ============ DOM ============ */
const canvas     = document.getElementById('chart');
const birthDay   = document.getElementById('birthDay');
const birthMonth = document.getElementById('birthMonth');
const birthYear  = document.getElementById('birthYear');
const slider     = document.getElementById('slider');
const rangeText  = document.getElementById('rangeText');
const todayBtn   = document.getElementById('todayBtn');

/* ============ Slider-Grenzen aus Config setzen ============ */
slider.min  = String(-DAY_OFFSET_MAX);   // -7
slider.max  = String(DAY_OFFSET_MAX);    // +7
slider.step = '1';
slider.value = '0';

/* ============ Zustand ============ */
let birthDate = loadBirthDate();
let offset    = 0;   // Tagesversatz gegenüber heute

/* ============ Module ============ */
const legend = initLegend(document);

initBirthdatePicker({
  dayEl: birthDay,
  monthEl: birthMonth,
  yearEl: birthYear,
  initialDate: birthDate,
  onChange: function (date) {
    birthDate = date;
    saveBirthDate(date);
    refresh();
  }
});

/* ============ Anzeige aktualisieren ============ */
function updateRangeText() {
  const start = addDays(todayStart(), offset);
  const end   = addDays(start, DAYS_VISIBLE - 1);
  rangeText.textContent = fmtMedium(start) + ' – ' + fmtMedium(end);
  todayBtn.disabled = (offset === 0);
}

function refresh() {
  updateRangeText();
  legend.update(birthDate);
  drawChart(canvas, { birthDate, offset });
}

/* ============ Events ============ */
slider.addEventListener('input', function () {
  offset = Number(slider.value) || 0;
  updateRangeText();
  drawChart(canvas, { birthDate, offset });
});

todayBtn.addEventListener('click', function () {
  offset = 0;
  slider.value = '0';
  updateRangeText();
  drawChart(canvas, { birthDate, offset });
});

/* ============ Resize (gebündelt) ============ */
let rafId = null;
function scheduleDraw() {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(function () {
    rafId = null;
    drawChart(canvas, { birthDate, offset });
  });
}
window.addEventListener('resize', scheduleDraw);
window.addEventListener('orientationchange', scheduleDraw);

/* ============ Start ============ */
refresh();
