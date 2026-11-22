import { useEffect, useState } from 'react'
import { Plus, Phone, Pencil, Trash2, MessageCircle } from 'lucide-react'
import { useStore } from '../lib/store'
import { PageHeader, SearchBar, Empty, Modal, Field, useConfirm, Badge } from '../components/ui'
import { matches, money, timeAgo, clsx } from '../lib/utils'

export default function Workers() {
  const { state, removeWorker, toast } = useStore()
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState(null)
  const confirm = useConfirm()
  const workers = state.users.filter((u) => u.role === 'worker' && matches(q, u.name, u.phone, u.jobTitle, u.email))
  const farmName = (id) => state.farms.find((f) => f.id === id)?.name

  return (
    <div>
      <PageHeader title="Workers" subtitle={`${state.users.filter((u) => u.role === 'worker').length} workers`} right={<button className="btn-primary btn-sm" onClick={() => setEdit({})}><Plus size={18} /> Add</button>} />
      <div className="mb-4"><SearchBar value={q} onChange={setQ} placeholder="Search workers..." /></div>
      {workers.length === 0 ? (
        <Empty icon="👷" title="No workers yet" text="Add workers so they can record expenses, sales, photos and visits from their own phone." action={<button className="btn-primary" onClick={() => setEdit({})}><Plus size={18} /> Add Worker</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {workers.map((w) => {
            const last = state.activity.find((a) => a.userId === w.id)
            const myExp = state.expenses.filter((e) => e.createdBy === w.id)
            const open = state.tasks.filter((t) => t.assignedTo === w.id && !t.done).length
            return (
              <div key={w.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-full bg-farm text-white flex items-center justify-center text-xl font-bold">{w.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold">{w.name}</div>
                    <div className="text-sm text-gray-500">{w.jobTitle || 'Worker'}</div>
                    <div className="flex flex-wrap gap-1 mt-1">{(w.farmIds || []).length ? w.farmIds.map((f) => <Badge key={f} tone="green">{farmName(f)?.split(' - ')[0]}</Badge>) : <Badge tone="orange">No farm assigned</Badge>}</div>
                  </div>
                  <div className="flex">
                    <button onClick={() => setEdit(w)} className="p-2 text-gray-500" aria-label="Edit"><Pencil size={16} /></button>
                    <button onClick={async () => { if (await confirm({ title: 'Remove worker?', message: `Remove ${w.name}? They will no longer be able to log in. Their past records stay.` , confirmText: 'Remove' })) { removeWorker(w.id); toast('Worker removed') } }} className="p-2 text-red-500" aria-label="Remove"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                  <div className="rounded-lg bg-gray-50 p-2"><div className="font-bold text-base">{open}</div>open tasks</div>
                  <div className="rounded-lg bg-gray-50 p-2"><div className="font-bold text-base">{myExp.length}</div>expenses</div>
                  <div className="rounded-lg bg-gray-50 p-2"><div className="font-bold text-sm">{money(myExp.reduce((a, e) => a + Number(e.amount), 0), { decimals: 0 })}</div>recorded</div>
                </div>
                {last && <p className="text-xs text-gray-500 mt-2">Last: {last.text} · {timeAgo(last.ts)}</p>}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <a href={`tel:${w.phone}`} className="btn-light btn-sm"><Phone size={16} /> Call</a>
                  <a href={`https://wa.me/${w.phone.replace(/\D/g, '').replace(/^0/, '260')}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm"><MessageCircle size={16} /> WhatsApp</a>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <WorkerForm worker={edit} onClose={() => setEdit(null)} />
    </div>
  )
}

function WorkerForm({ worker, onClose }) {
  const { state, addWorker, updateWorker, toast } = useStore()
  const [f, setF] = useState(null)
  const [err, setErr] = useState({})
  useEffect(() => {
    setErr({})
    setF(worker ? (worker.id ? { ...worker, farmIds: worker.farmIds || [] } : { name: '', phone: '', email: '', jobTitle: '', farmIds: [], password: '123456', pin: '1234' }) : null)
  }, [worker])
  if (!worker || !f) return null
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const toggle = (id) => setF({ ...f, farmIds: f.farmIds.includes(id) ? f.farmIds.filter((x) => x !== id) : [...f.farmIds, id] })
  const save = async (e) => {
    e.preventDefault()
    const er = {}
    if (!f.name.trim()) er.name = 'Name is required'
    if (!/^[0-9+\s]{9,15}$/.test(f.phone.trim())) er.phone = 'Enter a valid phone number'
    if (!worker.id && f.password.length < 6) er.password = 'At least 6 characters'
    if (!worker.id && !/^\d{4}$/.test(f.pin)) er.pin = '4 numbers'
    setErr(er)
    if (Object.keys(er).length) return
    try {
      if (worker.id) {
        updateWorker(worker.id, { name: f.name.trim(), phone: f.phone.trim(), email: f.email, jobTitle: f.jobTitle, farmIds: f.farmIds })
        toast('Worker updated')
      } else {
        await addWorker({ ...f, name: f.name.trim(), phone: f.phone.trim() })
        toast(`${f.name} added. They can log in with phone ${f.phone} and password ${f.password}`)
      }
      onClose()
    } catch (x) {
      setErr({ form: x.message })
    }
  }
  return (
    <Modal open onClose={onClose} title={worker.id ? 'Edit Worker' : 'Add Worker'}>
      <form onSubmit={save}>
        <Field label="Name *" error={err.name}><input className="input" value={f.name} onChange={set('name')} placeholder="e.g. John Banda" /></Field>
        <Field label="Phone *" error={err.phone}><input className="input" value={f.phone} onChange={set('phone')} inputMode="tel" placeholder="0977 123 456" /></Field>
        <Field label="Email (optional)"><input className="input" value={f.email} onChange={set('email')} inputMode="email" /></Field>
        <Field label="Role / Job"><input className="input" value={f.jobTitle} onChange={set('jobTitle')} placeholder="e.g. Herdsman, Pond Attendant" list="jobs" /><datalist id="jobs">{['Farm Supervisor', 'Herdsman', 'Pond Attendant', 'Field Worker', 'Driver', 'Security Guard'].map((j) => <option key={j} value={j} />)}</datalist></Field>
        <Field label="Farms Assigned">
          <div className="space-y-2">
            {state.farms.map((farm) => (
              <label key={farm.id} className={clsx('flex items-center gap-3 rounded-xl border-2 p-3', f.farmIds.includes(farm.id) ? 'border-farm bg-farm-pale' : 'border-gray-200 bg-white')}>
                <input type="checkbox" className="h-5 w-5 accent-[#1B5E20]" checked={f.farmIds.includes(farm.id)} onChange={() => toggle(farm.id)} />
                <span className="font-medium">{farm.name}</span>
              </label>
            ))}
          </div>
        </Field>
        {!worker.id && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Login Password" error={err.password}><input className="input" value={f.password} onChange={set('password')} /></Field>
            <Field label="PIN" error={err.pin}><input className="input" value={f.pin} onChange={set('pin')} maxLength={4} inputMode="numeric" /></Field>
          </div>
        )}
        <p className="text-xs text-gray-500 mb-3">Workers can only add expenses, sales, photos and visit notes for their farms. They cannot see profit, delete records or export statements.</p>
        {err.form && <p className="text-red-600 mb-3">{err.form}</p>}
        <button className="btn-primary w-full">{worker.id ? 'Save' : 'Add Worker'}</button>
      </form>
    </Modal>
  )
}
