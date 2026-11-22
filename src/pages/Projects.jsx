import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Plus, ChevronRight } from 'lucide-react'
import { useStore } from '../lib/store'
import { statement } from '../lib/finance'
import { money, fmtDate, matches, clsx } from '../lib/utils'
import { productIcons, productNames, PRODUCT_MAP, PROJECT_STATUSES } from '../lib/constants'
import { PageHeader, SearchBar, Chips, Empty, Badge } from '../components/ui'
import ProjectForm from '../components/ProjectForm'

export default function Projects() {
  const { farmId } = useParams()
  const [sp] = useSearchParams()
  const { state, isOwner, visibleFarms } = useStore()
  const farm = visibleFarms.find((f) => f.id === farmId)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('All')
  const [group, setGroup] = useState('All')
  const [open, setOpen] = useState(sp.get('new') === '1')
  const nav = useNavigate()
  if (!farm) return <Navigate to="/" replace />

  const list = state.projects
    .filter((p) => p.farmId === farmId)
    .filter((p) => (status === 'All' || p.status === status) && (group === 'All' || p.products.some((x) => PRODUCT_MAP[x]?.group === group)) && matches(q, p.name, p.field, p.notes, productNames(p.products)))
    .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))

  return (
    <div>
      <PageHeader title="Projects" subtitle={farm.name} right={isOwner && <button className="btn-primary btn-sm" onClick={() => setOpen(true)}><Plus size={18} /> New</button>} />
      <div className="space-y-2 mb-4">
        <SearchBar value={q} onChange={setQ} placeholder="Search projects..." />
        <Chips options={['All', ...PROJECT_STATUSES]} value={status} onChange={setStatus} />
        <Chips options={['All', 'Crops', 'Livestock', 'Fish Farming', 'Other']} value={group} onChange={setGroup} />
      </div>
      {list.length === 0 ? (
        <Empty icon="🌾" title={q || status !== 'All' || group !== 'All' ? 'No projects match' : 'No projects yet'} text="Projects keep each crop, animal or fish business separate so you see its own profit." action={isOwner && <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={18} /> Create Project</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {list.map((p) => {
            const st = statement(state, { projectId: p.id })
            return (
              <Link key={p.id} to={`/project/${p.id}`} className="card p-4 active:scale-[0.99]">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{productIcons(p.products)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold leading-tight">{p.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{productNames(p.products)}{p.field ? ` · ${p.field}` : ''}</div>
                  </div>
                  <Badge tone={p.status === 'Active' ? 'green' : p.status === 'Harvested' ? 'orange' : 'gray'}>{p.status}</Badge>
                </div>
                <div className="text-xs text-gray-500 mt-2">Start {fmtDate(p.startDate)} · Harvest {fmtDate(p.harvestDate)}</div>
                <div className={clsx('grid gap-2 mt-3 text-center', isOwner ? 'grid-cols-3' : 'grid-cols-2')}>
                  <div className="rounded-lg bg-earth-pale p-2"><div className="text-[11px] text-gray-500">Cost</div><div className="font-bold text-sm">{money(st.totalExpenses, { decimals: 0 })}</div></div>
                  <div className="rounded-lg bg-farm-pale p-2"><div className="text-[11px] text-gray-500">Income</div><div className="font-bold text-sm">{money(st.totalSales, { decimals: 0 })}</div></div>
                  {isOwner && <div className={clsx('rounded-lg p-2', st.net >= 0 ? 'bg-farm text-white' : 'bg-red-600 text-white')}><div className="text-[11px] opacity-80">Profit</div><div className="font-bold text-sm">{money(st.net, { decimals: 0 })}</div></div>}
                </div>
              </Link>
            )
          })}
        </div>
      )}
      <ProjectForm open={open} onClose={() => setOpen(false)} farmId={farmId} onSaved={(id) => nav(`/project/${id}`)} />
    </div>
  )
}
