import { useRef, useState } from 'react'
import { User, Lock, KeyRound, Download, Upload, Trash2, RotateCcw, Sparkles, Cloud, Bell, LogOut, Loader2 } from 'lucide-react'
import { PHOTO_CREDITS } from '../lib/photos'
import { useStore } from '../lib/store'
import { PageHeader, Field, useConfirm } from '../components/ui'
import { exportAllData } from '../lib/exports'
import { allImages, saveImage } from '../lib/db'
import { fmtDateTime } from '../lib/utils'

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card p-4 mb-4">
      <h2 className="section-title flex items-center gap-2 mb-3"><Icon size={20} className="text-farm" /> {title}</h2>
      {children}
    </div>
  )
}

export default function Settings() {
  const s = useStore()
  const { state, user, isOwner, toast } = s
  const confirm = useConfirm()
  const [profile, setProfile] = useState({ name: user.name, phone: user.phone || '', email: user.email || '' })
  const [pw, setPw] = useState({ old: '', next: '', confirm: '' })
  const [pwErr, setPwErr] = useState('')
  const [pin, setPin] = useState('')
  const [apiKey, setApiKey] = useState(state.settings.apiKey || '')
  const [sb, setSb] = useState({ url: state.settings.supabaseUrl || '', key: state.settings.supabaseKey || '' })
  const [busy, setBusy] = useState('')
  const fileRef = useRef()

  const saveProfile = (e) => {
    e.preventDefault()
    if (!profile.name.trim()) return toast('Name cannot be empty', 'bad')
    s.updateProfile({ name: profile.name.trim(), phone: profile.phone.trim(), email: profile.email.trim() })
    toast('Profile saved')
  }
  const changePw = async (e) => {
    e.preventDefault()
    setPwErr('')
    if (pw.next.length < 6) return setPwErr('New password must be at least 6 characters')
    if (pw.next !== pw.confirm) return setPwErr('New passwords do not match')
    try { await s.changePassword(pw.old, pw.next); setPw({ old: '', next: '', confirm: '' }); toast('Password changed') } catch (x) { setPwErr(x.message) }
  }
  const savePin = async (e) => {
    e.preventDefault()
    if (!/^\d{4}$/.test(pin)) return toast('PIN must be 4 numbers', 'bad')
    await s.setPin(pin)
    setPin('')
    toast('PIN saved. You can now use PIN Login.')
  }
  const backup = async () => {
    setBusy('backup')
    try { await exportAllData(state, await allImages()); toast('Backup file downloaded') } finally { setBusy('') }
  }
  const restore = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const data = JSON.parse(await f.text())
      if (data.app !== 'Zozo Farm App' || !data.state) throw new Error('This is not a Zozo Farm backup file')
      if (!(await confirm({ title: 'Restore backup?', message: `This will REPLACE all data on this phone with the backup from ${fmtDateTime(data.exportedAt)}.`, confirmText: 'Restore' }))) return
      for (const [id, url] of Object.entries(data.images || {})) await saveImage(id, url)
      s.replaceAll(data.state)
      toast('Backup restored')
    } catch (x) { toast('Restore failed: ' + x.message, 'bad') }
  }
  const exportCsv = () => {
    const rows = [['Type', 'Date', 'Farm', 'Project', 'Item/Category', 'Description', 'Quantity', 'Unit Price', 'Amount', 'Buyer/Paid By', 'Payment']]
    const fn = (id) => state.farms.find((f) => f.id === id)?.name || ''
    const pn = (id) => state.projects.find((p) => p.id === id)?.name || ''
    state.sales.forEach((x) => rows.push(['Sale', x.date, fn(x.farmId), pn(x.projectId), x.item, '', x.qty + ' ' + x.unit, x.unitPrice, x.total, x.buyer, x.method]))
    state.expenses.forEach((x) => rows.push(['Expense', x.date, fn(x.farmId), pn(x.projectId), x.category, x.description, '', '', x.amount, x.paidBy, '']))
    state.investments.forEach((x) => rows.push(['Capital', x.date, fn(x.farmId), pn(x.projectId), x.source, x.note, '', '', x.amount, '', '']))
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'Zozo_All_Transactions.csv'
    a.click()
  }
  const enableNotify = async () => {
    if (!('Notification' in window)) return toast('This browser does not support notifications', 'bad')
    const p = await Notification.requestPermission()
    s.setSettings({ notifyEnabled: p === 'granted' })
    toast(p === 'granted' ? 'Notifications on' : 'Notifications blocked in browser settings', p === 'granted' ? 'good' : 'bad')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Settings" />
      <Section icon={User} title="Profile">
        <form onSubmit={saveProfile}>
          <Field label="Name"><input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone"><input className="input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} inputMode="tel" /></Field>
            <Field label="Email"><input className="input" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} inputMode="email" /></Field>
          </div>
          <p className="text-sm text-gray-500 mb-3">Role: <b className="capitalize">{user.role}</b></p>
          <button className="btn-primary w-full">Save Profile</button>
        </form>
      </Section>

      <Section icon={Lock} title="Change Password">
        <form onSubmit={changePw}>
          <Field label="Current password"><input className="input" type="password" value={pw.old} onChange={(e) => setPw({ ...pw, old: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="New password"><input className="input" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
            <Field label="Confirm"><input className="input" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
          </div>
          {pwErr && <p className="text-red-600 mb-3">{pwErr}</p>}
          <button className="btn-outline w-full">Change Password</button>
        </form>
      </Section>

      <Section icon={KeyRound} title="Quick PIN Login">
        <form onSubmit={savePin} className="flex gap-2">
          <input className="input" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} maxLength={4} inputMode="numeric" placeholder="New 4-digit PIN" />
          <button className="btn-outline shrink-0">Set PIN</button>
        </form>
      </Section>

      <Section icon={Bell} title="Notifications">
        <p className="text-sm text-gray-600 mb-3">In-app alerts (bell icon) always work. You can also allow phone notifications for overdue tasks and low stock.</p>
        <button onClick={enableNotify} className="btn-outline w-full">{state.settings.notifyEnabled ? 'Phone notifications are on' : 'Turn on phone notifications'}</button>
      </Section>

      {isOwner && (
        <>
          <Section icon={Sparkles} title="Smart AI (optional)">
            <p className="text-sm text-gray-600 mb-3">The assistant works offline with built-in farming knowledge and your data. Add a Claude API key (from console.anthropic.com) for smarter answers and photo analysis when online. The key is stored only on this phone.</p>
            <div className="flex gap-2">
              <input className="input" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-ant-..." />
              <button className="btn-primary shrink-0" onClick={() => { s.setSettings({ apiKey: apiKey.trim() }); toast(apiKey.trim() ? 'AI key saved' : 'AI key removed') }}>Save</button>
            </div>
          </Section>

          <Section icon={Cloud} title="Cloud Sync (optional)">
            <p className="text-sm text-gray-600 mb-3">All data is saved on this phone first and works offline. To share data between phones (owner + workers), connect a free Supabase project. Sync runs automatically when online. See the README for the 1-minute setup.</p>
            <Field label="Supabase URL"><input className="input" value={sb.url} onChange={(e) => setSb({ ...sb, url: e.target.value })} placeholder="https://xxxx.supabase.co" /></Field>
            <Field label="Supabase anon key"><input className="input" type="password" value={sb.key} onChange={(e) => setSb({ ...sb, key: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-outline" onClick={() => { s.setSettings({ supabaseUrl: sb.url.trim(), supabaseKey: sb.key.trim() }); toast('Cloud settings saved') }}>Save</button>
              <button className="btn-primary" disabled={s.syncing} onClick={() => s.sync()}>{s.syncing && <Loader2 className="animate-spin" size={16} />} Sync Now</button>
            </div>
            <p className="text-xs text-gray-500 mt-2">{state.settings.lastSync ? `Last synced ${fmtDateTime(state.settings.lastSync)}` : 'Never synced'} · {state.dirty || 0} change(s) since last sync</p>
          </Section>

          <Section icon={Download} title="Export & Backup">
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-primary" onClick={backup} disabled={busy === 'backup'}>{busy === 'backup' ? <Loader2 className="animate-spin" size={16} /> : <Download size={18} />} Full Backup</button>
              <button className="btn-outline" onClick={() => fileRef.current.click()}><Upload size={18} /> Restore</button>
              <button className="btn-ghost col-span-2" onClick={exportCsv}><Download size={18} /> All transactions (CSV / Excel)</button>
            </div>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={restore} />
            <p className="text-xs text-gray-500 mt-2">Backup saves everything (including photos) in one file. Keep it on Google Drive or WhatsApp it to yourself.</p>
          </Section>

          <Section icon={Trash2} title="Delete Data">
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-ghost" onClick={async () => { if (await confirm({ title: 'Reset to demo data?', message: 'All your data will be replaced with the demo farms. Make a backup first if needed.', confirmText: 'Reset' })) { await s.resetDemo(); toast('Demo data loaded') } }}><RotateCcw size={18} /> Load Demo Data</button>
              <button className="btn-danger" onClick={async () => { if (await confirm({ title: 'Delete ALL data?', message: 'This deletes all farms, projects, money records, photos and workers on this phone. Only your own login stays.\n\nThis cannot be undone!', confirmText: 'Delete All' })) { await s.deleteAll(); toast('All data deleted') } }}><Trash2 size={18} /> Delete All</button>
            </div>
          </Section>
        </>
      )}

      <button className="btn-ghost w-full text-red-600 mb-4" onClick={s.logout}><LogOut size={18} /> Log Out</button>
      <details className="mb-4 text-xs text-gray-500">
        <summary className="cursor-pointer font-semibold">Photo credits</summary>
        <p className="mt-2">Photos from Wikimedia Commons, used under their free licences:</p>
        <ul className="mt-1 space-y-0.5">{PHOTO_CREDITS.map(([k, t, a, l]) => <li key={k}>{t}, by {a} ({l})</li>)}</ul>
      </details>
      <p className="text-center text-xs text-gray-400">Zozo Farm App v1.1</p>
    </div>
  )
}
