import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Trash2, Pencil, Check, Calendar, User } from 'lucide-react'
import { useStore } from '../lib/store'
import { PageHeader, SearchBar, Chips, Empty, Modal, Field, Select, useConfirm, Badge } from '../components/ui'
import { fmtDate, today, matches, clsx, addDays } from '../lib/utils'

export default function Tasks() {
  const [sp] = useSearchParams()
  const { state, user, isOwner, visibleFarms, updateTask, removeTask, toast } = useStore()
  const [farmId, setFarmId] = useState(sp.get('farm') || '')
  const [status, setStatus] = useState('Open')
  const [who, setWho] = useState(isOwner ? '' : user.id)
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState(null)
  const confirm = useConfirm()
  const t0 = today()
  const farmIds = visibleFarms.map((f) => f.id)
  const workers = state.users.filter((u) => u.role === 'worker' || u.id === user.id)

  const list = state.tasks
    .filter((t) => farmIds.includes(t.farmId) && (!farmId || t.farmId === farmId) && (!who || t.assignedTo === who))
    .filter((t) => status === 'All' || (status === 'Open' && !t.done) || (status === 'Overdue' && !t.done && t.dueDate < t0) || (status === 'Done' && t.done) || (status === 'Today' && !t.done && t.dueDate === t0))
    .filter((t) => matches(q, t.title, t.notes))
    .sort((a, b) => Number(a.done) - Number(b.done) || a.dueDate.localeCompare(b.dueDate))
  const overdueCount = state.tasks.filter((t) => farmIds.includes(t.farmId) && !t.done && t.dueDate < t0 && (isOwner || t.assignedTo === user.id)).length

  const name = (id) => state.users.find((u) => u.id === id)?.name || 'Unassigned'
  const farmName = (id) => state.farms.find((f) => f.id === id)?.name.split(' - ')[0]
  const projName = (id) => state.projects.find((p) => p.id === id)?.name

  return (
    <div>
      <PageHeader title={isOwner ? 'Tasks & Reminders' : 'My Tasks'} back={false} right={isOwner && <button className="btn-primary btn-sm" onClick={() => setEdit({})}><Plus size={18} /> New Task</button>} />
      {overdueCount > 0 && <div className="card p-3 mb-3 bg-red-50 border-red-200 text-red-700 font-semibold">{overdueCount} task{overdueCount > 1 ? 's are' : ' is'} overdue</div>}
      <div className="space-y-2 mb-4">
        <SearchBar value={q} onChange={setQ} placeholder="Search tasks..." />
        <Chips options={['Open', 'Today', 'Overdue', 'Done', 'All']} value={status} onChange={setStatus} />
        <div className="grid grid-cols-2 gap-2">
          <Select value={farmId} onChange={setFarmId} options={visibleFarms.map((f) => ({ value: f.id, label: f.name }))} placeholder="All farms" />
          {isOwner ? <Select value={who} onChange={setWho} options={workers.map((u) => ({ value: u.id, label: u.name }))} placeholder="Everyone" /> : <div />}
        </div>
      </div>
      {list.length === 0 ? (
        <Empty icon="" title={status === 'Open' ? 'No open tasks' : 'No tasks found'} text={isOwner ? 'Create tasks like "Vaccinate goats" or "Water fish pond" and assign them to workers.' : 'Nothing to do right now. Great job!'} action={isOwner && <button className="btn-primary" onClick={() => setEdit({})}><Plus size={18} /> New Task</button>} />
      ) : (
        <div className="space-y-2">
          {list.map((t) => {
            const overdue = !t.done && t.dueDate < t0
            const canTick = isOwner || t.assignedTo === user.id
            return (
              <div key={t.id} className={clsx('card p-3 flex gap-3 items-start border-l-4', t.done ? 'border-l-gray-300 opacity-70' : overdue ? 'border-l-red-500 bg-red-50' : t.dueDate === t0 ? 'border-l-orange-400' : 'border-l-farm-light')}>
                <button disabled={!canTick} onClick={() => { updateTask(t.id, { done: !t.done }); toast(t.done ? 'Task reopened' : 'Task done ') }} className={clsx('h-9 w-9 shrink-0 rounded-full border-2 flex items-center justify-center', t.done ? 'bg-farm border-farm text-white' : 'border-gray-300 bg-white')} aria-label="Mark done">
                  {t.done && <Check size={18} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={clsx('font-bold', t.done && 'line-through')}>{t.title}</div>
                  <div className="text-xs text-gray-600 flex flex-wrap gap-x-3 gap-y-1 mt-1">
                    <span className={clsx('flex items-center gap-1 font-semibold', overdue && 'text-red-600')}><Calendar size={12} />{overdue ? 'OVERDUE · ' : ''}{fmtDate(t.dueDate)}</span>
                    <span className="flex items-center gap-1"><User size={12} />{name(t.assignedTo)}</span>
                    <span>{farmName(t.farmId)}{projName(t.projectId) ? ` · ${projName(t.projectId)}` : ''}</span>
                  </div>
                  {t.notes && <p className="text-sm text-gray-500 mt-1">{t.notes}</p>}
                </div>
                {isOwner && (
                  <div className="flex flex-col">
                    <button onClick={() => setEdit(t)} className="p-2 text-gray-500" aria-label="Edit"><Pencil size={16} /></button>
                    <button onClick={async () => { if (await confirm({ title: 'Delete task?', message: `Delete "${t.title}"?` })) { removeTask(t.id); toast('Task deleted') } }} className="p-2 text-red-500" aria-label="Delete"><Trash2 size={16} /></button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      <TaskForm task={edit} onClose={() => setEdit(null)} defaultFarm={farmId} />
    </div>
  )
}

function TaskForm({ task, onClose, defaultFarm }) {
  const { state, visibleFarms, addTask, updateTask, toast } = useStore()
  const [f, setF] = useState(null)
  const [err, setErr] = useState({})
  useEffect(() => {
    setErr({})
    setF(task ? (task.id ? { ...task } : { title: '', farmId: defaultFarm || visibleFarms[0]?.id || '', projectId: '', dueDate: addDays(today(), 1), assignedTo: '', notes: '' }) : null)
  }, [task]) // eslint-disable-line
  const close = () => onClose()
  if (!task || !f) return null
  const set = (k) => (e) => setF({ ...f, [k]: e?.target ? e.target.value : e })
  const save = (e) => {
    e.preventDefault()
    const er = {}
    if (!f.title.trim()) er.title = 'Task title is required'
    if (!f.farmId) er.farmId = 'Choose a farm'
    if (!f.dueDate) er.dueDate = 'Choose a due date'
    setErr(er)
    if (Object.keys(er).length) return
    if (task.id) { updateTask(task.id, f); toast('Task updated') } else { addTask({ ...f, title: f.title.trim() }); toast('Task created') }
    close()
  }
  const people = state.users.filter((u) => u.role === 'owner' || (u.farmIds || []).includes(f.farmId))
  const templates = ['Vaccinate goats', 'Apply fertilizer', 'Water fish pond', 'Pay worker', 'Buy feed', 'Spray crops', 'Repair fence', 'Weed the field']
  return (
    <Modal open onClose={close} title={task.id ? 'Edit Task' : 'New Task'}>
      <form onSubmit={save}>
        {!task.id && <div className="flex flex-wrap gap-2 mb-3">{templates.map((t) => <button type="button" key={t} onClick={() => setF({ ...f, title: t })} className="chip-off text-xs">{t}</button>)}</div>}
        <Field label="Task *" error={err.title}><input className="input" value={f.title} onChange={set('title')} placeholder="e.g. Vaccinate goats" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Farm *" error={err.farmId}><Select value={f.farmId} onChange={(v) => setF({ ...f, farmId: v, projectId: '' })} options={visibleFarms.map((x) => ({ value: x.id, label: x.name }))} placeholder="Choose" /></Field>
          <Field label="Project"><Select value={f.projectId} onChange={set('projectId')} options={state.projects.filter((p) => p.farmId === f.farmId).map((p) => ({ value: p.id, label: p.name }))} placeholder="None" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Due Date *" error={err.dueDate}><input type="date" className="input" value={f.dueDate} onChange={set('dueDate')} /></Field>
          <Field label="Assigned To"><Select value={f.assignedTo} onChange={set('assignedTo')} options={people.map((u) => ({ value: u.id, label: u.name }))} placeholder="Unassigned" /></Field>
        </div>
        <Field label="Notes"><textarea className="input" rows={2} value={f.notes} onChange={set('notes')} /></Field>
        <button className="btn-primary w-full">{task.id ? 'Save Task' : 'Create Task'}</button>
      </form>
    </Modal>
  )
}
