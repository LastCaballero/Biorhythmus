import { MONTHS, MIN_YEAR } from './config.js';
import { todayStart } from './dates.js';

/**
 * Initialisiert die drei Select-Felder für Tag / Monat / Jahr.
 * @param {Object} opts
 * @param {HTMLSelectElement} opts.dayEl
 * @param {HTMLSelectElement} opts.monthEl
 * @param {HTMLSelectElement} opts.yearEl
 * @param {(date: Date|null) => void} opts.onChange
 * @param {Date|null} [opts.initialDate]
 */
export function initBirthdatePicker(opts) {
  const { dayEl, monthEl, yearEl, onChange, initialDate } = opts;

  populate();
  if (initialDate) setDate(initialDate);

  [dayEl, monthEl, yearEl].forEach(function (el) {
    el.addEventListener('change', handleChange);
  });

  function populate() {
    for (let d = 1; d <= 31; d++) {
      dayEl.appendChild(makeOption(d, d));
    }
    MONTHS.forEach(function (name, i) {
      monthEl.appendChild(makeOption(i + 1, name));
    });
    const thisYear = todayStart().getFullYear();
    for (let y = thisYear; y >= MIN_YEAR; y--) {
      yearEl.appendChild(makeOption(y, y));
    }
  }

  function makeOption(value, label) {
    const o = document.createElement('option');
    o.value = value;
    o.textContent = label;
    return o;
  }

  function read() {
    const d = parseInt(dayEl.value, 10);
    const m = parseInt(monthEl.value, 10);
    const y = parseInt(yearEl.value, 10);
    if (!d || !m || !y) return null;

    const date = new Date(y, m - 1, d);
    if (
      date.getFullYear() !== y ||
      date.getMonth() !== m - 1 ||
      date.getDate() !== d
    ) return null;

    if (date > todayStart()) return null;

    return date;
  }

  function setDate(date) {
    dayEl.value   = date.getDate();
    monthEl.value = date.getMonth() + 1;
    yearEl.value  = date.getFullYear();
  }

  function handleChange() {
    onChange(read());
  }

  return { getDate: read, setDate };
}