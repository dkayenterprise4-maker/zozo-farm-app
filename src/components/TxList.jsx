import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Trash2, Paperclip } from 'lucide-react'
import { useStore } from '../lib/store'
import { money, fmtDate, matches, periodRange, inRange } from '../lib/utils'
import { CAT_MAP, EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../lib/constants'
import { SearchBar, Chips, Empty, PeriodFilter, Img, Modal, useConfirm } from './ui'

const TITLES = { sales: 'Sales', expenses: 'Expenses', investments: 'Capital / Investment' }
const SINGULAR = { sales: 'sale', expenses: 'expense', investments: 'investment' }

export default function TxList({ type, farmId, projectId, showFilters = true }) {
  const { state, isOwner, removeSale, removeExpense, removeInvestment, toast } = useStore()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('All')
  const [period, setPeriod] = useState('all')
  const [custom, setCustom] = useState({})
  const [photo, setPhoto] = useState(null)
  const confirm = useConfirm()
  const range = periodRange(period, custom)
  const projName = (id) => state.projects.find((p) => p.id === id)?.name
  const userName = (id) => state.users.find((u) => u.id === id)?.name

  let list = state[type].filter((x) => (!farmId || x.farmId === farmId) && (!projectId || x.projectId === projectId) && inRange(x.date, range))
  if (type === 'sales') list = list.filter((x) => (filter === 'All' || x.method === filter) && matches(q, x.item, x.buyer, x.method, projName(x.projectId)))
  if (type === 'expenses') list = list.filter((x) => (filter === 'All' || x.category === filter) && matches(q, x.description, x.category, x.paidBy, projName(x.projectId)))
  if (type === 'investments') list = list.filter((x) => (filter === 'All' || x.source === filter) && matches(q, x.source, x.note))
  list = list.slice().sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0))
  const total = list.reduce((a, x) => a + Number(type === 'sales' ? x.total : x.amount), 0)

  const del = async (x) => {
    if (!(await confirm({ title: `Delete ${SINGULAR[type]}?`, message: `Delete this ${SINGULAR[type]} of ${money(type === 'sales' ? x.total : x.amount)} on ${fmtDate(x.date)}? This cannot be undone.` }))) return
    ;({ sales: removeSale, expenses: removeExpense, investments: removeInvestment })[type](x.id)
    toast('Deleted')
  }

  const filters = type === 'sales' ? ['All', ...PAYMENT_METHODS] : type === 'expenses' ? ['All', ...EXPENSE_CATEGORIES.map((c) => c.id)] : ['All', ...new Set(state.investments.map((i) => i.source))]

  return (
    <div>
      {showFilters && (
        <div className="space-y-2 mb-3">
          <SearchBar value={q} onChange={setQ} placeholder={`Search ${TITLES[type].toLowerCase()}...`} />
          <PeriodFilter period={period} setPeriod={setPeriod} custom={custom} setCustom={setCustom} />
          <Chips options={filters} value={filter} onChange={setFilter} />
        </div>
      )}
      <div className="flex justify-between items-center card px-4 py-3 mb-3 bg-farm-pale">
        <span className="font-semibold text-gray-700">{list.length} records</span>
        <span className="font-extrabold text-farm text-lg">Total {money(total)}</span>
      </div>
      {list.length === 0 ? (
        <Empty icon={type === 'sales' ? '🧺' : type === 'expenses' ? '🧾' : '🏦'} title={`No ${TITLES[type].toLowerCase()} found`} text={q || filter !== 'All' || period !== 'all' ? 'Try changing the search or filters.' : `Tap the button above to add your first ${SINGULAR[type]}.`} />
      ) : (
        <div className="space-y-2">
          {list.map((x) => (
            <div key={x.id} className="card p-3 flex gap-3 items-start">
              <div className="text-2xl w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                {type === 'sales' ? '💰' : type === 'expenses' ? CAT_MAP[x.category]?.icon || '📦' : '🏦'}
              </div>
              <div className="flex-1 min-w-0">
                {type === 'sales' && <><div className="font-bold">{x.qty} {x.unit} {x.item}</div><div className="text-sm text-gray-600">@ {money(x.unitPrice)} · {x.buyer || 'No buyer name'} · {x.method}</div></>}
                {type === 'expenses' && <><div className="font-bold">{x.category}</div><div className="text-sm text-gray-600 break-words">{x.description || '-'}{x.paidBy ? ` · Paid by ${x.paidBy}` : ''}</div>{x.inventoryItemId && <div className="text-xs text-farm">+{x.inventoryQty} added to stock</div>}</>}
                {type === 'investments' && <><div className="font-bold">{x.source}</div><div className="text-sm text-gray-600 break-words">{x.note || '-'}</div></>}
                <div className="text-xs text-gray-400 mt-0.5">{fmtDate(x.date)}{!projectId && projName(x.projectId) ? ` · ${projName(x.projectId)}` : ''}{userName(x.createdBy) ? ` · by ${userName(x.createdBy)}` : ''}</div>
              </div>
              <div className="text-right shrink-0">
                <div className={`font-extrabold ${type === 'expenses' ? 'text-earth' : 'text-farm'}`}>{type === 'expenses' ? '-' : ''}{money(type === 'sales' ? x.total : x.amount)}</div>
                <div className="flex gap-1 justify-end mt-1">
                  {x.photoId && <button onClick={() => setPhoto(x.photoId)} className="p-2 text-gray-500" aria-label="View receipt"><Paperclip size={16} /></button>}
                  {isOwner && <Link to={`/edit/${SINGULAR[type]}/${x.id}`} className="p-2 text-gray-500" aria-label="Edit"><Pencil size={16} /></Link>}
                  {isOwner && <button onClick={() => del(x)} className="p-2 text-red-500" aria-label="Delete"><Trash2 size={16} /></button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!photo} onClose={() => setPhoto(null)} title="Receipt Photo">
        <Img id={photo} className="w-full rounded-xl" />
      </Modal>
    </div>
  )
}
