import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Minus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { useStore } from '../lib/store'
import { PageHeader, SearchBar, Chips, Empty, Modal, Field, Select, useConfirm } from '../components/ui'
import { STOCK_UNITS } from '../lib/constants'
import { matches, clsx } from '../lib/utils'

export default function Inventory() {
  const [sp] = useSearchParams()
  const { state, isOwner, visibleFarms, removeItem, toast } = useStore()
  const [farmId, setFarmId] = useState(sp.get('farm') || '')
  const [q, setQ] = useState('')
  const [show, setShow] = useState('All')
  const [edit, setEdit] = useState(null)
  const [adjust, setAdjust] = useState(null)
  const confirm = useConfirm()
  const ids = visibleFarms.map((f) => f.id)
  const isLow = (i) => Number(i.qty) <= Number(i.lowStock)
  const list = state.inventory
    .filter((i) => ids.includes(i.farmId) && (!farmId || i.farmId === farmId) && (show === 'All' || (show === 'Low Stock' && isLow(i))) && matches(q, i.name, i.unit))
    .sort((a, b) => Number(isLow(b)) - Number(isLow(a)) || a.name.localeCompare(b.name))
  const lowCount = state.inventory.filter((i) => ids.includes(i.farmId) && (!farmId || i.farmId === farmId) && isLow(i)).length
  const farmName = (id) => state.farms.find((f) => f.id === id)?.name

  return (
    <div>
      <PageHeader title="Inventory / Stock" subtitle={farmId ? farmName(farmId) : 'All farms'} right={isOwner && <button className="btn-primary btn-sm" onClick={() => setEdit({})}><Plus size={18} /> Item</button>} />
      {lowCount > 0 && <div className="card p-3 mb-3 bg-red-50 border-red-200 text-red-700 font-semibold flex items-center gap-2"><AlertTriangle size={18} /> {lowCount} item{lowCount > 1 ? 's' : ''} low - time to buy more</div>}
      <div className="space-y-2 mb-4">
        <SearchBar value={q} onChange={setQ} placeholder="Search stock..." />
        <div className="grid grid-cols-2 gap-2 items-center">
          <Select value={farmId} onChange={setFarmId} options={visibleFarms.map((f) => ({ value: f.id, label: f.name }))} placeholder="All farms" />
          <Chips options={['All', 'Low Stock']} value={show} onChange={setShow} />
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-3">When you add an expense (e.g. feed), choose "Add to stock" and the quantity updates automatically.</p>
      {list.length === 0 ? (
        <Empty icon="" title="No stock items" text="Track bags of feed, fertilizer, chemicals, chicks and more." action={isOwner && <button className="btn-primary" onClick={() => setEdit({})}><Plus size={18} /> Add Item</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {list.map((i) => {
            const low = isLow(i)
            const pct = Math.min(100, (Number(i.qty) / Math.max(1, Number(i.lowStock) * 3)) * 100)
            return (
              <div key={i.id} className={clsx('card p-4', low && 'border-red-300 bg-red-50')}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold">{i.name}</div>
                    <div className="text-xs text-gray-500">{farmName(i.farmId)} · alert at {i.lowStock} {i.unit}</div>
                  </div>
                  {isOwner && (
                    <div className="flex">
                      <button onClick={() => setEdit(i)} className="p-2 text-gray-500" aria-label="Edit"><Pencil size={16} /></button>
                      <button onClick={async () => { if (await confirm({ title: 'Delete item?', message: `Delete "${i.name}" from stock?` })) { removeItem(i.id); toast('Item deleted') } }} className="p-2 text-red-500" aria-label="Delete"><Trash2 size={16} /></button>
                    </div>
                  )}
                </div>
                <div className="flex items-end justify-between mt-2">
                  <div className={clsx('text-3xl font-bold', low ? 'text-red-600' : 'text-farm')}>{i.qty} <span className="text-base font-semibold text-gray-500">{i.unit}</span></div>
                  {low && <span className="text-xs font-bold text-white bg-red-600 rounded-full px-2 py-1">LOW STOCK</span>}
                </div>
                <div className="h-2 bg-gray-200 rounded-full mt-2"><div className={clsx('h-full rounded-full', low ? 'bg-red-500' : 'bg-farm-light')} style={{ width: `${pct}%` }} /></div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button onClick={() => setAdjust({ item: i, dir: -1 })} className="btn-ghost btn-sm"><Minus size={16} /> Use</button>
                  <button onClick={() => setAdjust({ item: i, dir: 1 })} className="btn-light btn-sm"><Plus size={16} /> Add</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <ItemForm item={edit} onClose={() => setEdit(null)} defaultFarm={farmId} />
      <AdjustForm data={adjust} onClose={() => setAdjust(null)} />
    </div>
  )
}

function ItemForm({ item, onClose, defaultFarm }) {
  const { visibleFarms, addItem, updateItem, toast } = useStore()
  const [f, setF] = useState(null)
  const [err, setErr] = useState({})
  useEffect(() => {
    setErr({})
    setF(item ? (item.id ? { ...item } : { name: '', farmId: defaultFarm || visibleFarms[0]?.id || '', qty: '', unit: 'bags', lowStock: '' }) : null)
  }, [item]) // eslint-disable-line
  if (!item || !f) return null
  const set = (k) => (e) => setF({ ...f, [k]: e?.target ? e.target.value : e })
  const save = (e) => {
    e.preventDefault()
    const er = {}
    if (!f.name.trim()) er.name = 'Item name is required'
    if (!f.farmId) er.farmId = 'Choose a farm'
    if (f.qty === '' || isNaN(f.qty) || Number(f.qty) < 0) er.qty = 'Enter quantity (0 or more)'
    if (f.lowStock !== '' && (isNaN(f.lowStock) || Number(f.lowStock) < 0)) er.lowStock = 'Enter a number'
    setErr(er)
    if (Object.keys(er).length) return
    const data = { ...f, name: f.name.trim(), qty: Number(f.qty), lowStock: Number(f.lowStock || 0) }
    item.id ? updateItem(item.id, data) : addItem(data)
    toast(item.id ? 'Item updated' : 'Item added')
    onClose()
  }
  return (
    <Modal open onClose={onClose} title={item.id ? 'Edit Stock Item' : 'Add Stock Item'}>
      <form onSubmit={save}>
        <Field label="Item Name *" error={err.name}><input className="input" value={f.name} onChange={set('name')} placeholder="e.g. Bags of Feed, Litres of Chemicals" /></Field>
        <Field label="Farm *" error={err.farmId}><Select value={f.farmId} onChange={set('farmId')} options={visibleFarms.map((x) => ({ value: x.id, label: x.name }))} placeholder="Choose" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity *" error={err.qty}><input className="input" inputMode="decimal" value={f.qty} onChange={set('qty')} /></Field>
          <Field label="Unit"><input className="input" list="units" value={f.unit} onChange={set('unit')} /><datalist id="units">{STOCK_UNITS.map((u) => <option key={u} value={u} />)}</datalist></Field>
        </div>
        <Field label="Low Stock Alert at" error={err.lowStock} hint="You get a warning when stock falls to this level"><input className="input" inputMode="decimal" value={f.lowStock} onChange={set('lowStock')} placeholder="e.g. 5" /></Field>
        <button className="btn-primary w-full">Save Item</button>
      </form>
    </Modal>
  )
}

function AdjustForm({ data, onClose }) {
  const { adjustStock, toast } = useStore()
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState('')
  const [err, setErr] = useState('')
  useEffect(() => { setQty(''); setReason(''); setErr('') }, [data])
  if (!data) return null
  const { item, dir } = data
  const save = (e) => {
    e.preventDefault()
    const n = Number(qty)
    if (!(n > 0)) return setErr('Enter a quantity')
    if (dir < 0 && n > Number(item.qty)) return setErr(`Only ${item.qty} ${item.unit} in stock`)
    adjustStock(item.id, dir * n, reason)
    toast(`${dir < 0 ? 'Used' : 'Added'} ${n} ${item.unit} ${item.name}`)
    onClose()
  }
  return (
    <Modal open onClose={onClose} title={`${dir < 0 ? 'Use' : 'Add'} ${item.name}`}>
      <form onSubmit={save}>
        <p className="mb-3 text-gray-600">In stock now: <b>{item.qty} {item.unit}</b></p>
        <Field label={`Quantity (${item.unit})`} error={err}><input autoFocus className="input text-xl" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
        <Field label="Reason (optional)"><input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={dir < 0 ? 'e.g. fed goats' : 'e.g. donation, stock count'} /></Field>
        <p className="text-xs text-gray-500 mb-3">{dir > 0 ? 'Bought stock? Record it as an Expense instead, so the cost is counted too.' : ''}</p>
        <button className={dir < 0 ? 'btn-earth w-full' : 'btn-primary w-full'}>{dir < 0 ? 'Use Stock' : 'Add Stock'}</button>
      </form>
    </Modal>
  )
}
