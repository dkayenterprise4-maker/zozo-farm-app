import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Trash2, Lightbulb, Sparkles, Loader2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { PageHeader, SearchBar, Chips, Empty, Modal, Field, Select, PhotoPicker, Img, useConfirm, Badge } from '../components/ui'
import { PHOTO_KINDS } from '../lib/constants'
import { SYMPTOMS, diagnose } from '../lib/knowledge'
import { aiAnswer } from '../lib/assistant'
import { getImage } from '../lib/db'
import { fmtDate, matches, today, clsx } from '../lib/utils'

export default function Gallery() {
  const [sp, setSp] = useSearchParams()
  const { state, isOwner, visibleFarms, removePhoto, toast } = useStore()
  const [farmId, setFarmId] = useState(sp.get('farm') || '')
  const [projectId, setProjectId] = useState(sp.get('project') || '')
  const [kind, setKind] = useState('all')
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(sp.get('add') === '1')
  const [view, setView] = useState(null)
  const confirm = useConfirm()
  const ids = visibleFarms.map((f) => f.id)
  const list = state.photos.filter((p) => ids.includes(p.farmId) && (!farmId || p.farmId === farmId) && (!projectId || p.projectId === projectId) && (kind === 'all' || p.kind === kind) && matches(q, p.caption, p.kind, p.suggestion))
  const farmName = (id) => state.farms.find((f) => f.id === id)?.name
  const projName = (id) => state.projects.find((p) => p.id === id)?.name
  const closeAdd = () => { setAdding(false); if (sp.get('add')) { sp.delete('add'); setSp(sp, { replace: true }) } }

  return (
    <div>
      <PageHeader title="Photo Gallery" subtitle={farmId ? farmName(farmId) : 'All farms'} right={<button className="btn-primary btn-sm" onClick={() => setAdding(true)}><Plus size={18} /> Photo</button>} />
      <div className="space-y-2 mb-4">
        <SearchBar value={q} onChange={setQ} placeholder="Search captions..." />
        <div className="grid grid-cols-2 gap-2">
          <Select value={farmId} onChange={(v) => { setFarmId(v); setProjectId('') }} options={visibleFarms.map((f) => ({ value: f.id, label: f.name }))} placeholder="All farms" />
          <Select value={projectId} onChange={setProjectId} options={state.projects.filter((p) => !farmId || p.farmId === farmId).map((p) => ({ value: p.id, label: p.name }))} placeholder="All projects" />
        </div>
        <Chips options={[{ id: 'all', label: 'All' }, ...PHOTO_KINDS]} value={kind} onChange={setKind} />
      </div>
      {list.length === 0 ? (
        <Empty icon="📷" title="No photos yet" text="Take photos of your farm, receipts, visits and problems like sick plants or broken fences. For problems, you get suggestions on the cause and what to do." action={<button className="btn-primary" onClick={() => setAdding(true)}><Plus size={18} /> Add Photo</button>} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {list.map((p) => (
            <button key={p.id} onClick={() => setView(p)} className="card overflow-hidden text-left">
              <div className="relative">
                <Img id={p.id} className="w-full h-36 object-cover" fallback={<div className="h-36 bg-gray-100" />} />
                <span className="absolute top-1 left-1"><Badge tone={p.kind === 'problem' ? 'red' : p.kind === 'receipt' ? 'brown' : 'green'}>{PHOTO_KINDS.find((k) => k.id === p.kind)?.label}</Badge></span>
              </div>
              <div className="p-2">
                <div className="text-sm font-medium truncate">{p.caption || 'No caption'}</div>
                <div className="text-xs text-gray-500 truncate">{fmtDate(p.date)} · {farmName(p.farmId)?.split(' - ')[0]}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal open={!!view} onClose={() => setView(null)} title={view?.caption || 'Photo'}>
        {view && (
          <div>
            <Img id={view.id} className="w-full rounded-xl mb-3" />
            <div className="text-sm text-gray-600 space-y-1 mb-3">
              <p><b>Type:</b> {PHOTO_KINDS.find((k) => k.id === view.kind)?.label} · <b>Date:</b> {fmtDate(view.date)}</p>
              <p><b>Farm:</b> {farmName(view.farmId)}{view.projectId ? ` · ${projName(view.projectId)}` : ''}</p>
              {view.symptoms?.length > 0 && <p><b>Symptoms:</b> {view.symptoms.map((s) => SYMPTOMS.find((x) => x.id === s)?.label).join(', ')}</p>}
            </div>
            {view.suggestion && <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm whitespace-pre-line mb-3"><div className="font-bold flex items-center gap-1 mb-1"><Lightbulb size={16} /> Possible cause & action</div>{view.suggestion}</div>}
            {isOwner && <button className="btn-danger w-full" onClick={async () => { if (await confirm({ title: 'Delete photo?', message: 'This photo will be permanently deleted.' })) { await removePhoto(view.id); setView(null); toast('Photo deleted') } }}><Trash2 size={18} /> Delete Photo</button>}
          </div>
        )}
      </Modal>

      <AddPhoto open={adding} onClose={closeAdd} defaultFarm={farmId || sp.get('farm')} defaultProject={projectId || sp.get('project')} onAdded={(p) => p.suggestion && setView(p)} />
    </div>
  )
}

function AddPhoto({ open, onClose, defaultFarm, defaultProject, onAdded }) {
  const { state, user, visibleFarms, addPhoto, toast, online } = useStore()
  const [f, setF] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [err, setErr] = useState({})
  const [busy, setBusy] = useState(false)
  const [aiTip, setAiTip] = useState('')
  useEffect(() => {
    if (open) { setF({ kind: 'problem', caption: '', farmId: defaultFarm || visibleFarms[0]?.id || '', projectId: defaultProject || '', date: today(), symptoms: [] }); setPhoto(null); setErr({}); setAiTip('') }
  }, [open]) // eslint-disable-line
  if (!open || !f) return null
  const set = (k) => (e) => setF({ ...f, [k]: e?.target ? e.target.value : e })
  const toggleSym = (id) => setF({ ...f, symptoms: f.symptoms.includes(id) ? f.symptoms.filter((x) => x !== id) : [...f.symptoms, id] })
  const suggestion = f.kind === 'problem' ? diagnose(f.caption, f.symptoms) : ''
  const askAI = async () => {
    setBusy(true)
    try {
      setAiTip(await aiAnswer(state, user, [], `This is a photo of a problem on my farm. ${f.caption ? 'Description: ' + f.caption + '.' : ''} What is the likely cause and what should I do? Keep it short.`, photo))
    } catch (e) { toast('AI failed: ' + e.message, 'bad') } finally { setBusy(false) }
  }
  const save = async (e) => {
    e.preventDefault()
    const er = {}
    if (!photo) er.photo = 'Take or choose a photo'
    if (!f.farmId) er.farmId = 'Choose a farm'
    setErr(er)
    if (Object.keys(er).length) return
    setBusy(true)
    const p = await addPhoto({ ...f, dataUrl: photo, caption: f.caption.trim(), suggestion: f.kind === 'problem' ? (aiTip || suggestion) : '' })
    setBusy(false)
    toast('Photo saved')
    onClose()
    onAdded?.(p)
  }
  return (
    <Modal open onClose={onClose} title="Add Photo">
      <form onSubmit={save}>
        <Field error={err.photo}><PhotoPicker value={photo} onChange={setPhoto} label="Take photo or choose from gallery" /></Field>
        <Field label="Photo type"><Chips options={PHOTO_KINDS} value={f.kind} onChange={set('kind')} /></Field>
        <Field label="Caption"><input className="input" value={f.caption} onChange={set('caption')} placeholder={f.kind === 'problem' ? 'e.g. Yellow leaves on maize in Field 1' : 'e.g. Goats grazing'} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Farm *" error={err.farmId}><Select value={f.farmId} onChange={(v) => setF({ ...f, farmId: v, projectId: '' })} options={visibleFarms.map((x) => ({ value: x.id, label: x.name }))} placeholder="Choose" /></Field>
          <Field label="Project"><Select value={f.projectId} onChange={set('projectId')} options={state.projects.filter((p) => p.farmId === f.farmId).map((p) => ({ value: p.id, label: p.name }))} placeholder="None" /></Field>
        </div>
        <Field label="Date"><input type="date" className="input" value={f.date} max={today()} onChange={set('date')} /></Field>
        {f.kind === 'problem' && (
          <>
            <Field label="What do you see? (tap all that apply)">
              <div className="flex flex-wrap gap-2">{SYMPTOMS.map((s) => <button type="button" key={s.id} onClick={() => toggleSym(s.id)} className={f.symptoms.includes(s.id) ? 'chip-on' : 'chip-off'}>{s.label}</button>)}</div>
            </Field>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm whitespace-pre-line mb-3">
              <div className="font-bold flex items-center gap-1 mb-1"><Lightbulb size={16} /> Smart suggestion</div>
              {aiTip || suggestion}
            </div>
            {state.settings.apiKey && online && photo && (
              <button type="button" onClick={askAI} disabled={busy} className="btn-earth btn-sm w-full mb-3">{busy ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} Ask AI to check the photo</button>
            )}
          </>
        )}
        <button className={clsx('btn-primary w-full')} disabled={busy}>Save Photo</button>
      </form>
    </Modal>
  )
}
