import { UserAccount } from '../types';

export const COLLECTION_NAMES = [
  'venues', 'artists', 'contacts', 'tours', 'events', 'contracts', 'providers', 'recording_projects',
] as const;
export type CollectionName = (typeof COLLECTION_NAMES)[number];
export interface SyncResult { ok: true; versions?: Record<string, Record<string, number>>; dirty?: string[]; }
export type ServerData = Record<CollectionName, any[]>;

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    credentials: 'same-origin',
    ...init,
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'flamo', ...(init.headers || {}) },
  });
  let payload: any = null;
  try { payload = await res.json(); } catch { /* respuesta vacía */ }
  if (!res.ok) {
    const err: any = new Error(payload?.error || `Error ${res.status}`);
    err.status = res.status;
    err.code = payload?.code;
    throw err;
  }
  return payload as T;
}

export const integrations = {
  apifyScrape: (platform: string, handle: string) =>
    request<any>('/api/apify.php?action=scrape', { method: 'POST', body: JSON.stringify({ platform, handle }) }),
  placesScrape: (query: string) =>
    request<any>('/api/places.php', { method: 'POST', body: JSON.stringify({ query }) }),
  calendarEvent: (payload: any) =>
    request<any>('/api/calendar.php?action=sync-event', { method: 'POST', body: JSON.stringify(payload) }),
  calendarAll: (events: any[]) =>
    request<any>('/api/calendar.php?action=sync-all', { method: 'POST', body: JSON.stringify({ events }) }),
};

// ───────── Historial de redes sociales y acciones del artista ─────────
export type SocialPlatform = 'instagram' | 'tiktok' | 'facebook' | 'youtube' | 'spotify' | 'appleMusic' | 'twitter' | 'threads';
export interface SocialMetric { platform: SocialPlatform; date: string; followers: number; following: number | null; posts: number | null; engagement: number | null; source: 'manual' | 'apify' | 'meta'; capturedAt: string }
export type ActionType = 'Lanzamiento' | 'Campaña' | 'Publicación' | 'Colaboración' | 'Prensa' | 'Gira' | 'Otro';
export interface SocialAction { id: string; date: string; type: ActionType; title: string; notes?: string; platform?: SocialPlatform }
export interface SocialData { metrics: SocialMetric[]; actions: SocialAction[] }
const post = <T,>(action: string, body: object) => request<T>(`/api/social.php?action=${action}`, { method: 'POST', body: JSON.stringify(body) });
export const social = {
  get: (artistId: string) => request<SocialData>(`/api/social.php?artist_id=${encodeURIComponent(artistId)}`),
  addMetric: (artistId: string, m: { platform: SocialPlatform; date: string; followers: number; following?: number | null; posts?: number | null; engagement?: number | null }) =>
    post<SocialData & { ok: true }>('metric', { artistId, ...m }),
  fetchLive: (artistId: string, platform: SocialPlatform, handle?: string) =>
    post<SocialData & { ok: true; handle: string }>('fetch', { artistId, platform, handle }),
  /** Actualiza automáticamente lo que aún no tiene captura de hoy (se llama al abrir la pantalla del artista). */
  refresh: (artistId: string, force = false) =>
    post<SocialData & { ok: true; refreshed: SocialPlatform[]; skipped: SocialPlatform[]; errors: Partial<Record<SocialPlatform, string>> }>('refresh', { artistId, force }),
  deleteMetric: (artistId: string, platform: SocialPlatform, date: string) => post<SocialData>('metric_delete', { artistId, platform, date }),
  saveAction: (artistId: string, a: Partial<SocialAction> & { date: string; type: ActionType; title: string }) => post<SocialData>('action_save', { artistId, ...a }),
  deleteAction: (artistId: string, id: string) => post<SocialData>('action_delete', { artistId, id }),
};

// ───────── Cuenta oficial de Instagram (API de Meta) ─────────
export interface MetaConnection { connected: true; username: string | null; expiresAt: string | null; lastSync: string | null; lastError: string | null }
export interface MetaPost { id: string; date: string | null; type: string; url: string | null; text: string | null; likes: number | null; comments: number | null; reach: number | null; saves: number | null; shares: number | null; interactions: number | null; engagement: number | null }
export interface MetaDemographics { date: string | null; edad: { key: string; value: number }[]; genero: { key: string; value: number }[]; ciudad: { key: string; value: number }[]; pais: { key: string; value: number }[] }
export interface MetaData { connection: MetaConnection | null; reach: { date: string; reach: number }[]; demographics: MetaDemographics; posts: MetaPost[] }
export const meta = {
  status: () => request<{ configured: boolean; missing: string[]; redirectUri: string }>('/api/meta.php?action=status'),
  get: (artistId: string) => request<MetaData>(`/api/meta.php?artist_id=${encodeURIComponent(artistId)}`),
  start: (artistId: string) => request<{ url: string }>('/api/meta.php?action=start', { method: 'POST', body: JSON.stringify({ artistId }) }),
  sync: (artistId: string) => request<{ ok: true; avisos: string[]; data: MetaData }>('/api/meta.php?action=sync', { method: 'POST', body: JSON.stringify({ artistId }) }),
  disconnect: (artistId: string) => request<{ ok: true; data: MetaData }>('/api/meta.php?action=disconnect', { method: 'POST', body: JSON.stringify({ artistId }) }),
};

export async function uploadImage(file: Blob, filename = 'foto.jpg'): Promise<string> {
  const form = new FormData();
  form.append('file', file, filename);
  // Sin Content-Type: el navegador añade el boundary del multipart.
  const res = await fetch('/api/upload.php', {
    method: 'POST', body: form, credentials: 'same-origin', headers: { 'X-Requested-With': 'flamo' },
  });
  let payload: any = null;
  try { payload = await res.json(); } catch { /* vacío */ }
  if (!res.ok) throw new Error(payload?.error || `No se pudo subir la imagen (${res.status}).`);
  return payload.url as string;
}

export const api = {
  me: () => request<{ user: UserAccount | null }>('/api/auth.php?action=me'),
  login: (username: string, password: string) =>
    request<{ user: UserAccount }>('/api/auth.php?action=login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request<{ ok: true }>('/api/auth.php?action=logout', { method: 'POST' }),

  loadData: () => request<ServerData>('/api/data.php'),
  // Envía solo los registros que cambiaron: { coleccion: { upserts: [...], deletes: [ids] } }
  sync: (changes: Record<string, { upserts: any[]; deletes: string[] }>) =>
    request<SyncResult>('/api/data.php?action=sync', { method: 'POST', body: JSON.stringify({ changes }) }),

  listUsers: () => request<{ users: UserAccount[] }>('/api/users.php'),
  createUser: (u: { username: string; name: string; role: string; password: string }) =>
    request<{ id: string }>('/api/users.php', { method: 'POST', body: JSON.stringify(u) }),
  updateUser: (id: string, u: Partial<{ name: string; role: string; password: string }>) =>
    request<{ ok: true }>(`/api/users.php?id=${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(u) }),
  deleteUser: (id: string) =>
    request<{ ok: true }>(`/api/users.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
