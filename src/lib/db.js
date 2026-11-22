// Offline-first persistence.
// Main data lives in IndexedDB (via idb-keyval). A copy is also kept in
// LocalStorage as a backup when it fits. Photos are stored separately in
// IndexedDB under "img:<id>" so the main data stays small and fast.
import { get, set, del, keys, createStore } from 'idb-keyval'

const store = createStore('zozo-farm-db', 'kv')
const STATE_KEY = 'zozo-state-v1'
const LS_KEY = 'zozo-state-backup-v1'

export async function loadState() {
  try {
    const s = await get(STATE_KEY, store)
    if (s) return s
  } catch (e) {
    console.warn('IndexedDB read failed, trying LocalStorage', e)
  }
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

let timer = null
let pending = null
export function saveState(state) {
  pending = state
  clearTimeout(timer)
  timer = setTimeout(flush, 250)
}
export async function flush() {
  if (!pending) return
  const s = pending
  pending = null
  try {
    await set(STATE_KEY, s, store)
  } catch (e) {
    console.warn('IndexedDB write failed', e)
  }
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s))
  } catch {
    // LocalStorage full (5MB limit) - IndexedDB copy is the main one.
  }
}
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flush)
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush())
}

// ---- Images ----
const imgCache = new Map()
export async function saveImage(id, dataUrl) {
  imgCache.set(id, dataUrl)
  await set('img:' + id, dataUrl, store)
}
export async function getImage(id) {
  if (!id) return null
  if (imgCache.has(id)) return imgCache.get(id)
  const v = await get('img:' + id, store)
  if (v) imgCache.set(id, v)
  return v || null
}
export async function deleteImage(id) {
  imgCache.delete(id)
  await del('img:' + id, store)
}
export async function allImages() {
  const out = {}
  const ks = (await keys(store)).filter((k) => String(k).startsWith('img:'))
  for (const k of ks) out[String(k).slice(4)] = await get(k, store)
  return out
}
export async function clearAll() {
  const ks = await keys(store)
  for (const k of ks) await del(k, store)
  imgCache.clear()
  try {
    localStorage.removeItem(LS_KEY)
  } catch {}
}

// Resize a picked/captured photo to keep storage small (max 1024px, JPEG).
export function compressImage(file, max = 1024, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * scale)
        c.height = Math.round(img.height * scale)
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
