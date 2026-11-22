import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'
import { PageHeader, SearchBar, Chips, Empty, Select } from '../components/ui'
import { fmtDate, matches, timeAgo } from '../lib/utils'

const TYPES = [
  { id: 'all', label: 'All' }, { id: 'sale', label: '💰 Sales' }, { id: 'expense', label: '🧾 Expenses' }, { id: 'visit', label: '📝 Visits' },
  { id: 'photo', label: '📷 Photos' }, { id: 'task', label: '✅ Tasks' }, { id: 'inventory', label: '📦 Stock' }, { id: 'investment', label: '🏦 Capital' }, { id: 'project', label: '🌱 Projects' }
]
const ICON = { sale: '💰', expense: '🧾', visit: '📝', photo: '📷', task: '✅', inventory: '📦', investment: '🏦', project: '🌱', farm: '🚜', user: '👤' }

export default function ActivityFeed() {
  const { state, markSeen, user } = useStore()
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  const [farmId, setFarmId] = useState('')
  const [who, setWho] = useState('')
  const seen = state.seen?.[user.id] || '1970'
  useEffect(() => { const t = setTimeout(markSeen, 1500); return () => clearTimeout(t) }, []) // eslint-disable-line
  const farmName = (id) => state.farms.find((f) => f.id === id)?.name
  const list = state.activity.filter((a) => (type === 'all' || a.type === type) && (!farmId || a.farmId === farmId) && (!who || a.userId === who) && matches(q, a.text, a.userName))

  let lastDay = ''
  return (
    <div>
      <PageHeader title="Activity Feed" subtitle="Everything happening on your farms" back={false} />
      <div className="space-y-2 mb-4">
        <SearchBar value={q} onChange={setQ} placeholder="Search activity..." />
        <div className="grid grid-cols-2 gap-2">
          <Select value={farmId} onChange={setFarmId} options={state.farms.map((f) => ({ value: f.id, label: f.name }))} placeholder="All farms" />
          <Select value={who} onChange={setWho} options={state.users.map((u) => ({ value: u.id, label: u.name }))} placeholder="Everyone" />
        </div>
        <Chips options={TYPES} value={type} onChange={setType} />
      </div>
      {list.length === 0 ? <Empty icon="📭" title="No activity found" text="When you or your workers add something, it shows here." /> : (
        <div className="relative pl-6">
          <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-farm-light/30" />
          {list.slice(0, 300).map((a) => {
            const day = fmtDate(a.ts.slice(0, 10))
            const header = day !== lastDay
            lastDay = day
            return (
              <div key={a.id}>
                {header && <div className="text-xs font-bold text-gray-500 uppercase mt-4 mb-2 -ml-6 pl-6">{day === fmtDate(new Date().toISOString().slice(0, 10)) ? 'Today' : day}</div>}
                <div className="relative mb-2">
                  <span className="absolute -left-[22px] top-3 h-4 w-4 rounded-full bg-white border-2 border-farm-light" />
                  <div className={`card p-3 ${a.ts > seen && a.userId !== user.id ? 'bg-farm-pale' : ''}`}>
                    <p className="text-sm"><span className="mr-1">{ICON[a.type] || '•'}</span><b>{a.userName}</b> {a.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(a.ts)}{a.farmId ? ` · ${farmName(a.farmId) || ''}` : ''}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
