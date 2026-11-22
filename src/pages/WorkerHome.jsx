import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Receipt, ShoppingCart, Camera, ListChecks, ClipboardList, MapPin, Check } from 'lucide-react'
import { useStore } from '../lib/store'
import { Empty, FarmImage, Chips } from '../components/ui'
import { fmtDate, today, clsx, timeAgo, money } from '../lib/utils'

export default function WorkerHome() {
  const { state, user, visibleFarms, updateTask, toast } = useStore()
  const [farmId, setFarmId] = useState(visibleFarms[0]?.id || '')
  const farm = visibleFarms.find((f) => f.id === farmId)
  const t0 = today()
  const myTasks = state.tasks.filter((t) => t.assignedTo === user.id && !t.done).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const mine = state.activity.filter((a) => a.userId === user.id).slice(0, 5)

  if (!visibleFarms.length) return <Empty icon="⏳" title={`Welcome, ${user.name}!`} text="You are not assigned to a farm yet. Ask the owner to assign you in the Workers page." />
  const q = `farm=${farmId}`
  const big = [
    { to: `/add/expense?${q}`, label: 'Add Expense', icon: Receipt, cls: 'bg-earth' },
    { to: `/add/sale?${q}`, label: 'Add Sale', icon: ShoppingCart, cls: 'bg-farm-light' },
    { to: `/gallery?${q}&add=1`, label: 'Add Photo / Note', icon: Camera, cls: 'bg-farm' },
    { to: '/tasks', label: `My Tasks (${myTasks.length})`, icon: ListChecks, cls: 'bg-amber-600' }
  ]

  return (
    <div>
      <p className="text-gray-500">Hello, {user.name} 👋</p>
      <h1 className="text-2xl font-extrabold mb-3">What do you want to record?</h1>
      {visibleFarms.length > 1 && <div className="mb-3"><Chips options={visibleFarms.map((f) => ({ id: f.id, label: f.name.split(' - ')[0] }))} value={farmId} onChange={setFarmId} /></div>}
      {farm && (
        <Link to={`/farm/${farm.id}`} className="card overflow-hidden flex items-center gap-3 mb-4">
          <FarmImage farm={farm} className="h-20 w-24" />
          <div><div className="font-bold">{farm.name}</div><div className="text-sm text-gray-500 flex items-center gap-1"><MapPin size={14} />{farm.location}</div><div className="text-xs text-farm font-semibold">Open farm →</div></div>
        </Link>
      )}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {big.map((b) => (
          <Link key={b.label} to={b.to} className={clsx('rounded-3xl text-white p-4 min-h-[130px] flex flex-col justify-between shadow-md active:scale-95', b.cls)}>
            <b.icon size={36} />
            <span className="text-lg font-bold leading-tight">{b.label}</span>
          </Link>
        ))}
      </div>
      <Link to={`/visits?${q}`} className="btn-outline w-full mb-6"><ClipboardList size={20} /> Log a Farm Visit</Link>

      <h2 className="section-title mb-2">My Tasks</h2>
      {myTasks.length === 0 ? <p className="card p-4 text-gray-500 mb-6">No tasks for you right now 🎉</p> : (
        <div className="space-y-2 mb-6">
          {myTasks.slice(0, 5).map((t) => (
            <div key={t.id} className={clsx('card p-3 flex items-center gap-3 border-l-4', t.dueDate < t0 ? 'border-l-red-500 bg-red-50' : 'border-l-farm-light')}>
              <button onClick={() => { updateTask(t.id, { done: true }); toast('Task done ✅') }} className="h-9 w-9 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center" aria-label="Mark done"><Check size={16} className="text-gray-300" /></button>
              <div className="flex-1"><div className="font-bold">{t.title}</div><div className={clsx('text-xs', t.dueDate < t0 ? 'text-red-600 font-bold' : 'text-gray-500')}>{t.dueDate < t0 ? 'OVERDUE · ' : ''}{fmtDate(t.dueDate)}</div></div>
            </div>
          ))}
        </div>
      )}

      <h2 className="section-title mb-2">What I added recently</h2>
      {mine.length === 0 ? <p className="card p-4 text-gray-500">Nothing yet. Use the big buttons above.</p> : (
        <div className="card p-3">{mine.map((a) => <p key={a.id} className="text-sm py-1.5 border-b last:border-0">You {a.text} <span className="text-gray-400">· {timeAgo(a.ts)}</span></p>)}</div>
      )}
    </div>
  )
}
