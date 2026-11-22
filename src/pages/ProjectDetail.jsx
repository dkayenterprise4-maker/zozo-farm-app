import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Pencil, Trash2, ShoppingCart, Receipt, Camera, FileBarChart, AlertTriangle, Lightbulb, BellPlus, Fish } from 'lucide-react'
import { useStore } from '../lib/store'
import { statement } from '../lib/finance'
import { money, fmtDate, pct, clsx, daysBetween, today } from '../lib/utils'
import { productPhoto } from '../lib/photos'
import { productNames, PRODUCT_MAP, PROJECT_STATUSES, isCrop } from '../lib/constants'
import { rotationCheck, fieldHistory, nextCropSuggestion, fishFeeding, FISH_REMINDERS, LIVESTOCK_GUIDE, reminderTasks, projectKinds } from '../lib/guidance'
import { PageHeader, Stat, Chips, useConfirm, Badge, Img, Empty, CatDot } from '../components/ui'
import { IncomeExpenseChart } from '../components/Charts'
import ProjectForm from '../components/ProjectForm'
import TxList from '../components/TxList'

export default function ProjectDetail() {
  const { projectId } = useParams()
  const { state, isOwner, visibleFarms, removeProject, updateProject, toast } = useStore()
  const p = state.projects.find((x) => x.id === projectId)
  const farm = p && visibleFarms.find((f) => f.id === p.farmId)
  const [tab, setTab] = useState('overview')
  const [moneyTab, setMoneyTab] = useState('sales')
  const [edit, setEdit] = useState(false)
  const confirm = useConfirm()
  const nav = useNavigate()
  const st = useMemo(() => (p ? statement(state, { projectId }) : null), [state, projectId]) // eslint-disable-line
  if (!p || !farm) return <Navigate to="/" replace />

  const del = async () => {
    if (await confirm({ title: 'Delete project?', message: `Delete "${p.name}"? Its sales and expenses will stay on the farm but will no longer be linked to a project.` })) {
      removeProject(p.id)
      toast('Project deleted')
      nav(`/farm/${farm.id}`)
    }
  }
  const progress = p.startDate && p.harvestDate ? Math.max(0, Math.min(100, (daysBetween(p.startDate, today()) / Math.max(1, daysBetween(p.startDate, p.harvestDate))) * 100)) : 0
  const daysLeft = p.harvestDate ? daysBetween(today(), p.harvestDate) : null
  const photos = state.photos.filter((ph) => ph.projectId === p.id)
  const tabs = [{ id: 'overview', label: 'Overview' }, { id: 'money', label: 'Money' }, { id: 'guide', label: 'Guidance' }, { id: 'photos', label: `Photos (${photos.length})` }]
  const q = `farm=${farm.id}&project=${p.id}`

  return (
    <div>
      <PageHeader title={p.name} subtitle={`${farm.name}${p.field ? ' · ' + p.field : ''}`} right={isOwner && (
        <div className="flex gap-1">
          <button onClick={() => setEdit(true)} className="h-11 w-11 rounded-xl bg-white border flex items-center justify-center" aria-label="Edit"><Pencil size={18} /></button>
          <button onClick={del} className="h-11 w-11 rounded-xl bg-white border text-red-600 flex items-center justify-center" aria-label="Delete"><Trash2 size={18} /></button>
        </div>
      )} />

      <div className="card overflow-hidden mb-4">
        <img src={productPhoto(p.products)} alt={productNames(p.products)} className="w-full h-36 sm:h-48 object-cover" />
        <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="font-semibold">{productNames(p.products)}</div>
            <div className="text-sm text-gray-500">{fmtDate(p.startDate)} → {fmtDate(p.harvestDate)}</div>
          </div>
          {isOwner ? (
            <select value={p.status} onChange={(e) => { updateProject(p.id, { status: e.target.value }); toast('Status: ' + e.target.value) }} className="input !min-h-[40px] !w-auto text-sm font-semibold">
              {PROJECT_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          ) : <Badge tone="green">{p.status}</Badge>}
        </div>
        {p.status === 'Active' && p.harvestDate && (
          <div className="mt-3">
            <div className="h-3 rounded-full bg-gray-100"><div className="h-full rounded-full bg-farm-light" style={{ width: `${progress}%` }} /></div>
            <div className="text-xs text-gray-500 mt-1">{daysLeft >= 0 ? `${daysLeft} days to expected harvest` : `Harvest was expected ${-daysLeft} days ago - update status?`}</div>
          </div>
        )}
        {p.notes && <p className="text-sm text-gray-600 mt-3">{p.notes}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Link to={`/add/sale?${q}`} className="btn bg-farm-light text-white flex-col !gap-0 min-h-[64px] text-sm"><ShoppingCart size={22} />Add Sale</Link>
        <Link to={`/add/expense?${q}`} className="btn bg-earth text-white flex-col !gap-0 min-h-[64px] text-sm"><Receipt size={22} />Add Expense</Link>
        <Link to={`/gallery?${q}&add=1`} className="btn-outline flex-col !gap-0 min-h-[64px] text-sm"><Camera size={22} />Photo</Link>
      </div>

      <div className="mb-4"><Chips options={tabs} value={tab} onChange={setTab} /></div>

      {tab === 'overview' && (
        <>
          <div className={clsx('grid gap-3 mb-4', isOwner ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2')}>
            <Stat label="Cost (Expenses)" value={money(st.totalExpenses, { decimals: 0 })} tone="earth" />
            <Stat label="Income (Sales)" value={money(st.totalSales, { decimals: 0 })} tone="light" />
            {isOwner && <Stat label={st.net >= 0 ? 'Profit' : 'Loss'} value={money(st.net, { decimals: 0 })} tone={st.net >= 0 ? 'green' : 'red'} sub={`Margin ${pct(st.margin)}`} />}
            {isOwner && <Stat label="Capital" value={money(st.totalInvestment, { decimals: 0 })} />}
          </div>
          {isOwner && (
            <div className="card p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="section-title">Income vs Expenses</h3>
                <Link to={`/statement?${q}`} className="btn-light btn-sm"><FileBarChart size={16} /> Statement</Link>
              </div>
              <IncomeExpenseChart data={st.monthly} />
            </div>
          )}
          {st.byCategory.length > 0 && (
            <div className="card p-4 mb-4">
              <h3 className="section-title mb-2">Costs by category</h3>
              {st.byCategory.map((c) => (
                <div key={c.category} className="flex justify-between py-1.5 border-b last:border-0 text-sm"><span><CatDot color={c.color} />{c.category}</span><span className="font-semibold">{money(c.amount)} <span className="text-gray-400">({c.share.toFixed(0)}%)</span></span></div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'money' && (
        <>
          <div className="mb-3"><Chips options={[{ id: 'sales', label: 'Sales' }, { id: 'expenses', label: 'Expenses' }, ...(isOwner ? [{ id: 'investments', label: 'Capital' }] : [])]} value={moneyTab} onChange={setMoneyTab} /></div>
          <TxList key={moneyTab} type={moneyTab} projectId={p.id} />
        </>
      )}

      {tab === 'guide' && <Guidance project={p} />}

      {tab === 'photos' && (
        photos.length === 0 ? <Empty icon="" title="No photos for this project" text="Take photos to track growth and problems." action={<Link to={`/gallery?${q}&add=1`} className="btn-primary">Add Photo</Link>} /> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {photos.map((ph) => (
              <Link to={`/gallery?farm=${farm.id}&project=${p.id}`} key={ph.id} className="card overflow-hidden">
                <Img id={ph.id} className="w-full h-32 object-cover" fallback={<div className="h-32 bg-gray-100" />} />
                <div className="p-2 text-xs"><b className="capitalize">{ph.kind}</b> · {fmtDate(ph.date)}<div className="truncate text-gray-500">{ph.caption}</div></div>
              </Link>
            ))}
          </div>
        )
      )}

      <ProjectForm open={edit} onClose={() => setEdit(false)} farmId={farm.id} project={p} />
    </div>
  )
}

function Guidance({ project }) {
  const { state, addTask, isOwner, toast, updateProject } = useStore()
  const kinds = projectKinds(project)
  const rot = rotationCheck(state, { farmId: project.farmId, field: project.field, products: project.products, startDate: project.startDate, id: project.id })
  const history = fieldHistory(state, project.farmId, project.field)
  const [count, setCount] = useState(project.fishCount || '')
  const [weight, setWeight] = useState(project.avgWeight || '')
  const feed = fishFeeding(count, weight)
  const addReminders = (items) => {
    const tasks = reminderTasks(project, items)
    tasks.forEach((t) => addTask({ ...t, assignedTo: '' }))
    toast(`${tasks.length} reminder(s) added to Tasks`)
  }

  return (
    <div className="space-y-4">
      {kinds.crop && (
        <div className="card p-4">
          <h3 className="section-title mb-2">Crop Rotation {project.field ? `- ${project.field}` : ''}</h3>
          {!project.field && <p className="text-sm text-gray-600">Add a field/plot name to this project (Edit) so the app can track what was planted where.</p>}
          {rot.warnings.map((w, i) => <div key={i} className="flex gap-2 rounded-xl bg-red-50 border border-red-200 text-red-800 p-3 mb-2 text-sm font-medium"><AlertTriangle size={20} className="shrink-0" />{w}</div>)}
          {rot.suggestion && <div className="flex gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 mb-2 text-sm"><Lightbulb size={20} className="shrink-0 text-amber-600" />{rot.suggestion}</div>}
          {nextCropSuggestion(project) && <div className="flex gap-2 rounded-xl bg-green-50 border border-green-200 text-green-900 p-3 mb-2 text-sm"><Lightbulb size={20} className="shrink-0" />{nextCropSuggestion(project)}</div>}
          {history.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-semibold text-gray-600 mb-1">Field history</div>
              {history.map((h) => (
                <div key={h.id} className={clsx('flex justify-between text-sm py-1.5 border-b last:border-0', h.id === project.id && 'font-bold text-farm')}>
                  <span>{h.products.filter(isCrop).map((x) => PRODUCT_MAP[x].name).join(' + ')}</span>
                  <span className="text-gray-500">{fmtDate(h.startDate)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {kinds.fish && (
        <div className="card p-4">
          <h3 className="section-title mb-2 flex items-center gap-2"><Fish size={20} /> Fish Feeding Calculator</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="text-sm font-semibold">Number of fish<input className="input" inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} /></label>
            <label className="text-sm font-semibold">Avg weight (grams)<input className="input" inputMode="numeric" value={weight} onChange={(e) => setWeight(e.target.value)} /></label>
          </div>
          {Number(count) > 0 && Number(weight) > 0 ? (
            <div className="rounded-xl bg-blue-50 p-3 text-sm space-y-1">
              <p>Total fish weight: <b>{feed.biomassKg.toLocaleString()} kg</b></p>
              <p>Feed per day: <b className="text-lg">{feed.dailyKg} kg</b> ({feed.ratePct}% of body weight)</p>
              <p>Feed {feed.times} times a day: <b>{feed.perFeedingKg} kg</b> each at {feed.schedule.join(', ')}</p>
              <p>Feed type: <b>{feed.feed}</b></p>
              <p>About <b>{feed.bagsPerWeek} bags (25 kg)</b> per week.</p>
            </div>
          ) : <p className="text-sm text-gray-500">Enter fish count and average weight (weigh 20 fish and divide).</p>}
          {isOwner && (Number(count) !== Number(project.fishCount) || Number(weight) !== Number(project.avgWeight)) && Number(count) > 0 && (
            <button className="btn-light btn-sm mt-2" onClick={() => { updateProject(project.id, { fishCount: count, avgWeight: weight }); toast('Saved to project') }}>Save these numbers</button>
          )}
          <h4 className="font-semibold mt-4 mb-1">Water care reminders</h4>
          <ul className="text-sm text-gray-700 space-y-1">{FISH_REMINDERS.map((r) => <li key={r.title}>• {r.title} - every {r.every} days</li>)}</ul>
          <button className="btn-outline btn-sm mt-3" onClick={() => addReminders(FISH_REMINDERS)}><BellPlus size={16} /> Add reminders to Tasks</button>
        </div>
      )}

      {kinds.livestock.map((id) => {
        const g = LIVESTOCK_GUIDE[id]
        if (!g) return null
        return (
          <div key={id} className="card p-4">
            <h3 className="section-title mb-2">{PRODUCT_MAP[id].name}: care guide</h3>
            <p className="text-sm text-gray-700 mb-3"><b>Feeding:</b> {g.feeding}</p>
            <h4 className="font-semibold mb-1">Vaccination & health schedule</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              {g.schedule.map((s) => <li key={s.title}>• {s.title}{s.every ? ` - every ${s.every} days` : s.at != null ? ` - day ${s.at} (${fmtDate(new Date(new Date(project.startDate).getTime() + s.at * 86400000).toISOString())})` : ''}</li>)}
            </ul>
            <button className="btn-outline btn-sm mt-3" onClick={() => addReminders(g.schedule)}><BellPlus size={16} /> Add vaccination reminders to Tasks</button>
          </div>
        )
      })}

      {!kinds.crop && !kinds.fish && !kinds.livestock.length && <Empty icon="" title="No guidance for custom projects" text="Ask Zozo Assistant any question about this project." />}
    </div>
  )
}
