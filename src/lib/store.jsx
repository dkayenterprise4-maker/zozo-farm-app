// App-wide state: data, current user, permissions, toasts, online status.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { loadState, saveState, flush, clearAll, saveImage, deleteImage } from './db'
import { buildSeed, emptyState, DATA_VERSION } from './seed'
import { uid, hashPassword, checkPassword, money, today } from './utils'
import { syncNow, isSyncConfigured } from './sync'

const Ctx = createContext(null)
const SESSION_KEY = 'zozo-session'
const TRACKED = ['users', 'farms', 'projects', 'sales', 'expenses', 'investments', 'tasks', 'inventory', 'photos', 'visits']

export function StoreProvider({ children }) {
  const [state, setState] = useState(null)
  const [userId, setUserId] = useState(() => {
    try { return localStorage.getItem(SESSION_KEY) } catch { return null }
  })
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  const [toasts, setToasts] = useState([])
  const [syncing, setSyncing] = useState(false)
  const stateRef = useRef(null)
  stateRef.current = state

  // Load (or seed) on start
  useEffect(() => {
    ;(async () => {
      let s = await loadState()
      if (!s || !s.version) s = await buildSeed()
      s = { ...emptyState(), ...s, settings: { ...emptyState().settings, ...(s.settings || {}) }, version: DATA_VERSION }
      setState(s)
    })()
  }, [])

  useEffect(() => {
    if (state) saveState(state)
  }, [state])

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  const toast = useCallback((text, tone = 'good') => {
    const id = uid()
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  // Every data change goes through here. Removed record ids are remembered
  // ("deleted") so cloud sync does not bring them back.
  const update = useCallback((fn) => setState((s) => {
    const n = fn(s)
    const gone = []
    for (const c of TRACKED) {
      if (n[c] === s[c]) continue
      const keep = new Set((n[c] || []).map((x) => x.id))
      for (const x of s[c] || []) if (!keep.has(x.id)) gone.push(x.id)
    }
    return { ...n, deleted: gone.length ? [...(s.deleted || []), ...gone].slice(-5000) : s.deleted || [], dirty: (s.dirty || 0) + 1 }
  }), [])

  const user = state?.users.find((u) => u.id === userId) || null
  const isOwner = user?.role === 'owner'

  // Auto sync when we come back online (only if cloud sync is set up)
  const doSync = useCallback(async (silent = false) => {
    const s = stateRef.current
    if (!s || !isSyncConfigured(s.settings)) {
      if (!silent) toast('Cloud sync is not set up. Data is safely saved on this device.', 'info')
      return
    }
    if (!navigator.onLine) {
      if (!silent) toast('You are offline. Will sync when internet is back.', 'info')
      return
    }
    setSyncing(true)
    try {
      const merged = await syncNow(s)
      setState((cur) => ({ ...cur, ...merged, settings: { ...cur.settings, lastSync: new Date().toISOString() }, dirty: 0 }))
      if (!silent) toast('Synced with cloud')
    } catch (e) {
      if (!silent) toast('Sync failed: ' + e.message, 'bad')
    } finally {
      setSyncing(false)
    }
  }, [toast])
  useEffect(() => {
    if (online && state && state.dirty > 0 && isSyncConfigured(state.settings)) {
      const t = setTimeout(() => doSync(true), 3000)
      return () => clearTimeout(t)
    }
  }, [online, state?.dirty, doSync]) // eslint-disable-line

  const logActivity = (s, farmId, text, type) => ({
    ...s,
    activity: [
      { id: uid('a_'), ts: new Date().toISOString(), userId: user?.id, userName: user?.name || 'Someone', farmId, text, type },
      ...s.activity
    ].slice(0, 1000)
  })
  const farmShort = (s, farmId) => {
    const f = s.farms.find((x) => x.id === farmId)
    return f ? f.name.split(' - ')[0] : 'farm'
  }

  const actions = useMemo(() => ({
    // ---- Auth ----
    async login(email, password) {
      const u = stateRef.current.users.find((x) => x.email?.toLowerCase() === email.trim().toLowerCase() || x.phone?.replace(/\s/g, '') === email.replace(/\s/g, ''))
      if (!u || !(await checkPassword(password, u.password))) throw new Error('Wrong email/phone or password')
      localStorage.setItem(SESSION_KEY, u.id)
      window.location.hash = '#/'
      setUserId(u.id)
      return u
    },
    async loginPin(id, pin) {
      const u = stateRef.current.users.find((x) => x.id === id)
      if (!u || !u.pin || !(await checkPassword('pin:' + pin, u.pin))) throw new Error('Wrong PIN')
      localStorage.setItem(SESSION_KEY, u.id)
      window.location.hash = '#/'
      setUserId(u.id)
      return u
    },
    async signup({ name, phone, email, password, role, pin }) {
      const s = stateRef.current
      if (email && s.users.some((u) => u.email?.toLowerCase() === email.toLowerCase())) throw new Error('This email is already registered')
      if (s.users.some((u) => u.phone?.replace(/\s/g, '') === phone.replace(/\s/g, ''))) throw new Error('This phone number is already registered')
      const u = {
        id: uid('u_'), name, phone, email: email || '', role, farmIds: [],
        password: await hashPassword(password), pin: pin ? await hashPassword('pin:' + pin) : null, createdAt: Date.now()
      }
      setState((st) => ({ ...st, users: [...st.users, u], activity: [{ id: uid('a_'), ts: new Date().toISOString(), userId: u.id, userName: name, farmId: null, text: `signed up as ${role}`, type: 'user' }, ...st.activity] }))
      localStorage.setItem(SESSION_KEY, u.id)
      window.location.hash = '#/'
      setUserId(u.id)
      return u
    },
    logout() {
      localStorage.removeItem(SESSION_KEY)
      setUserId(null)
    },
    async changePassword(oldPw, newPw) {
      if (!(await checkPassword(oldPw, user.password))) throw new Error('Current password is wrong')
      const h = await hashPassword(newPw)
      update((s) => ({ ...s, users: s.users.map((u) => (u.id === user.id ? { ...u, password: h } : u)) }))
    },
    async setPin(pin) {
      const h = await hashPassword('pin:' + pin)
      update((s) => ({ ...s, users: s.users.map((u) => (u.id === user.id ? { ...u, pin: h } : u)) }))
    },
    updateProfile(patch) {
      update((s) => ({ ...s, users: s.users.map((u) => (u.id === user.id ? { ...u, ...patch } : u)) }))
    },

    // ---- Workers ----
    async addWorker({ name, phone, email, jobTitle, farmIds, password, pin }) {
      const s = stateRef.current
      if (s.users.some((u) => u.phone?.replace(/\s/g, '') === phone.replace(/\s/g, ''))) throw new Error('A user with this phone already exists')
      const w = {
        id: uid('u_'), name, phone, email: email || '', jobTitle, role: 'worker', farmIds,
        password: await hashPassword(password || '123456'), pin: await hashPassword('pin:' + (pin || '1234')), createdAt: Date.now()
      }
      update((st) => logActivity({ ...st, users: [...st.users, w] }, farmIds[0] || null, `added worker ${name}`, 'user'))
      return w
    },
    updateWorker(id, patch) {
      update((s) => ({ ...s, users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }))
    },
    removeWorker(id) {
      update((s) => ({ ...s, users: s.users.filter((u) => u.id !== id), tasks: s.tasks.map((t) => (t.assignedTo === id ? { ...t, assignedTo: '' } : t)) }))
    },

    // ---- Farms ----
    addFarm(f) {
      const farm = { id: uid('f_'), createdAt: today(), ...f }
      update((s) => logActivity({ ...s, farms: [...s.farms, farm] }, farm.id, `created farm "${farm.name}"`, 'farm'))
      return farm
    },
    updateFarm(id, patch) {
      update((s) => ({ ...s, farms: s.farms.map((f) => (f.id === id ? { ...f, ...patch } : f)) }))
    },
    removeFarm(id) {
      update((s) => ({
        ...s,
        farms: s.farms.filter((f) => f.id !== id),
        projects: s.projects.filter((x) => x.farmId !== id),
        sales: s.sales.filter((x) => x.farmId !== id),
        expenses: s.expenses.filter((x) => x.farmId !== id),
        investments: s.investments.filter((x) => x.farmId !== id),
        tasks: s.tasks.filter((x) => x.farmId !== id),
        inventory: s.inventory.filter((x) => x.farmId !== id),
        photos: s.photos.filter((x) => x.farmId !== id),
        visits: s.visits.filter((x) => x.farmId !== id),
        users: s.users.map((u) => ({ ...u, farmIds: (u.farmIds || []).filter((f) => f !== id) }))
      }))
    },

    // ---- Projects ----
    addProject(p) {
      const proj = { id: uid('p_'), createdAt: today(), status: 'Active', ...p }
      update((s) => logActivity({ ...s, projects: [...s.projects, proj] }, proj.farmId, `created project "${proj.name}"`, 'project'))
      return proj
    },
    updateProject(id, patch) {
      update((s) => ({ ...s, projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))
    },
    removeProject(id) {
      update((s) => ({
        ...s,
        projects: s.projects.filter((p) => p.id !== id),
        sales: s.sales.map((x) => (x.projectId === id ? { ...x, projectId: '' } : x)),
        expenses: s.expenses.map((x) => (x.projectId === id ? { ...x, projectId: '' } : x)),
        investments: s.investments.map((x) => (x.projectId === id ? { ...x, projectId: '' } : x)),
        tasks: s.tasks.map((x) => (x.projectId === id ? { ...x, projectId: '' } : x)),
        photos: s.photos.map((x) => (x.projectId === id ? { ...x, projectId: '' } : x))
      }))
    },

    // ---- Sales ----
    addSale(x) {
      const sale = { id: uid('s_'), createdBy: user.id, createdAt: Date.now(), ...x, total: Math.round(x.qty * x.unitPrice * 100) / 100 }
      update((s) => logActivity({ ...s, sales: [sale, ...s.sales] }, sale.farmId, `recorded a sale of ${sale.qty} ${sale.unit} ${sale.item} (${money(sale.total)}) at ${farmShort(s, sale.farmId)}`, 'sale'))
      return sale
    },
    updateSale(id, x) {
      update((s) => ({ ...s, sales: s.sales.map((v) => (v.id === id ? { ...v, ...x, total: Math.round(x.qty * x.unitPrice * 100) / 100 } : v)) }))
    },
    removeSale(id) {
      update((s) => ({ ...s, sales: s.sales.filter((v) => v.id !== id) }))
    },

    // ---- Expenses (auto-update inventory stock) ----
    addExpense(x) {
      const e = { id: uid('e_'), createdBy: user.id, createdAt: Date.now(), ...x }
      update((s) => {
        let inventory = s.inventory
        if (e.inventoryItemId && Number(e.inventoryQty) > 0)
          inventory = inventory.map((i) => (i.id === e.inventoryItemId ? { ...i, qty: Math.round((Number(i.qty) + Number(e.inventoryQty)) * 100) / 100 } : i))
        return logActivity({ ...s, expenses: [e, ...s.expenses], inventory }, e.farmId, `added ${money(e.amount)} ${e.category} expense to ${farmShort(s, e.farmId)}`, 'expense')
      })
      return e
    },
    updateExpense(id, x) {
      update((s) => {
        const old = s.expenses.find((v) => v.id === id)
        let inventory = s.inventory
        if (old?.inventoryItemId) inventory = inventory.map((i) => (i.id === old.inventoryItemId ? { ...i, qty: Math.max(0, Number(i.qty) - Number(old.inventoryQty || 0)) } : i))
        if (x.inventoryItemId && Number(x.inventoryQty) > 0) inventory = inventory.map((i) => (i.id === x.inventoryItemId ? { ...i, qty: Number(i.qty) + Number(x.inventoryQty) } : i))
        return { ...s, inventory, expenses: s.expenses.map((v) => (v.id === id ? { ...v, ...x } : v)) }
      })
    },
    removeExpense(id) {
      update((s) => {
        const old = s.expenses.find((v) => v.id === id)
        let inventory = s.inventory
        if (old?.inventoryItemId) inventory = inventory.map((i) => (i.id === old.inventoryItemId ? { ...i, qty: Math.max(0, Number(i.qty) - Number(old.inventoryQty || 0)) } : i))
        return { ...s, inventory, expenses: s.expenses.filter((v) => v.id !== id) }
      })
    },

    // ---- Investments ----
    addInvestment(x) {
      const inv = { id: uid('i_'), createdBy: user.id, ...x }
      update((s) => logActivity({ ...s, investments: [inv, ...s.investments] }, inv.farmId, `injected capital of ${money(inv.amount)} (${inv.source}) into ${farmShort(s, inv.farmId)}`, 'investment'))
    },
    updateInvestment(id, x) {
      update((s) => ({ ...s, investments: s.investments.map((v) => (v.id === id ? { ...v, ...x } : v)) }))
    },
    removeInvestment(id) {
      update((s) => ({ ...s, investments: s.investments.filter((v) => v.id !== id) }))
    },

    // ---- Tasks ----
    addTask(t) {
      const task = { id: uid('t_'), done: false, createdBy: user.id, createdAt: Date.now(), ...t }
      update((s) => logActivity({ ...s, tasks: [...s.tasks, task] }, task.farmId, `created task "${task.title}"`, 'task'))
      return task
    },
    updateTask(id, patch) {
      update((s) => {
        const t = s.tasks.find((x) => x.id === id)
        let ns = { ...s, tasks: s.tasks.map((x) => (x.id === id ? { ...x, ...patch } : x)) }
        if (patch.done === true && t && !t.done) ns = logActivity(ns, t.farmId, `completed task "${t.title}"`, 'task')
        return ns
      })
    },
    removeTask(id) {
      update((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }))
    },

    // ---- Inventory ----
    addItem(i) {
      const item = { id: uid('inv_'), ...i }
      update((s) => logActivity({ ...s, inventory: [...s.inventory, item] }, item.farmId, `added stock item "${item.name}"`, 'inventory'))
    },
    updateItem(id, patch) {
      update((s) => ({ ...s, inventory: s.inventory.map((i) => (i.id === id ? { ...i, ...patch } : i)) }))
    },
    adjustStock(id, delta, reason) {
      update((s) => {
        const it = s.inventory.find((i) => i.id === id)
        const ns = { ...s, inventory: s.inventory.map((i) => (i.id === id ? { ...i, qty: Math.max(0, Math.round((Number(i.qty) + delta) * 100) / 100) } : i)) }
        return logActivity(ns, it?.farmId, `${delta < 0 ? 'used' : 'added'} ${Math.abs(delta)} ${it?.unit} of ${it?.name}${reason ? ' - ' + reason : ''}`, 'inventory')
      })
    },
    removeItem(id) {
      update((s) => ({ ...s, inventory: s.inventory.filter((i) => i.id !== id) }))
    },

    // ---- Photos ----
    async addPhoto({ dataUrl, ...meta }) {
      const id = uid('ph_')
      await saveImage(id, dataUrl)
      const photo = { id, date: today(), createdBy: user.id, createdAt: Date.now(), ...meta }
      update((s) => logActivity({ ...s, photos: [photo, ...s.photos] }, photo.farmId, `added a ${photo.kind} photo${photo.caption ? ': "' + photo.caption + '"' : ''}`, 'photo'))
      return photo
    },
    updatePhoto(id, patch) {
      update((s) => ({ ...s, photos: s.photos.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))
    },
    async removePhoto(id) {
      await deleteImage(id)
      update((s) => ({ ...s, photos: s.photos.filter((p) => p.id !== id) }))
    },
    // Store an image without a gallery entry (e.g. farm cover)
    async storeImage(dataUrl) {
      const id = uid('img_')
      await saveImage(id, dataUrl)
      return id
    },

    // ---- Visits ----
    addVisit(v) {
      const visit = { id: uid('v_'), createdBy: user.id, createdAt: Date.now(), ...v }
      update((s) => logActivity({ ...s, visits: [visit, ...s.visits] }, visit.farmId, `visited ${s.farms.find((f) => f.id === visit.farmId)?.name || 'a farm'}`, 'visit'))
    },
    removeVisit(id) {
      update((s) => ({ ...s, visits: s.visits.filter((v) => v.id !== id) }))
    },

    // ---- Misc ----
    setSettings(patch) {
      setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
    },
    setWeather(farmId, data) {
      setState((s) => ({ ...s, weather: { ...s.weather, [farmId]: data } }))
    },
    setChat(key, messages) {
      setState((s) => ({ ...s, chats: { ...s.chats, [key]: messages.slice(-60) } }))
    },
    markSeen() {
      setState((s) => ({ ...s, seen: { ...s.seen, [user.id]: new Date().toISOString() } }))
    },
    replaceAll(newState) {
      setState({ ...emptyState(), ...newState, version: DATA_VERSION })
    },
    async resetDemo() {
      await clearAll()
      const s = await buildSeed()
      setState(s)
      await flush()
    },
    async deleteAll() {
      await clearAll()
      const s = emptyState()
      // Keep the current user so they are not locked out
      if (user) s.users = [{ ...user, farmIds: [] }]
      setState(s)
      await flush()
    },
    sync: doSync
  }), [user, update, doSync]) // eslint-disable-line

  // ---- Permissions & scoping ----
  const visibleFarms = useMemo(() => {
    if (!state || !user) return []
    return isOwner ? state.farms : state.farms.filter((f) => (user.farmIds || []).includes(f.id))
  }, [state, user, isOwner])

  const can = useCallback((action) => {
    if (!user) return false
    if (isOwner) return true
    return ['add', 'addSale', 'addExpense', 'addPhoto', 'addVisit', 'completeTask'].includes(action)
  }, [user, isOwner])

  const value = { state, user, isOwner, online, syncing, toasts, toast, visibleFarms, can, ...actions }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)
