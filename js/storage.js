import { STORAGE_KEY } from './config.js';
import { parseISODate, toISODate } from './dates.js';

export function loadBirthDate() {
  let saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  return parseISODate(saved);
}

export function saveBirthDate(date) {
  try {
    if (date) {
      localStorage.setItem(STORAGE_KEY, toISODate(date));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) { /* ignore */ }
}