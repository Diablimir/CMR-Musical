import { UserAccount } from '../types';

export const COLLECTION_NAMES = [
  'venues', 'artists', 'contacts', 'tours', 'events', 'contracts', 'providers', 'recording_projects',
] as const;
export type CollectionName = (typeof COLLECTION_NAMES)[number];
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
  me: () => request<{ user: UserAccount }>('/api/auth.php?action=me'),
  login: (username: string, password: string) =>
    request<{ user: UserAccount }>('/api/auth.php?action=login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request<{ ok: true }>('/api/auth.php?action=logout', { method: 'POST' }),

  loadData: () => request<ServerData>('/api/data.php'),
  saveCollection: (name: CollectionName, data: any[]) =>
    request<{ ok: true }>(`/api/data.php?c=${name}`, { method: 'PUT', body: JSON.stringify({ data }) }),

  listUsers: () => request<{ users: UserAccount[] }>('/api/users.php'),
  createUser: (u: { username: string; name: string; role: string; password: string }) =>
    request<{ id: string }>('/api/users.php', { method: 'POST', body: JSON.stringify(u) }),
  updateUser: (id: string, u: Partial<{ name: string; role: string; password: string }>) =>
    request<{ ok: true }>(`/api/users.php?id=${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(u) }),
  deleteUser: (id: string) =>
    request<{ ok: true }>(`/api/users.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
