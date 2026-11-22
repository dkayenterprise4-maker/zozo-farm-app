import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useStore } from './lib/store'
import Layout from './components/Layout'
import { Logo } from './components/ui'
import Auth from './pages/Auth'
import Farms from './pages/Farms'
import WorkerHome from './pages/WorkerHome'
import FarmDashboard from './pages/FarmDashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import TransactionForm from './pages/TransactionForm'
import Transactions from './pages/Transactions'
import Statement from './pages/Statement'
import Assistant from './pages/Assistant'
import Workers from './pages/Workers'
import Inventory from './pages/Inventory'
import Tasks from './pages/Tasks'
import Gallery from './pages/Gallery'
import Visits from './pages/Visits'
import ActivityFeed from './pages/ActivityFeed'
import Settings from './pages/Settings'
import More from './pages/More'

function Splash() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-farm text-white">
      <Logo size={96} className="animate-pulse drop-shadow-xl" />
      <h1 className="mt-5 text-3xl font-extrabold">Zozo Farm App</h1>
      <p className="text-green-200 mt-1">Your Farms, In Your Pocket</p>
    </div>
  )
}

function OwnerOnly({ children }) {
  const { isOwner } = useStore()
  return isOwner ? children : <Navigate to="/" replace />
}

export default function App() {
  const { state, user } = useStore()
  const [minSplash, setMinSplash] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setMinSplash(false), 900)
    return () => clearTimeout(t)
  }, [])

  if (!state || minSplash) return <Splash />
  if (!user) return <Auth />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={user.role === 'owner' ? <Farms /> : <WorkerHome />} />
        <Route path="farm/:farmId" element={<FarmDashboard />} />
        <Route path="farm/:farmId/projects" element={<Projects />} />
        <Route path="farm/:farmId/money/:type" element={<Transactions />} />
        <Route path="project/:projectId" element={<ProjectDetail />} />
        <Route path="add/:type" element={<TransactionForm />} />
        <Route path="edit/:type/:id" element={<TransactionForm />} />
        <Route path="statement" element={<OwnerOnly><Statement /></OwnerOnly>} />
        <Route path="assistant" element={<Assistant />} />
        <Route path="workers" element={<OwnerOnly><Workers /></OwnerOnly>} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="visits" element={<Visits />} />
        <Route path="activity" element={<OwnerOnly><ActivityFeed /></OwnerOnly>} />
        <Route path="settings" element={<Settings />} />
        <Route path="more" element={<More />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
