import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { PageHeader, Field, Select, PhotoPicker } from '../components/ui'
import { EXPENSE_CATEGORIES, UNITS, PAYMENT_METHODS, CAPITAL_SOURCES, PRODUCT_MAP } from '../lib/constants'
import { today, money, clsx } from '../lib/utils'
import { getImage } from '../lib/db'

const TITLES = { sale: 'Sale', expense: 'Expense', investment: 'Capital / Investment' }
const COLL = { sale: 'sales', expense: 'expenses', investment: 'investments' }

export default function TransactionForm() {
  const { type, id } = useParams()
  return <TransactionFormInner key={`${type}-${id || 'new'}`} />
}

function TransactionFormInner() {
  const { type, id } = useParams()
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const store = useStore()
  const { state, user, isOwner, visibleFarms, toast } = store
  const existing = id ? state[COLL[type]]?.find((x) => x.id === id) : null
  const [f, setF] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [errs, setErrs] = useState({})
  const [again, setAgain] = useState(false)

  useEffect(() => {
    const farmId = existing?.farmId || sp.get('farm') || (visibleFarms.length === 1 ? visibleFarms[0].id : '')
    const projectId = existing?.projectId ?? sp.get('project') ?? ''
    if (existing) {
      setF({ ...existing })
      if (existing.photoId) getImage(existing.photoId).then(setPhoto)
    } else {
      const base = { farmId, projectId, date: today() }
      if (type === 'sale') setF({ ...base, item: '', qty: '', unit: 'kg', unitPrice: '', buyer: '', method: 'Cash' })
      if (type === 'expense') setF({ ...base, category: 'Feed', description: '', amount: '', paidBy: user.name, inventoryItemId: '', inventoryQty: '' })
      if (type === 'investment') setF({ ...base, amount: '', source: 'Owner Savings', note: '' })
    }
  }, [type, id]) // eslint-disable-line

  if (!TITLES[type] || (type === 'investment' && !isOwner) || (id && !isOwner)) return <Navigate to="/" replace />
  if (id && !existing) return <Navigate to="/" replace />
  if (!f) return null

  const set = (k) => (e) => setF({ ...f, [k]: e?.target ? e.target.value : e })
  const projects = state.projects.filter((p) => p.farmId === f.farmId)
  const stockItems = state.inventory.filter((i) => i.farmId === f.farmId)
  const project = projects.find((p) => p.id === f.projectId)
  const suggestions = [...new Set([...(project?.products || []).map((p) => PRODUCT_MAP[p]?.name), ...state.sales.filter((s) => s.farmId === f.farmId).map((s) => s.item)].filter(Boolean))]
  const total = type === 'sale' ? (Number(f.qty) || 0) * (Number(f.unitPrice) || 0) : Number(f.amount) || 0

  const validate = () => {
    const er = {}
    if (!f.farmId) er.farmId = 'Choose a farm'
    if (!f.date) er.date = 'Choose a date'
    if (f.date > today()) er.date = 'Date cannot be in the future'
    if (type === 'sale') {
      if (!f.item.trim()) er.item = 'What did you sell?'
      if (!(Number(f.qty) > 0)) er.qty = 'Enter quantity'
      if (!(Number(f.unitPrice) > 0)) er.unitPrice = 'Enter price'
    } else {
      if (!(Number(f.amount) > 0)) er.amount = 'Enter an amount greater than 0'
    }
    if (type === 'expense' && f.inventoryItemId && !(Number(f.inventoryQty) > 0)) er.inventoryQty = 'How many units to add to stock?'
    setErrs(er)
    return !Object.keys(er).length
  }

  const save = async (e) => {
    e.preventDefault()
    if (!validate()) return
    let photoId = existing?.photoId || null
    if (photo && (!existing?.photoId || photo !== (await getImage(existing.photoId)))) {
      const ph = await store.addPhoto({ dataUrl: photo, kind: 'receipt', farmId: f.farmId, projectId: f.projectId, caption: type === 'sale' ? `Receipt - sale of ${f.item}` : `Receipt - ${f.category || 'capital'} ${f.description || f.note || ''}`.trim() })
      photoId = ph.id
    }
    if (!photo) photoId = null
    const data = { ...f, photoId }
    if (type === 'sale') {
      Object.assign(data, { qty: Number(f.qty), unitPrice: Number(f.unitPrice), item: f.item.trim(), buyer: f.buyer.trim() })
      existing ? store.updateSale(id, data) : store.addSale(data)
    }
    if (type === 'expense') {
      Object.assign(data, { amount: Number(f.amount), inventoryQty: f.inventoryItemId ? Number(f.inventoryQty) : '' })
      existing ? store.updateExpense(id, data) : store.addExpense(data)
    }
    if (type === 'investment') {
      data.amount = Number(f.amount)
      existing ? store.updateInvestment(id, data) : store.addInvestment(data)
    }
    toast(`${TITLES[type]} ${existing ? 'updated' : 'saved'}: ${money(total)}`)
    if (again && !existing) {
      setF({ ...f, item: type === 'sale' ? f.item : f.item, qty: '', amount: '', description: '', note: '', buyer: '', inventoryItemId: '', inventoryQty: '' })
      setPhoto(null)
      window.scrollTo(0, 0)
    } else nav(-1)
  }

  return (
    <div className="max-w-xl mx-auto">
      <PageHeader title={`${existing ? 'Edit' : 'Add'} ${TITLES[type]}`} subtitle={state.farms.find((x) => x.id === f.farmId)?.name} />
      {type === 'investment' && <p className="text-sm card p-3 mb-3 bg-blue-50">Money put INTO the farm (your savings, a loan, family support). This is tracked as <b>Capital</b>, not income.</p>}
      <form onSubmit={save} className="card p-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Farm *" error={errs.farmId}>
            <Select value={f.farmId} onChange={(v) => setF({ ...f, farmId: v, projectId: '', inventoryItemId: '' })} options={visibleFarms.map((x) => ({ value: x.id, label: x.name }))} placeholder="Choose farm" />
          </Field>
          <Field label="Project">
            <Select value={f.projectId} onChange={set('projectId')} options={projects.map((p) => ({ value: p.id, label: p.name }))} placeholder="Whole farm / none" />
          </Field>
        </div>
        <Field label="Date *" error={errs.date}><input type="date" className="input" value={f.date} max={today()} onChange={set('date')} /></Field>

        {type === 'sale' && (
          <>
            <Field label="Item sold *" error={errs.item}>
              <input className="input" list="items" value={f.item} onChange={set('item')} placeholder="e.g. Maize, Goats, Tilapia" />
              <datalist id="items">{suggestions.map((s) => <option key={s} value={s} />)}</datalist>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Quantity *" error={errs.qty}><input className="input" inputMode="decimal" value={f.qty} onChange={set('qty')} placeholder="0" /></Field>
              <Field label="Unit"><Select value={f.unit} onChange={set('unit')} options={UNITS} /></Field>
            </div>
            <Field label={`Price per ${f.unit} (K) *`} error={errs.unitPrice}><input className="input" inputMode="decimal" value={f.unitPrice} onChange={set('unitPrice')} placeholder="0.00" /></Field>
            <div className="rounded-xl bg-farm-pale p-4 mb-3 flex justify-between items-center"><span className="font-semibold">Total</span><span className="text-2xl font-extrabold text-farm">{money(total)}</span></div>
            <Field label="Buyer Name"><input className="input" value={f.buyer} onChange={set('buyer')} placeholder="e.g. Soweto Market trader" /></Field>
            <Field label="Payment Method">
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((m) => <button type="button" key={m} onClick={() => setF({ ...f, method: m })} className={clsx('rounded-xl border-2 py-3 text-sm font-semibold', f.method === m ? 'border-farm bg-farm-pale text-farm' : 'border-gray-200')}>{m === 'Cash' ? '💵' : m === 'Mobile Money' ? '📱' : '🏦'} {m}</button>)}
              </div>
            </Field>
          </>
        )}

        {type === 'expense' && (
          <>
            <Field label="Category">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {EXPENSE_CATEGORIES.map((c) => <button type="button" key={c.id} onClick={() => setF({ ...f, category: c.id })} className={clsx('rounded-xl border-2 py-2 px-1 text-xs font-semibold flex flex-col items-center', f.category === c.id ? 'border-farm bg-farm-pale text-farm' : 'border-gray-200 bg-white')}><span className="text-xl">{c.icon}</span>{c.id}</button>)}
              </div>
            </Field>
            <Field label="Description"><input className="input" value={f.description} onChange={set('description')} placeholder="e.g. 10 bags of goat feed" /></Field>
            <Field label="Amount (K) *" error={errs.amount}><input className="input text-xl font-bold" inputMode="decimal" value={f.amount} onChange={set('amount')} placeholder="0.00" /></Field>
            <Field label="Paid By"><input className="input" list="payers" value={f.paidBy} onChange={set('paidBy')} /><datalist id="payers">{state.users.map((u) => <option key={u.id} value={u.name} />)}</datalist></Field>
            {stockItems.length > 0 && (
              <div className="rounded-xl border border-dashed border-farm-light p-3 mb-3">
                <p className="font-semibold text-sm mb-2">📦 Add to stock (optional)</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2"><Select value={f.inventoryItemId} onChange={set('inventoryItemId')} options={stockItems.map((i) => ({ value: i.id, label: `${i.name} (${i.qty} ${i.unit})` }))} placeholder="Not a stock item" /></div>
                  <input className="input" inputMode="decimal" placeholder="Qty" value={f.inventoryQty} onChange={set('inventoryQty')} disabled={!f.inventoryItemId} />
                </div>
                {errs.inventoryQty && <p className="text-sm text-red-600 mt-1">{errs.inventoryQty}</p>}
                <p className="text-xs text-gray-500 mt-1">Stock level updates automatically when you save.</p>
              </div>
            )}
          </>
        )}

        {type === 'investment' && (
          <>
            <Field label="Amount (K) *" error={errs.amount}><input className="input text-xl font-bold" inputMode="decimal" value={f.amount} onChange={set('amount')} placeholder="0.00" /></Field>
            <Field label="Source"><Select value={f.source} onChange={set('source')} options={CAPITAL_SOURCES} /></Field>
            <Field label="Note"><textarea className="input" rows={2} value={f.note} onChange={set('note')} placeholder="e.g. Bank loan, 12 months at 25%" /></Field>
          </>
        )}

        <Field label="Receipt Photo (optional)"><PhotoPicker value={photo} onChange={setPhoto} label="Take photo of receipt" /></Field>
        {!existing && <label className="flex items-center gap-2 mb-3 text-sm font-medium"><input type="checkbox" className="h-5 w-5 accent-[#1B5E20]" checked={again} onChange={(e) => setAgain(e.target.checked)} /> Add another after saving</label>}
        <button className="btn-primary w-full text-lg">Save {TITLES[type]}</button>
      </form>
    </div>
  )
}
