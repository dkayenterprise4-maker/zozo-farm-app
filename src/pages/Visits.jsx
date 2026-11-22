import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Trash2, Eye, Wrench, ListPlus } from 'lucide-react'
import { useStore } from '../lib/store'
import { PageHeader, SearchBar, Empty, Modal, Field, Select, PhotoPicker, Img, useConfirm } from '../components/ui'
import { fmtDate, matches, today, addDays } from '../lib/utils'

export default function Visits() {
  const [sp] = useSearchParams()
  const { state, isOwner, visibleFarms, removeVisit, addTask, toast } = useStore()
  const [farmId, setFarmId] = useState(sp.get('farm') || '')
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [photo, setPhoto] = useState(null)
  const confirm = useConfirm()
  const ids = visibleFarms.map((f) => f.id)
  const list = state.visits.filter((v) => ids.includes(v.farmId) && (!farmId || v.farmId === farmId) && matches(q, v.visitor, v.saw, v.fix)).sort((a, b) => b.date.localeCompare(a.date))
  const farmName = (id) => state.farms.find((f) => f.id === id)?.name

  return (
    <div>
      <PageHeader title="Visit Log" subtitle={farmId ? farmName(farmId) : 'All farms'} right={<button className="btn-primary btn-sm" onClick={() => setAdding(true)}><Plus size={18} /> Visit</button>} />
      <div className="space-y-2 mb-4">
        <SearchBar value={q} onChange={setQ} placeholder="Search visits..." />
        <Select value={farmId} onChange={setFarmId} options={visibleFarms.map((f) => ({ value: f.id, label: f.name }))} placeholder="All farms" />
      </div>
      {list.length === 0 ? (
        <Empty icon="📝" title="No visits logged" text="Each time you or a worker visits a farm, write what you saw and what needs fixing." action={<button className="btn-primary" onClick={() => setAdding(true)}><Plus size={18} /> Log a Visit</button>} />
      ) : (
        <div className="space-y-3">
          {list.map((v) => (
            <div key={v.id} className="card p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold">{v.visitor} visited {farmName(v.farmId)}</div>
                  <div className="text-sm text-gray-500">{fmtDate(v.date)}</div>
                </div>
                {isOwner && <button onClick={async () => { if (await confirm({ title: 'Delete visit?', message: 'Delete this visit note?' })) { removeVisit(v.id); toast('Visit deleted') } }} className="p-2 text-red-500" aria-label="Delete"><Trash2 size={16} /></button>}
              </div>
              {v.saw && <p className="mt-2 text-sm"><span className="font-semibold text-farm flex items-center gap-1"><Eye size={14} /> What they saw</span>{v.saw}</p>}
              {v.fix && <p className="mt-2 text-sm"><span className="font-semibold text-earth flex items-center gap-1"><Wrench size={14} /> Needs fixing</span>{v.fix}</p>}
              {v.photoIds?.length > 0 && (
                <div className="flex gap-2 mt-2 overflow-x-auto">{v.photoIds.map((id) => <button key={id} onClick={() => setPhoto(id)}><Img id={id} className="h-20 w-28 object-cover rounded-lg" fallback={<div className="h-20 w-28 bg-gray-100 rounded-lg" />} /></button>)}</div>
              )}
              {isOwner && v.fix && (
                <button className="btn-light btn-sm mt-3" onClick={() => { addTask({ title: `Fix: ${v.fix.slice(0, 60)}`, farmId: v.farmId, projectId: '', dueDate: addDays(today(), 3), assignedTo: '', notes: `From visit on ${fmtDate(v.date)} by ${v.visitor}` }); toast('Task created from visit') }}><ListPlus size={16} /> Make it a task</button>
              )}
            </div>
          ))}
        </div>
      )}
      <Modal open={!!photo} onClose={() => setPhoto(null)} title="Visit Photo"><Img id={photo} className="w-full rounded-xl" /></Modal>
      <AddVisit open={adding} onClose={() => setAdding(false)} defaultFarm={farmId} />
    </div>
  )
}

function AddVisit({ open, onClose, defaultFarm }) {
  const { user, visibleFarms, addVisit, addPhoto, toast } = useStore()
  const [f, setF] = useState(null)
  const [photos, setPhotos] = useState([])
  const [err, setErr] = useState({})
  useEffect(() => {
    if (open) { setF({ farmId: defaultFarm || visibleFarms[0]?.id || '', date: today(), visitor: user.name, saw: '', fix: '' }); setPhotos([]); setErr({}) }
  }, [open]) // eslint-disable-line
  if (!open || !f) return null
  const set = (k) => (e) => setF({ ...f, [k]: e.target ? e.target.value : e })
  const save = async (e) => {
    e.preventDefault()
    const er = {}
    if (!f.farmId) er.farmId = 'Choose a farm'
    if (!f.saw.trim() && !f.fix.trim()) er.saw = 'Write what you saw or what needs fixing'
    setErr(er)
    if (Object.keys(er).length) return
    const photoIds = []
    for (const p of photos) photoIds.push((await addPhoto({ dataUrl: p, kind: 'visit', farmId: f.farmId, projectId: '', caption: `Visit by ${f.visitor}`, date: f.date })).id)
    addVisit({ ...f, photoIds })
    toast('Visit logged')
    onClose()
  }
  return (
    <Modal open onClose={onClose} title="Log a Visit">
      <form onSubmit={save}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Farm *" error={err.farmId}><Select value={f.farmId} onChange={(v) => setF({ ...f, farmId: v })} options={visibleFarms.map((x) => ({ value: x.id, label: x.name }))} placeholder="Choose" /></Field>
          <Field label="Date"><input type="date" className="input" value={f.date} max={today()} onChange={set('date')} /></Field>
        </div>
        <Field label="Who visited"><input className="input" value={f.visitor} onChange={set('visitor')} /></Field>
        <Field label="What did you see?" error={err.saw}><textarea className="input" rows={3} value={f.saw} onChange={set('saw')} placeholder="e.g. Maize looks healthy, goats grazing well" /></Field>
        <Field label="What needs fixing?"><textarea className="input" rows={2} value={f.fix} onChange={set('fix')} placeholder="e.g. Broken fence near the gate" /></Field>
        <Field label="Photos">
          <div className="grid grid-cols-3 gap-2 mb-2">{photos.map((p, i) => <div key={i} className="relative"><img src={p} alt="" className="h-20 w-full object-cover rounded-lg" /><button type="button" onClick={() => setPhotos(photos.filter((_, j) => j !== i))} className="absolute top-1 right-1 bg-black/60 text-white rounded-full h-6 w-6 text-xs">✕</button></div>)}</div>
          {photos.length < 6 && <PhotoPicker value={null} onChange={(p) => p && setPhotos([...photos, p])} label="Add photo" />}
        </Field>
        <button className="btn-primary w-full">Save Visit</button>
      </form>
    </Modal>
  )
}
