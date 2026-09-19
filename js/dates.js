export function pad2(n) {
  return String(n).padStart(2, '0');
}

export function todayStart() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Ganze Tage von "from" bis "to" (DST-sicher über UTC). */
export function diffDays(from, to) {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86400000);
}

export function parseISODate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return isNaN(d.getTime()) ? null : d;
}

export function toISODate(d) {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

export function fmtShort(d) {
  return pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.';
}

export function fmtMedium(d) {
  return pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.' + d.getFullYear();
}