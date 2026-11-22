import { Link } from 'react-router-dom'
import { ChevronRight, LogOut } from 'lucide-react'
import { useStore } from '../lib/store'
import { moreLinks } from '../components/Layout'
import { Logo } from '../components/ui'

export default function More() {
  const { isOwner, logout, user } = useStore()
  const links = isOwner ? moreLinks : moreLinks.filter((l) => !['/workers'].includes(l.to))
  return (
    <div>
      <div className="card p-4 mb-4 flex items-center gap-3">
        <Logo size={48} />
        <div>
          <div className="font-bold text-farm">Zozo Farm App</div>
          <div className="text-sm text-gray-500">Logged in as {user.name} ({user.role})</div>
        </div>
      </div>
      <div className="space-y-2">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="card p-4 flex items-center gap-4">
            <span className="h-11 w-11 rounded-xl bg-farm-pale text-farm flex items-center justify-center"><l.icon size={22} /></span>
            <span className="flex-1"><span className="block font-bold">{l.label}</span><span className="text-sm text-gray-500">{l.desc}</span></span>
            <ChevronRight className="text-gray-400" />
          </Link>
        ))}
        <button onClick={logout} className="card p-4 flex items-center gap-4 w-full text-red-600">
          <span className="h-11 w-11 rounded-xl bg-red-50 flex items-center justify-center"><LogOut size={22} /></span>
          <span className="font-bold">Log out</span>
        </button>
      </div>
    </div>
  )
}
