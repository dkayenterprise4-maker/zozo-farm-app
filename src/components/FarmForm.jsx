import { useState } from 'react'
import { useStore } from '../lib/store'
import { Field, Modal, PhotoPicker, Select } from './ui'
import { FARM_TYPES, SIZE_UNITS } from '../lib/constants'
import { getImage } from '../lib/db'
import { useEffect } from 'react'

export default function FarmForm({ open, onClose, farm, onSaved }) {
  const { addFarm, updateFarm, storeImage, toast } = useStore()
  const [f, setF] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [errs, setErrs] = useState({})
  useEffect(() => {
    if (!open) return
    setF(farm ? { ...farm } : { name: '', location: '', district: '', size: '', sizeUnit: 'Hectares', type: 'Mixed', notes: '' })
    setErrs({})
    setPhoto(null)
    if (farm?.photoId) getImage(farm.photoId).then(setPhoto)
  }, [open, farm])
  if (!f) return null
  const set = (k) => (e) => setF({ ...f, [k]: e?.target ? e.target.value : e })
  const save = async (e) => {
    e.preventDefault()
    const er = {}
    if (!f.name.trim()) er.name = 'Farm name is required'
    if (!f.location.trim()) er.location = 'Location is required'
    if (f.size !== '' && (isNaN(f.size) || Number(f.size) < 0)) er.size = 'Enter a valid size'
    setErrs(er)
    if (Object.keys(er).length) return
    let photoId = farm?.photoId || null
    if (photo && (!farm || photo !== (await getImage(farm.photoId)))) photoId = await storeImage(photo)
    if (!photo) photoId = null
    const data = { ...f, name: f.name.trim(), location: f.location.trim(), size: f.size === '' ? '' : Number(f.size), photoId }
    // Location changed: forget old coordinates so weather looks up the new place
    if (farm && farm.location !== data.location) { data.lat = null; data.lon = null }
    if (farm) {
      updateFarm(farm.id, data)
      toast('Farm updated')
      onSaved?.(farm.id)
    } else {
      const nf = addFarm(data)
      toast('Farm created')
      onSaved?.(nf.id)
    }
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={farm ? 'Edit Farm' : 'Add New Farm'}>
      <form onSubmit={save}>
        <Field label="Farm Photo"><PhotoPicker value={photo} onChange={setPhoto} label="Take or choose farm photo" /></Field>
        <Field label="Farm Name *" error={errs.name}><input className="input" value={f.name} onChange={set('name')} placeholder="e.g. Farm C - Kafue" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Village / Area *" error={errs.location}><input className="input" value={f.location} onChange={set('location')} placeholder="e.g. Chongwe" /></Field>
          <Field label="District"><input className="input" value={f.district} onChange={set('district')} placeholder="e.g. Lusaka" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Size" error={errs.size}><input className="input" value={f.size} onChange={set('size')} inputMode="decimal" placeholder="e.g. 5" /></Field>
          <Field label="Unit" hint="1 Lima = 0.25 ha"><Select value={f.sizeUnit} onChange={set('sizeUnit')} options={SIZE_UNITS} /></Field>
        </div>
        <Field label="Farm Type"><Select value={f.type} onChange={set('type')} options={FARM_TYPES} /></Field>
        <Field label="Owner Notes"><textarea className="input" rows={3} value={f.notes} onChange={set('notes')} placeholder="Water source, boundaries, important notes..." /></Field>
        <button className="btn-primary w-full">{farm ? 'Save Changes' : 'Create Farm'}</button>
      </form>
    </Modal>
  )
}
