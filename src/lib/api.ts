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
