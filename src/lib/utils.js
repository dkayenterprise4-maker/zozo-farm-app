// General helpers: ids, money, dates, periods.

export const uid = (p = '') =>
  p + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100

// K 12,500.00  /  -K 1,200.00
export function money(n, { decimals = 2, sign = false } = {}) {
  const v = Number(n) || 0
  const abs = Math.abs(v).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
  const prefix = v < 0 ? '-K ' : sign && v > 0 ? '+K ' : 'K '
  return prefix + abs
}
export const moneyShort = (n) => {
  const v = Number(n) || 0
  const a = Math.abs(v)
  const s = a >= 1e6 ? (a / 1e6).toFixed(1) + 'M' : a >= 1e4 ? (a / 1e3).toFixed(1) + 'k' : a.toFixed(0)
  return (v < 0 ? '-K' : 'K') + s
}

export const pct = (n, d = 1) => (Number.isFinite(n) ? n.toFixed(d) : '0.0') + '%'

// ---- Dates (stored as ISO yyyy-mm-dd, shown DD/MM/YYYY) ----
const pad = (n) => String(n).padStart(2, '0')
export const toISO = (d) => {
  const x = d instanceof Date ? d : new Date(d)
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`
}
export const today = () => toISO(new Date())
export const parseISO = (s) => {
  if (!s) return null
  const [y, m, d] = s.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}
export function fmtDate(s) {
  if (!s) return '-'
  const d = typeof s === 'string' && s.length <= 10 ? parseISO(s) : new Date(s)
  if (!d || isNaN(d)) return '-'
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}
export function fmtDateTime(ts) {
  const d = new Date(ts)
  return `${fmtDate(d.toISOString())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
export function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return Math.floor(s / 60) + ' min ago'
  if (s < 86400) return Math.floor(s / 3600) + ' h ago'
  if (s < 86400 * 7) return Math.floor(s / 86400) + ' days ago'
  return fmtDateTime(ts).slice(0, 10)
}
export const addDays = (iso, n) => {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}
export const daysBetween = (a, b) =>
  Math.round((parseISO(b) - parseISO(a)) / 86400000)

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const monthKey = (iso) => iso.slice(0, 7)
export const monthLabel = (key) => {
  const [y, m] = key.split('-')
  return `${MONTHS[Number(m) - 1]} ${y.slice(2)}`
}

// ---- Periods ----
export const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'year', label: 'This Year' },
  { id: 'all', label: 'All Time' },
  { id: 'custom', label: 'Custom' }
]
export function periodRange(id, custom = {}) {
  const now = new Date()
  const t = toISO(now)
  switch (id) {
    case 'today':
      return { from: t, to: t, label: 'Today, ' + fmtDate(t) }
    case 'week': {
      const d = new Date(now)
      const day = (d.getDay() + 6) % 7 // Monday start
      d.setDate(d.getDate() - day)
      return { from: toISO(d), to: t, label: `This Week (${fmtDate(toISO(d))} - ${fmtDate(t)})` }
    }
    case 'month': {
      const f = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`
      return { from: f, to: t, label: `${MONTHS[now.getMonth()]} ${now.getFullYear()}` }
    }
    case 'lastmonth': {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const e = new Date(now.getFullYear(), now.getMonth(), 0)
      return { from: toISO(d), to: toISO(e), label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` }
    }
    case 'year':
      return { from: `${now.getFullYear()}-01-01`, to: t, label: `Year ${now.getFullYear()}` }
    case 'custom': {
      const from = custom.from || '2000-01-01'
      const to = custom.to || t
      return { from, to, label: `${fmtDate(from)} - ${fmtDate(to)}` }
    }
    default:
      return { from: '1900-01-01', to: '2999-12-31', label: 'All Time' }
  }
}
export const inRange = (iso, r) => iso >= r.from && iso <= r.to

export const clsx = (...a) => a.filter(Boolean).join(' ')

export const matches = (q, ...fields) => {
  if (!q) return true
  const s = q.toLowerCase()
  return fields.some((f) => String(f ?? '').toLowerCase().includes(s))
}

// Simple non-crypto hash fallback + SHA-256 when available
export async function hashPassword(pw) {
  const text = 'zozo::' + pw
  try {
    if (crypto?.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
      return 'sha:' + [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
    }
  } catch {}
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return 'djb:' + (h >>> 0).toString(16)
}
export async function checkPassword(pw, stored) {
  if (!stored) return false
  if (stored.startsWith('djb:')) {
    let h = 5381
    const text = 'zozo::' + pw
    for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
    return stored === 'djb:' + (h >>> 0).toString(16)
  }
  return (await hashPassword(pw)) === stored
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export const safeName = (s) => String(s).replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '')
