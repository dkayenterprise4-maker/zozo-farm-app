// Optional cloud sync with Supabase (free tier works).
// Data is ALWAYS saved on the phone first. When Supabase details are entered
// in Settings and the phone is online, a full copy is pushed to the cloud and
// newer cloud records are merged back in. Photos stay on the device.
//
// One-time Supabase setup (SQL editor):
//   create table zozo_sync (id text primary key, data jsonb, updated_at timestamptz default now());
//   alter table zozo_sync enable row level security;
//   create policy "anon full access" on zozo_sync for all using (true) with check (true);
// (For real security, use Supabase Auth and restrict the policy.)

const COLLECTIONS = ['users', 'farms', 'projects', 'sales', 'expenses', 'investments', 'tasks', 'inventory', 'photos', 'visits', 'activity']

export const isSyncConfigured = (settings) => !!(settings?.supabaseUrl && settings?.supabaseKey)

// Merge two lists by id. Local wins for records present in both
// (local is the source of truth on this device); cloud-only records are added.
function mergeList(local = [], remote = [], deleted) {
  const ids = new Set(local.map((x) => x.id))
  return [...local, ...remote.filter((x) => !ids.has(x.id) && !deleted.has(x.id))].filter((x) => !deleted.has(x.id))
}

export async function syncNow(state) {
  const { supabaseUrl, supabaseKey } = state.settings
  const base = supabaseUrl.replace(/\/$/, '') + '/rest/v1/zozo_sync'
  const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' }
  const rowId = 'zozo-main'

  // 1. Pull
  const res = await fetch(`${base}?id=eq.${rowId}&select=data`, { headers })
  if (!res.ok) throw new Error(`Cloud read failed (${res.status})`)
  const rows = await res.json()
  const remote = rows[0]?.data || {}

  const deleted = new Set([...(state.deleted || []), ...(remote.deleted || [])])
  const merged = { deleted: [...deleted].slice(-5000) }
  for (const c of COLLECTIONS) merged[c] = mergeList(state[c], remote[c], deleted)
  merged.activity.sort((a, b) => b.ts.localeCompare(a.ts))

  // 2. Push
  const body = JSON.stringify({ id: rowId, data: merged, updated_at: new Date().toISOString() })
  const up = await fetch(base, { method: 'POST', headers: { ...headers, Prefer: 'resolution=merge-duplicates' }, body })
  if (!up.ok) throw new Error(`Cloud write failed (${up.status})`)
  return merged
}
