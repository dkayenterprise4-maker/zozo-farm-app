import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Pencil, Trash2, MapPin, ShoppingCart, Receipt, Landmark, Camera, FolderKanban, FileBarChart, ListChecks, Package, Images, ClipboardList, TrendingUp, Trophy, ChevronRight, Ruler } from 'lucide-react'
import { useStore } from '../lib/store'
import { statement, projection, bestProject, insights } from '../lib/finance'
import { money, periodRange, pct, clsx, timeAgo, fmtDate, today } from '../lib/utils'
import { productIcons } from '../lib/constants'
import { FarmImage, PeriodFilter, Stat, useConfirm, Badge, Empty } from '../components/ui'
import { IncomeExpenseChart, ProfitTrendChart } from '../components/Charts'
import FarmForm from '../components/FarmForm'
import Weather from '../components/Weather'

export default function FarmDashboard() {
  const { farmId } = useParams()
  const { state, isOwner, visibleFarms, removeFarm, toast } = useStore()
  const farm = visibleFarms.find((f) => f.id === farmId)
  const [period, setPeriod] = useState('month')
  const [custom, setCustom] = useState({})
  const [edit, setEdit] = useState(false)
  const confirm = useConfirm()
  const nav = useNavigate()
  const range = periodRange(period, custom)

  const st = useMemo(() => (farm ? statement(state, { farmId, range }) : null), [state, farmId, range.from, range.to]) // eslint-disable-line
  const trend = useMemo(() => {
    if (!farm) return []
    const all = statement(state, { farmId }).monthly.slice(-6)
    const p = projection(state, { farmId })
    const data = all.map((m) => ({ month: m.month, profit: m.profit }))
    if (data.length) data[data.length - 1].projected = data[data.length - 1].profit
    for (let i = 0; i < 2; i++) data.push({ month: p.forward[i].month, projected: p.avgMonthly })
    return data
  }, [state, farmId]) // eslint-disable-line
  if (!farm) return <Navigate to="/" replace />

  const proj = projection(state, { farmId })
  const best = bestProject(state, farmId, range)
  const ins = insights(state, { farmId, range })
  const projects = state.projects.filter((p) => p.farmId === farmId)
  const tasks = state.tasks.filter((t) => t.farmId === farmId && !t.done).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const recent = state.activity.filter((a) => a.farmId === farmId).slice(0, 5)
  const lowStock = state.inventory.filter((i) => i.farmId === farmId && Number(i.qty) <= Number(i.lowStock))
  const q = `farm=${farmId}`

  const del = async () => {
    if (await confirm({ title: 'Delete farm?', message: `This will permanently delete "${farm.name}" and ALL its projects, sales, expenses, tasks, stock and photos.\n\nThis cannot be undone.` })) {
      removeFarm(farmId)
      toast('Farm deleted')
      nav('/')
    }
  }

  const actions = [
    { to: `/add/sale?${q}`, label: 'Add Sale', icon: ShoppingCart, cls: 'bg-farm-light text-white' },
    { to: `/add/expense?${q}`, label: 'Add Expense', icon: Receipt, cls: 'bg-earth text-white' },
    ...(isOwner ? [{ to: `/add/investment?${q}`, label: 'Add Capital', icon: Landmark, cls: 'bg-farm text-white' }] : []),
    { to: `/gallery?${q}&add=1`, label: 'Photo / Note', icon: Camera, cls: 'bg-white text-farm border-2 border-farm' }
  ]
  const menu = [
    { to: `/farm/${farmId}/projects`, label: 'Projects', icon: FolderKanban, count: projects.length },
    { to: `/farm/${farmId}/money/sales`, label: 'Sales', icon: ShoppingCart },
    { to: `/farm/${farmId}/money/expenses`, label: 'Expenses', icon: Receipt },
    ...(isOwner ? [{ to: `/farm/${farmId}/money/investments`, label: 'Capital', icon: Landmark }, { to: `/statement?${q}`, label: 'Statement', icon: FileBarChart }] : []),
    { to: `/tasks?${q}`, label: 'Tasks', icon: ListChecks, count: tasks.length },
    { to: `/inventory?${q}`, label: 'Stock', icon: Package, alert: lowStock.length },
    { to: `/gallery?${q}`, label: 'Photos', icon: Images },
    { to: `/visits?${q}`, label: 'Visits', icon: ClipboardList }
  ]

  return (
    <div>
      {/* Banner */}
      <div className="relative -mx-4 -mt-4 mb-4 h-44 sm:h-56 sm:mx-0 sm:rounded-2xl overflow-hidden">
        <FarmImage farm={farm} className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <button onClick={() => nav('/')} className="absolute top-3 left-3 rounded-full bg-black/40 text-white px-3 py-1.5 text-sm font-semibold">← My Farms</button>
        {isOwner && (
          <div className="absolute top-3 right-3 flex gap-2">
            <button onClick={() => setEdit(true)} className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center" aria-label="Edit farm"><Pencil size={18} /></button>
            <button onClick={del} className="h-10 w-10 rounded-full bg-white/90 text-red-600 flex items-center justify-center" aria-label="Delete farm"><Trash2 size={18} /></button>
          </div>
        )}
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <Badge tone="green">{farm.type}</Badge>
          <h1 className="text-2xl font-extrabold leading-tight mt-1">{farm.name}</h1>
          <p className="text-sm opacity-90 flex items-center gap-3"><span className="flex items-center gap-1"><MapPin size={14} />{farm.location}{farm.district ? `, ${farm.district}` : ''}</span>{farm.size ? <span className="flex items-center gap-1"><Ruler size={14} />{farm.size} {farm.sizeUnit}</span> : null}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className={clsx('grid gap-2 mb-5', actions.length === 4 ? 'grid-cols-4' : 'grid-cols-3')}>
        {actions.map((a) => (
          <Link key={a.label} to={a.to} className={clsx('rounded-2xl p-2 sm:p-3 flex flex-col items-center justify-center gap-1 min-h-[84px] shadow-sm font-semibold text-xs sm:text-sm text-center active:scale-95', a.cls)}>
            <a.icon size={26} /> {a.label}
          </Link>
        ))}
      </div>

      {/* Money overview */}
      <div className="mb-3"><PeriodFilter period={period} setPeriod={setPeriod} custom={custom} setCustom={setCustom} /></div>
      <div className={clsx('grid gap-3 mb-5', isOwner ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2')}>
        <Stat label="Sales" value={money(st.totalSales, { decimals: 0 })} tone="light" sub={`${st.sales.length} sales`} />
        <Stat label="Expenses" value={money(st.totalExpenses, { decimals: 0 })} tone="earth" sub={`${st.expenses.length} expenses`} />
        {isOwner && <Stat label={st.net >= 0 ? 'Net Profit' : 'Net Loss'} value={money(st.net, { decimals: 0 })} tone={st.net >= 0 ? 'green' : 'red'} sub={`Margin ${pct(st.margin)}`} />}
        {isOwner && <Stat label="Capital Injected" value={money(st.totalInvestment, { decimals: 0 })} sub="Not counted as income" />}
      </div>

      {isOwner && (
        <>
          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <div className="card p-4">
              <h3 className="section-title mb-2">Income vs Expenses</h3>
              <IncomeExpenseChart data={st.monthly.slice(-12)} />
            </div>
            <div className="card p-4">
              <h3 className="section-title mb-2">Monthly Profit Trend</h3>
              <ProfitTrendChart data={trend} />
            </div>
          </div>

          <div className="card p-4 mb-4 bg-gradient-to-br from-farm to-farm-dark text-white">
            <div className="flex items-center gap-2 text-green-200 text-sm font-semibold"><TrendingUp size={18} /> PROJECTION</div>
            <p className="text-lg mt-1">At current rate, <b>{farm.name.split(' - ')[0]}</b> is projected to {proj.projected >= 0 ? 'make' : 'lose'} <b className="text-2xl">{money(Math.abs(proj.projected), { decimals: 0 })}</b> by {proj.target}.</p>
            <p className="text-sm text-green-200 mt-1">Profit so far this year: {money(proj.ytd, { decimals: 0 })} · recent average {money(proj.avgMonthly, { decimals: 0 })}/month</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="card p-4">
              <h3 className="section-title mb-3">Top 3 Expenses</h3>
              {st.byCategory.length === 0 ? <p className="text-gray-500">No expenses in this period.</p> : st.byCategory.slice(0, 3).map((c, i) => (
                <div key={c.category} className="mb-3">
                  <div className="flex justify-between text-sm font-semibold"><span>{i + 1}. {c.icon} {c.category}</span><span>{money(c.amount, { decimals: 0 })}</span></div>
                  <div className="h-2.5 bg-gray-100 rounded-full mt-1"><div className="h-full rounded-full" style={{ width: `${c.share}%`, background: c.color }} /></div>
                  <div className="text-xs text-gray-500 mt-0.5">{c.share.toFixed(0)}% of expenses</div>
                </div>
              ))}
            </div>
            <div className="card p-4">
              <h3 className="section-title mb-3 flex items-center gap-2"><Trophy size={20} className="text-amber-500" /> Best Performing Project</h3>
              {best ? (
                <Link to={`/project/${best.project.id}`} className="block rounded-xl bg-farm-pale p-3">
                  <div className="text-2xl">{productIcons(best.project.products)}</div>
                  <div className="font-bold">{best.project.name}</div>
                  <div className="text-sm text-gray-600">Sales {money(best.sales, { decimals: 0 })} · Costs {money(best.expenses, { decimals: 0 })}</div>
                  <div className={clsx('text-xl font-extrabold', best.net >= 0 ? 'text-farm' : 'text-red-600')}>{money(best.net, { decimals: 0 })}</div>
                </Link>
              ) : <p className="text-gray-500">No project activity in this period.</p>}
            </div>
          </div>

          {ins.length > 0 && (
            <div className="mb-5">
              <h3 className="section-title mb-2">Insights</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {ins.map((i, k) => (
                  <div key={k} className={clsx('card p-4 border-l-4', i.tone === 'bad' ? 'border-l-red-500' : i.tone === 'warn' ? 'border-l-amber-500' : i.tone === 'good' ? 'border-l-farm-light' : 'border-l-blue-400')}>
                    <div className="font-bold">{i.icon} {i.title}</div>
                    <p className="text-sm text-gray-600 mt-1">{i.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Farm menu */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {menu.map((m) => (
          <Link key={m.label} to={m.to} className="relative card p-2 sm:p-3 flex flex-col items-center gap-1 text-xs sm:text-sm font-semibold text-gray-700 active:scale-95 min-h-[76px] justify-center">
            <m.icon size={24} className="text-farm" /> {m.label}
            {m.count > 0 && <span className="absolute top-1 right-1 text-[10px] bg-farm-pale text-farm rounded-full px-1.5 font-bold">{m.count}</span>}
            {m.alert > 0 && <span className="absolute top-1 right-1 text-[10px] bg-red-500 text-white rounded-full px-1.5 font-bold">{m.alert}</span>}
          </Link>
        ))}
      </div>

      {/* Projects */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="section-title">Projects</h3>
        <Link to={`/farm/${farmId}/projects`} className="text-farm font-semibold text-sm flex items-center">See all <ChevronRight size={16} /></Link>
      </div>
      {projects.length === 0 ? (
        <Empty icon="🌱" title="No projects yet" text="Create a project like Maize, Goats or Tilapia to track its costs and profit." action={isOwner && <Link to={`/farm/${farmId}/projects?new=1`} className="btn-primary">Create Project</Link>} />
      ) : (
        <div className="space-y-2 mb-5">
          {projects.slice(0, 4).map((p) => {
            const ps = statement(state, { projectId: p.id })
            return (
              <Link key={p.id} to={`/project/${p.id}`} className="card p-3 flex items-center gap-3">
                <div className="text-2xl w-12 text-center">{productIcons(p.products)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{p.name}</div>
                  <div className="text-xs text-gray-500">{fmtDate(p.startDate)} → {fmtDate(p.harvestDate)} · <Badge tone={p.status === 'Active' ? 'green' : p.status === 'Harvested' ? 'orange' : 'gray'}>{p.status}</Badge></div>
                </div>
                {isOwner && <div className={clsx('font-extrabold text-right', ps.net >= 0 ? 'text-farm' : 'text-red-600')}>{money(ps.net, { decimals: 0 })}</div>}
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
            )
          })}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Weather farm={farm} />
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="section-title">Open Tasks</h3>
            <Link to={`/tasks?${q}`} className="text-farm font-semibold text-sm">All tasks</Link>
          </div>
          {tasks.length === 0 ? <p className="text-gray-500">No open tasks 🎉</p> : tasks.slice(0, 4).map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="font-medium">{t.title}</span>
              <span className={clsx('text-xs font-bold whitespace-nowrap ml-2', t.dueDate < today() ? 'text-red-600' : t.dueDate === today() ? 'text-orange-600' : 'text-gray-500')}>{t.dueDate < today() ? 'Overdue' : fmtDate(t.dueDate)}</span>
            </div>
          ))}
          {lowStock.length > 0 && <p className="mt-3 text-sm text-red-600 font-semibold">📦 Low stock: {lowStock.map((i) => i.name).join(', ')}</p>}
        </div>
      </div>

      {farm.notes && <div className="card p-4 mb-4 bg-earth-pale"><h3 className="font-bold text-earth mb-1">Owner Notes</h3><p className="text-gray-700 whitespace-pre-line">{farm.notes}</p></div>}

      {isOwner && recent.length > 0 && (
        <div className="card p-4">
          <h3 className="section-title mb-2">Recent Activity</h3>
          {recent.map((a) => <p key={a.id} className="text-sm py-1.5 border-b last:border-0"><b>{a.userName}</b> {a.text} <span className="text-gray-400">· {timeAgo(a.ts)}</span></p>)}
        </div>
      )}

      <FarmForm open={edit} onClose={() => setEdit(false)} farm={farm} />
    </div>
  )
}
