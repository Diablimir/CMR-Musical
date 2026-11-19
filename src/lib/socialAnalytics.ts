// Análisis del historial de redes: cambio entre capturas y cruce con las acciones (shows, lanzamientos, campañas…).
// Todo se calcula con capturas REALES guardadas; si falta una captura antes o después, se dice «sin datos suficientes» (nunca se estima).
import type { SocialMetric, SocialAction, SocialPlatform, ActionType } from './api';

export const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook', youtube: 'YouTube', spotify: 'Spotify', appleMusic: 'Apple Music', twitter: 'X / Twitter', threads: 'Threads',
};
export const PLATFORMS = Object.keys(PLATFORM_LABEL) as SocialPlatform[];
export const AUTO_PLATFORMS: SocialPlatform[] = ['instagram', 'tiktok'];   // captura automática (Apify); el resto es manual
export const ACTION_TYPES: ActionType[] = ['Lanzamiento', 'Campaña', 'Publicación', 'Colaboración', 'Prensa', 'Gira', 'Otro'];

/** Usuario de una red desde «@usuario», «usuario» o una URL. */
export function handleOf(raw: string | undefined): string {
  let s = (raw || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s) || s.includes('/')) {
    try {
      const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
      const parts = u.pathname.split('/').filter(Boolean);
      s = parts.length ? parts[parts.length - 1] : '';
    } catch { return ''; }
  }
  s = s.replace(/^@+/, '');
  return /^[A-Za-z0-9._-]{1,100}$/.test(s) ? s : '';
}

const DAY = 86400000;
export const dayDiff = (a: string, b: string) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / DAY);
export const addDays = (d: string, n: number) => new Date(Date.parse(d + 'T00:00:00Z') + n * DAY).toISOString().slice(0, 10);

export const seriesOf = (metrics: SocialMetric[], p: SocialPlatform) => metrics.filter((m) => m.platform === p).sort((a, b) => a.date.localeCompare(b.date));

export interface Latest { last: SocialMetric; prev: SocialMetric | null; delta: number | null; pct: number | null }
export function latestOf(metrics: SocialMetric[], p: SocialPlatform): Latest | null {
  const s = seriesOf(metrics, p);
  if (!s.length) return null;
  const last = s[s.length - 1], prev = s.length > 1 ? s[s.length - 2] : null;
  const delta = prev ? last.followers - prev.followers : null;
  return { last, prev, delta, pct: prev && prev.followers > 0 ? (delta! / prev.followers) * 100 : null };
}

export interface Impact {
  platform: SocialPlatform;
  before: SocialMetric | null; after: SocialMetric | null;
  delta: number | null; pct: number | null; days: number | null;
  reason?: string;   // por qué no se pudo medir
}

/**
 * Cambio de seguidores asociado a una acción en una red:
 *  - antes  = última captura en o antes de la fecha de la acción (máx. `maxGap` días antes);
 *  - después = última captura dentro de `windowDays` días posteriores a la acción (al menos 1 día después).
 */
export function impactOf(date: string, metrics: SocialMetric[], p: SocialPlatform, windowDays: number, maxGap = 30): Impact {
  const s = seriesOf(metrics, p);
  const before = [...s].reverse().find((m) => m.date <= date && dayDiff(m.date, date) <= maxGap) ?? null;
  const after = [...s].reverse().find((m) => m.date > date && dayDiff(date, m.date) <= windowDays) ?? null;
  if (!before && !after) return { platform: p, before, after, delta: null, pct: null, days: null, reason: 'Sin capturas cerca de la fecha' };
  if (!before) return { platform: p, before, after, delta: null, pct: null, days: null, reason: 'Falta una captura anterior a la acción' };
  if (!after) return { platform: p, before, after, delta: null, pct: null, days: null, reason: `Falta una captura en los ${windowDays} días posteriores` };
  const delta = after.followers - before.followers;
  return { platform: p, before, after, delta, pct: before.followers > 0 ? (delta / before.followers) * 100 : null, days: dayDiff(before.date, after.date) };
}

export interface TimelineItem { key: string; date: string; type: ActionType | 'Show'; title: string; platform?: SocialPlatform; notes?: string; fromAgenda: boolean; id?: string }

/** Acciones registradas + shows de la agenda del artista, ordenados por fecha. */
export function buildTimeline(actions: SocialAction[], shows: { id: string; name: string; date: string; status?: string }[]): TimelineItem[] {
  const a: TimelineItem[] = actions.map((x) => ({ key: 'a-' + x.id, id: x.id, date: x.date, type: x.type, title: x.title, platform: x.platform, notes: x.notes, fromAgenda: false }));
  const s: TimelineItem[] = shows.filter((e) => e.date).map((e) => ({ key: 's-' + e.id, date: e.date, type: 'Show', title: e.name, fromAgenda: true }));
  return [...a, ...s].sort((x, y) => x.date.localeCompare(y.date));
}

/** Promedio de cambio % por tipo de acción (solo con las mediciones que sí fue posible hacer). */
export function summaryByType(rows: { type: TimelineItem['type']; impacts: Impact[] }[]) {
  const acc = new Map<string, { n: number; sum: number; abs: number }>();
  for (const r of rows) for (const i of r.impacts) {
    if (i.pct === null || i.delta === null) continue;
    const k = acc.get(r.type) ?? { n: 0, sum: 0, abs: 0 };
    k.n++; k.sum += i.pct; k.abs += i.delta; acc.set(r.type, k);
  }
  return [...acc.entries()].map(([type, v]) => ({ type, n: v.n, avgPct: v.sum / v.n, avgDelta: v.abs / v.n })).sort((a, b) => b.avgPct - a.avgPct);
}

export const fmtNum = (n: number) => n.toLocaleString('es-MX');
export const fmtSigned = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + fmtNum(Math.abs(n));
export const fmtPct = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n).toFixed(1) + ' %';
export const fmtDate = (d: string) => new Date(d + 'T00:00:00Z').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
