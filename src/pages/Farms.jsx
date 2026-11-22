import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, LayoutGrid, List, MapPin, FolderKanban } from 'lucide-react'
import { useStore } from '../lib/store'
import { statement } from '../lib/finance'
import { money, periodRange, matches, clsx } from '../lib/utils'
import { Empty, FarmImage, SearchBar, Chips, Stat, Badge } from '../components/ui'
import FarmForm from '../components/FarmForm'
import { FARM_TYPES } from '../lib/constants'

export default function Farms() {
  const { state, user, visibleFarms } = useStore()
  const [q, setQ] = useState('')
  const [type, setType] = useState('All')
  const [view, setView] = useState(() => localStorage.getItem('farmView') || 'grid')
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const month = periodRange('month')

  const total = useMemo(() => statement(state, { range: month }), [state])
  const list = visibleFarms.filter((f) => (type === 'All' || f.type === type) && matches(q, f.name, f.location, f.district, f.type, f.notes))
  const setV = (v) => { setView(v); localStorage.setItem('farmView', v) }
  const hour = new Date().getHours()

  return (
    <div>
      <div className="mb-4">
        <p className="text-gray-500">{hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'}, {user.name} 👋</p>
        <h1 className="text-2xl font-extrabold">My Farms</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Stat label={`Sales - ${month.label}`} value={money(total.totalSales, { decimals: 0 })} tone="light" />
        <Stat label="Expenses" value={money(total.totalExpenses, { decimals: 0 })} tone="earth" />
        <Stat label={total.net >= 0 ? 'Profit this month' : 'Loss this month'} value={money(total.net, { decimals: 0 })} tone={total.net >= 0 ? 'green' : 'red'} />
        <Stat label="Farms / Projects" value={`${state.farms.length} / ${state.projects.length}`} />
      </div>

      <div className="flex gap-2 mb-3">
        <div className="flex-1"><SearchBar value={q} onChange={setQ} placeholder="Search farms..." /></div>
        <div className="flex bg-white rounded-xl border p-1">
          <button onClick={() => setV('grid')} className={clsx('p-2 rounded-lg', view === 'grid' && 'bg-farm-pale text-farm')} aria-label="Grid view"><LayoutGrid size={20} /></button>
          <button onClick={() => setV('list')} className={clsx('p-2 rounded-lg', view === 'list' && 'bg-farm-pale text-farm')} aria-label="List view"><List size={20} /></button>
        </div>
      </div>
      <div className="mb-4"><Chips options={['All', ...FARM_TYPES.filter((t) => state.farms.some((f) => f.type === t))]} value={type} onChange={setType} /></div>

      {visibleFarms.length === 0 ? (
        <Empty icon="🚜" title="No farms yet" text="Add your first farm to start tracking sales, expenses and projects." action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={20} /> Add Farm</button>} />
      ) : list.length === 0 ? (
        <Empty icon="🔍" title="No farms match your search" text="Try a different word or filter." />
      ) : (
        <div className={view === 'grid' ? 'grid sm:grid-cols-2 gap-4' : 'space-y-3'}>
          {list.map((f) => {
            const st = statement(state, { farmId: f.id, range: month })
            const projects = state.projects.filter((p) => p.farmId === f.id)
            const active = projects.filter((p) => p.status === 'Active').length
            return view === 'grid' ? (
              <Link key={f.id} to={`/farm/${f.id}`} className="card overflow-hidden active:scale-[0.99] transition block">
                <div className="relative h-36">
                  <FarmImage farm={f} className="w-full h-36" />
                  <span className="absolute top-2 left-2"><Badge tone="green">{f.type}</Badge></span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg leading-tight">{f.name}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={14} /> {f.location}{f.district && f.district !== f.location ? `, ${f.district}` : ''} {f.size ? `· ${f.size} ${f.sizeUnit}` : ''}</p>
                  <div className="flex items-end justify-between mt-3">
                    <div>
                      <div className="text-xs text-gray-500">This month</div>
                      <div className={clsx('text-xl font-extrabold', st.net >= 0 ? 'text-farm' : 'text-red-600')}>{money(st.net, { decimals: 0 })}</div>
                    </div>
                    <div className="text-right text-sm text-gray-600 flex items-center gap-1"><FolderKanban size={16} /> {projects.length} projects ({active} active)</div>
                  </div>
                </div>
              </Link>
            ) : (
              <Link key={f.id} to={`/farm/${f.id}`} className="card p-3 flex gap-3 items-center active:scale-[0.99]">
                <FarmImage farm={f} className="w-20 h-20 rounded-xl shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{f.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{f.location} · {f.type}</p>
                  <p className="text-sm text-gray-600">{projects.length} projects</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Month</div>
                  <div className={clsx('font-extrabold', st.net >= 0 ? 'text-farm' : 'text-red-600')}>{money(st.net, { decimals: 0 })}</div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <button onClick={() => setOpen(true)} className="btn-primary w-full mt-5 text-lg"><Plus size={22} /> Add New Farm</button>
      <FarmForm open={open} onClose={() => setOpen(false)} onSaved={(id) => nav(`/farm/${id}`)} />
    </div>
  )
}
