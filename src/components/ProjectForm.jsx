import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { Field, Modal, Select } from './ui'
import { PRODUCTS, PRODUCT_GROUPS, PROJECT_STATUSES, productNames, isCrop, isFish, isLivestock } from '../lib/constants'
import { rotationCheck } from '../lib/guidance'
import { today, addDays, clsx } from '../lib/utils'
import { AlertTriangle, Lightbulb } from 'lucide-react'

export default function ProjectForm({ open, onClose, farmId, project, onSaved }) {
  const { state, addProject, updateProject, toast } = useStore()
  const [f, setF] = useState(null)
  const [errs, setErrs] = useState({})
  useEffect(() => {
    if (!open) return
    setErrs({})
    setF(project ? { ...project } : { name: '', products: [], field: '', startDate: today(), harvestDate: addDays(today(), 150), status: 'Active', notes: '', customName: '', herd: '', fishCount: '', avgWeight: '' })
  }, [open, project])
  const rot = useMemo(() => (f ? rotationCheck(state, { farmId, field: f.field, products: f.products, startDate: f.startDate, id: project?.id }) : null), [state, f, farmId, project])
  if (!f) return null
  const set = (k) => (e) => setF({ ...f, [k]: e?.target ? e.target.value : e })
  const toggle = (id) => setF({ ...f, products: f.products.includes(id) ? f.products.filter((p) => p !== id) : [...f.products, id] })
  const fields = [...new Set(state.projects.filter((p) => p.farmId === farmId && p.field).map((p) => p.field))]

  const save = (e) => {
    e.preventDefault()
    const er = {}
    if (!f.products.length) er.products = 'Choose at least one product'
    if (f.harvestDate && f.startDate && f.harvestDate < f.startDate) er.harvestDate = 'Harvest date must be after start date'
    setErrs(er)
    if (Object.keys(er).length) return
    const farm = state.farms.find((x) => x.id === farmId)
    const name = f.name.trim() || `${farm.name.split(' - ')[0]} - ${productNames(f.products).replace('Custom Project', f.customName || 'Custom')} Project`
    const data = { ...f, name, farmId, field: f.field.trim() }
    if (project) { updateProject(project.id, data); toast('Project updated') }
    else { const p = addProject(data); toast('Project created'); onSaved?.(p.id) }
    onClose()
  }

  const showCount = f.products.some(isLivestock)
  const showFish = f.products.some(isFish)
  return (
    <Modal open={open} onClose={onClose} title={project ? 'Edit Project' : 'New Project'} wide>
      <form onSubmit={save}>
        <Field label="What will this project produce? (choose one or more)" error={errs.products}>
          {PRODUCT_GROUPS.map((g) => (
            <div key={g} className="mb-2">
              <div className="text-xs font-bold text-gray-500 uppercase mb-1">{g}</div>
              <div className="flex flex-wrap gap-2">
                {PRODUCTS.filter((p) => p.group === g).map((p) => (
                  <button type="button" key={p.id} onClick={() => toggle(p.id)} className={clsx('rounded-xl border-2 px-3 py-2 text-sm font-semibold flex items-center gap-1', f.products.includes(p.id) ? 'border-farm bg-farm-pale text-farm' : 'border-gray-200 bg-white')}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </Field>
        {f.products.includes('custom') && <Field label="Custom product name"><input className="input" value={f.customName} onChange={set('customName')} placeholder="e.g. Sunflower, Bananas, Honey" /></Field>}
        <Field label="Project Name" hint="Leave empty to name it automatically, e.g. 'Farm A - Maize + Goats Project'"><input className="input" value={f.name} onChange={set('name')} placeholder="e.g. Maize Season 2026/27" /></Field>
        {f.products.some(isCrop) || showFish ? (
          <Field label={showFish ? 'Pond name' : 'Field / Plot name'} hint="Used to track crop rotation on the same land">
            <input className="input" list="fields" value={f.field} onChange={set('field')} placeholder={showFish ? 'e.g. Pond 1' : 'e.g. Field 1, Garden by river'} />
            <datalist id="fields">{fields.map((x) => <option key={x} value={x} />)}</datalist>
          </Field>
        ) : null}
        {rot?.warnings.map((w, i) => (
          <div key={i} className="flex gap-2 rounded-xl bg-red-50 border border-red-200 text-red-800 p-3 mb-3 text-sm font-medium"><AlertTriangle size={20} className="shrink-0" />{w}</div>
        ))}
        {rot?.suggestion && <div className="flex gap-2 rounded-xl bg-green-50 border border-green-200 text-green-900 p-3 mb-3 text-sm"><Lightbulb size={20} className="shrink-0" />{rot.suggestion}</div>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Date"><input type="date" className="input" value={f.startDate} onChange={set('startDate')} /></Field>
          <Field label="Expected Harvest" error={errs.harvestDate}><input type="date" className="input" value={f.harvestDate} onChange={set('harvestDate')} /></Field>
        </div>
        <Field label="Status"><Select value={f.status} onChange={set('status')} options={PROJECT_STATUSES} /></Field>
        {showCount && <Field label="Number of animals"><input className="input" inputMode="numeric" value={f.herd} onChange={set('herd')} placeholder="e.g. 30" /></Field>}
        {showFish && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Number of fish"><input className="input" inputMode="numeric" value={f.fishCount} onChange={set('fishCount')} placeholder="e.g. 4000" /></Field>
            <Field label="Average weight (g)"><input className="input" inputMode="numeric" value={f.avgWeight} onChange={set('avgWeight')} placeholder="e.g. 150" /></Field>
          </div>
        )}
        <Field label="Notes"><textarea className="input" rows={2} value={f.notes} onChange={set('notes')} placeholder="Variety, number of animals, size..." /></Field>
        <button className="btn-primary w-full">{project ? 'Save Changes' : 'Create Project'}</button>
      </form>
    </Modal>
  )
}
