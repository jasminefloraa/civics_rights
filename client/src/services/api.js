// Thin fetch wrapper. Sends the HTTP-only auth cookie and the CSRF header on every request.
const BASE = import.meta.env.VITE_API_URL || '';
export const assetUrl = (p) => (p ? (p.startsWith('http') ? p : BASE + p) : '');
export async function api(path, { method = 'GET', body, form } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method, credentials: 'include',
      headers: { 'X-Requested-With': 'CivicSignal', ...(body && { 'Content-Type': 'application/json' }) },
      body: form || (body ? JSON.stringify(body) : undefined)
    });
  } catch { throw Object.assign(new Error('Cannot reach the server. Check your connection and try again.'), { network: true }); }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json.message || 'Something went wrong.'), { status: res.status, errors: json.errors });
  return json.data ?? {};
}
export const qs = (o) => { const p = new URLSearchParams(); Object.entries(o).forEach(([k, v]) => v !== '' && v != null && p.set(k, v)); return p.toString(); };
export const CATEGORIES = ['Roads and potholes','Garbage and sanitation','Streetlights and electricity','Water leakage','Drainage and flooding','Public property damage','Footpaths and accessibility','Other'];
export const STATUSES = ['Reported','Under Review','In Progress','Resolved','Rejected'];
export const fmt = (d) => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
