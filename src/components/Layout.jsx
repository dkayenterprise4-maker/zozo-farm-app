import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Home, ListChecks, BarChart3, Activity, Menu, Bell, WifiOff, MessageCircle, Users, Package, Images, Settings, ClipboardList, CloudUpload, LogOut, Clock, CalendarClock } from 'lucide-react'
import { useStore } from '../lib/store'
import { Logo, Modal } from './ui'
import { clsx, fmtDate, timeAgo, today } from '../lib/utils'

export function useNotifications() {
  const { state, user, isOwner, visibleFarms } = useStore()
  return useMemo(() => {
    if (!state || !user) return { items: [], unread: 0 }
    const t = today()
    const farmIds = new Set(visibleFarms.map((f) => f.id))
    const items = []
    for (const task of state.tasks) {
      if (task.done || !farmIds.has(task.farmId)) continue
      if (!isOwner && task.assignedTo !== user.id) continue
      if (task.dueDate < t) items.push({ id: 'o' + task.id, tone: 'red', icon: Clock, text: `Overdue: ${task.title}`, sub: `Was due ${fmtDate(task.dueDate)}`, to: '/tasks', alert: true })
      else if (task.dueDate === t) items.push({ id: 'd' + task.id, tone: 'orange', icon: CalendarClock, text: `Due today: ${task.title}`, to: '/tasks', alert: true })
    }
    for (const i of state.inventory) {
      if (farmIds.has(i.farmId) && Number(i.qty) <= Number(i.lowStock))
        items.push({ id: 'i' + i.id, tone: 'orange', icon: Package, text: `Low stock: ${i.name}`, sub: `${i.qty} ${i.unit} left`, to: '/inventory', alert: true })
    }
    const seen = state.seen?.[user.id] || '1970'
    const fresh = state.activity.filter((a) => a.userId !== user.id && a.ts > seen && (!a.farmId || farmIds.has(a.farmId))).slice(0, 15)
    for (const a of fresh) items.push({ id: 'a' + a.id, tone: 'green', icon: Bell, text: `${a.userName} ${a.text}`, sub: timeAgo(a.ts), to: '/activity', isNew: true })
    return { items, unread: items.filter((i) => i.alert).length + fresh.length }
  }, [state, user, isOwner, visibleFarms])
}

const ownerNav = [
  { to: '/', label: 'My Farms', icon: Home, end: true },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/statement', label: 'Reports', icon: BarChart3 },
  { to: '/activity', label: 'Activity', icon: Activity },
  { to: '/more', label: 'More', icon: Menu }
]
const workerNav = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/tasks', label: 'My Tasks', icon: ListChecks },
  { to: '/gallery', label: 'Photos', icon: Images },
  { to: '/visits', label: 'Visits', icon: ClipboardList },
  { to: '/settings', label: 'Me', icon: Settings }
]
export const moreLinks = [
  { to: '/workers', label: 'Workers', icon: Users, desc: 'Add workers & assign farms' },
  { to: '/inventory', label: 'Inventory / Stock', icon: Package, desc: 'Feed, fertilizer, chemicals' },
  { to: '/gallery', label: 'Photo Gallery', icon: Images, desc: 'Farm, receipts, problems' },
  { to: '/visits', label: 'Visit Log', icon: ClipboardList, desc: 'Who visited & what to fix' },
  { to: '/assistant', label: 'Zozo Assistant', icon: MessageCircle, desc: 'Questions about your farms' },
  { to: '/settings', label: 'Settings', icon: Settings, desc: 'Profile, password, backup' }
]

export default function Layout() {
  const { user, isOwner, online, toasts, markSeen, logout, state, syncing } = useStore()
  const { items, unread } = useNotifications()
  const [bell, setBell] = useState(false)
  const loc = useLocation()
  const nav = useNavigate()
  const nav_ = isOwner ? ownerNav : workerNav
  const farmMatch = loc.pathname.match(/\/farm\/([^/]+)/)
  const ctxFarm = farmMatch?.[1] || new URLSearchParams(loc.search).get('farm') || ''

  // System notification (if allowed) when new alerts appear
  const lastCount = useRef(null)
  useEffect(() => {
    const alerts = items.filter((i) => i.alert).length
    if (lastCount.current !== null && alerts > lastCount.current && state?.settings.notifyEnabled && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Zozo Farm App', { body: items.find((i) => i.alert)?.text, icon: 'icon-192.png' })
      } catch {}
    }
    lastCount.current = alerts
  }, [items, state?.settings.notifyEnabled])

  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-farm text-white p-4">
        <div className="flex items-center gap-3 mb-8">
          <Logo size={44} />
          <div>
            <div className="font-bold text-lg leading-tight">Zozo Farm App</div>
            <div className="text-xs text-white/70">Farm records</div>
          </div>
        </div>
        <nav className="space-y-1 flex-1">
          {[...nav_, ...(isOwner ? moreLinks : [])].filter((n) => n.to !== '/more').map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => clsx('flex items-center gap-3 rounded-md px-3 py-2.5 font-medium', isActive ? 'bg-white text-farm' : 'hover:bg-white/10')}>
              <n.icon size={20} /> {n.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={logout} className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-white/10"><LogOut size={20} /> Log out</button>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white text-gray-900 border-b border-stone-200 lg:bg-page lg:border-0">
        <div className="max-w-5xl mx-auto flex items-center gap-2 px-4 h-14">
          <button onClick={() => nav('/')} className="flex items-center gap-2 lg:hidden">
            <Logo size={32} />
            <span className="font-bold text-farm text-lg">Zozo Farm</span>
          </button>
          <div className="flex-1" />
          {!online && (
            <span className="flex items-center gap-1 rounded-md bg-amber-100 text-amber-900 border border-amber-300 px-2 py-1 text-xs font-semibold" title="No internet. Everything is saved on this device.">
              <WifiOff size={14} /> Offline
            </span>
          )}
          {online && state?.dirty > 0 && state?.settings.supabaseUrl && (
            <span className="flex items-center gap-1 text-xs opacity-80" title="Changes waiting to sync"><CloudUpload size={14} className={syncing ? 'animate-pulse' : ''} /> {syncing ? 'Syncing' : 'Pending'}</span>
          )}
          <button onClick={() => setBell(true)} className="relative h-10 w-10 rounded-full flex items-center justify-center hover:bg-black/5" aria-label="Notifications">
            <Bell size={22} />
            {unread > 0 && <span className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center px-1">{unread > 9 ? '9+' : unread}</span>}
          </button>
          <button onClick={() => nav('/settings')} className="h-9 w-9 rounded-full bg-farm text-white font-bold flex items-center justify-center" aria-label="Profile">
            {user?.name?.[0]?.toUpperCase()}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-4 pb-32 lg:pb-12">
        <Outlet />
      </main>

      {/* Floating AI button */}
      {!loc.pathname.startsWith('/assistant') && (
        <button
          onClick={() => nav('/assistant', { state: { farmId: ctxFarm } })}
          className="fixed z-30 right-4 bottom-24 lg:bottom-8 flex items-center gap-2 rounded-full bg-farm text-white shadow-md pl-3.5 pr-4 h-12 border border-white/20"
          aria-label="Open Zozo Assistant"
        >
          <MessageCircle size={20} />
          <span className="text-sm font-semibold hidden sm:inline">Ask Zozo Assistant</span>
          <span className="text-sm font-semibold sm:hidden">Ask</span>
        </button>
      )}

      {/* Bottom nav (mobile) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200 safe-bottom">
        <div className="grid grid-cols-5">
          {nav_.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => clsx('flex flex-col items-center justify-center h-16 text-[11px] font-semibold gap-0.5', isActive ? 'text-farm' : 'text-gray-500')}>
              {({ isActive }) => (
                <>
                  <span className={clsx('h-[3px] w-8 rounded-b mb-1.5 -mt-2', isActive ? 'bg-farm' : 'bg-transparent')} /><n.icon size={22} strokeWidth={isActive ? 2.25 : 1.75} />
                  {n.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <Modal open={bell} onClose={() => { setBell(false); markSeen() }} title="Notifications">
        {items.length === 0 ? (
          <p className="text-center text-gray-500 py-8">You're all caught up.</p>
        ) : (
          <div className="space-y-2">
            {items.map((i) => (
              <button key={i.id} onClick={() => { setBell(false); markSeen(); nav(i.to) }} className={clsx('w-full text-left card p-3 flex gap-3 items-start border-l-4', i.tone === 'red' ? 'border-l-red-500' : i.tone === 'orange' ? 'border-l-orange-400' : 'border-l-farm-light')}>
                <i.icon size={20} className="shrink-0 text-stone-500 mt-0.5" />
                <span className="flex-1">
                  <span className="block font-medium">{i.text}</span>
                  {i.sub && <span className="block text-xs text-gray-500">{i.sub}</span>}
                </span>
              </button>
            ))}
          </div>
        )}
      </Modal>

      {/* Toasts */}
      <div className="fixed z-[70] top-16 inset-x-0 flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className={clsx('animate-pop rounded-xl px-4 py-3 shadow-lg text-white font-medium max-w-md w-full', t.tone === 'bad' ? 'bg-red-600' : t.tone === 'info' ? 'bg-gray-800' : 'bg-farm')}>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  )
}
