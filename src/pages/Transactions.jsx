import { Link, Navigate, useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useStore } from '../lib/store'
import { PageHeader } from '../components/ui'
import TxList from '../components/TxList'

const T = { sales: ['Sales', 'sale'], expenses: ['Expenses', 'expense'], investments: ['Capital / Investment', 'investment'] }

export default function Transactions() {
  const { farmId, type } = useParams()
  const { visibleFarms, isOwner } = useStore()
  const farm = visibleFarms.find((f) => f.id === farmId)
  if (!farm || !T[type] || (type === 'investments' && !isOwner)) return <Navigate to="/" replace />
  return (
    <div>
      <PageHeader title={T[type][0]} subtitle={farm.name} right={<Link to={`/add/${T[type][1]}?farm=${farmId}`} className="btn-primary btn-sm"><Plus size={18} /> Add</Link>} />
      {type === 'investments' && <p className="text-sm text-gray-600 mb-3 card p-3 bg-blue-50">Capital is money put into the farm (savings, loans). It is <b>not</b> counted as income, so your profit stays real.</p>}
      <TxList type={type} farmId={farmId} />
    </div>
  )
}
