import { useState } from 'react'
import { useStore } from '../lib/store'
import { Logo, Field } from '../components/ui'
import { clsx } from '../lib/utils'
import { Delete, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function Auth() {
  const [mode, setMode] = useState('login') // login | pin | signup
  return (
    <div className="min-h-screen bg-gradient-to-b from-farm to-farm-dark flex flex-col">
      <div className="flex flex-col items-center pt-10 pb-6 text-white">
        <Logo size={72} className="drop-shadow-lg" />
        <h1 className="text-3xl font-extrabold mt-3">Zozo Farm App</h1>
        <p className="text-green-200">Your Farms, In Your Pocket</p>
      </div>
      <div className="flex-1 bg-page rounded-t-[2rem] px-4 pt-6 pb-10">
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-3 bg-white rounded-2xl p-1 border mb-6">
            {[['login', 'Email Login'], ['pin', 'PIN Login'], ['signup', 'Sign Up']].map(([m, l]) => (
              <button key={m} onClick={() => setMode(m)} className={clsx('rounded-xl py-3 text-sm font-bold', mode === m ? 'bg-farm text-white' : 'text-gray-600')}>{l}</button>
            ))}
          </div>
          {mode === 'login' && <Login />}
          {mode === 'pin' && <PinLogin />}
          {mode === 'signup' && <Signup />}
        </div>
      </div>
    </div>
  )
}

function Login() {
  const { login } = useStore()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!email || !pw) return setErr('Enter your email (or phone) and password')
    setBusy(true)
    try { await login(email, pw) } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  const demo = (em) => { setEmail(em); setPw('123456') }
  return (
    <form onSubmit={submit}>
      <Field label="Email or Phone"><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="zozo@gmail.com" autoComplete="username" inputMode="email" /></Field>
      <Field label="Password">
        <div className="relative">
          <input className="input pr-12" type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" autoComplete="current-password" />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500" aria-label="Show password">{show ? <EyeOff size={20} /> : <Eye size={20} />}</button>
        </div>
      </Field>
      {err && <p className="text-red-600 font-medium mb-3">{err}</p>}
      <button className="btn-primary w-full text-lg" disabled={busy}>{busy && <Loader2 className="animate-spin" size={18} />} Log In</button>
      <div className="mt-6 card p-4">
        <p className="font-bold text-gray-800 mb-2">Demo accounts (password 123456, PIN 1234)</p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn-light btn-sm" onClick={() => demo('zozo@gmail.com')}>👑 Owner (Zozo)</button>
          <button type="button" className="btn-light btn-sm" onClick={() => demo('worker@gmail.com')}>👷 Worker (John)</button>
        </div>
      </div>
    </form>
  )
}

function PinLogin() {
  const { state, loginPin } = useStore()
  const users = state.users.filter((u) => u.pin)
  const [uid, setUid] = useState(users[0]?.id || '')
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')
  const press = async (d) => {
    setErr('')
    const next = (pin + d).slice(0, 4)
    setPin(next)
    if (next.length === 4) {
      try { await loginPin(uid, next) } catch (x) { setErr(x.message); setTimeout(() => setPin(''), 400) }
    }
  }
  if (!users.length) return <p className="text-center text-gray-600">No PIN set yet. Log in with email and set a PIN in Settings.</p>
  return (
    <div>
      <p className="label">Who is using the phone?</p>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
        {users.map((u) => (
          <button key={u.id} onClick={() => { setUid(u.id); setPin(''); setErr('') }} className={clsx('flex flex-col items-center gap-1 rounded-2xl px-3 py-2 min-w-[84px] border-2', uid === u.id ? 'border-farm bg-farm-pale' : 'border-transparent bg-white')}>
            <span className="h-11 w-11 rounded-full bg-farm text-white flex items-center justify-center font-bold text-lg">{u.name[0]}</span>
            <span className="text-xs font-semibold truncate max-w-[76px]">{u.name.split(' ')[0]}</span>
            <span className="text-[10px] text-gray-500 capitalize">{u.role}</span>
          </button>
        ))}
      </div>
      <div className="flex justify-center gap-4 mb-2">
        {[0, 1, 2, 3].map((i) => <span key={i} className={clsx('h-4 w-4 rounded-full', i < pin.length ? 'bg-farm' : 'bg-gray-300')} />)}
      </div>
      <p className="text-center text-red-600 font-medium h-6">{err}</p>
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <button key={n} onClick={() => press(String(n))} className="h-16 rounded-2xl bg-white border text-2xl font-bold active:bg-farm-pale">{n}</button>)}
        <span />
        <button onClick={() => press('0')} className="h-16 rounded-2xl bg-white border text-2xl font-bold active:bg-farm-pale">0</button>
        <button onClick={() => setPin(pin.slice(0, -1))} className="h-16 rounded-2xl bg-white border flex items-center justify-center active:bg-gray-100" aria-label="Delete"><Delete /></button>
      </div>
    </div>
  )
}

function Signup() {
  const { signup } = useStore()
  const [f, setF] = useState({ name: '', phone: '', email: '', password: '', confirm: '', role: 'owner', pin: '' })
  const [errs, setErrs] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault()
    const er = {}
    if (f.name.trim().length < 2) er.name = 'Enter your name'
    if (!/^[0-9+\s]{9,15}$/.test(f.phone.trim())) er.phone = 'Enter a valid phone number e.g. 0977 123 456'
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Email looks wrong'
    if (f.password.length < 6) er.password = 'At least 6 characters'
    if (f.password !== f.confirm) er.confirm = 'Passwords do not match'
    if (f.pin && !/^\d{4}$/.test(f.pin)) er.pin = 'PIN must be 4 numbers'
    setErrs(er)
    if (Object.keys(er).length) return
    setBusy(true)
    try { await signup({ ...f, name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim() }) } catch (x) { setErrs({ form: x.message }) } finally { setBusy(false) }
  }
  return (
    <form onSubmit={submit}>
      <Field label="Full Name" error={errs.name}><input className="input" value={f.name} onChange={set('name')} placeholder="e.g. Zozo Mwale" /></Field>
      <Field label="Phone Number" error={errs.phone}><input className="input" value={f.phone} onChange={set('phone')} placeholder="0977 123 456" inputMode="tel" /></Field>
      <Field label="Email (optional)" error={errs.email}><input className="input" value={f.email} onChange={set('email')} placeholder="name@gmail.com" inputMode="email" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Password" error={errs.password}><input className="input" type="password" value={f.password} onChange={set('password')} /></Field>
        <Field label="Confirm" error={errs.confirm}><input className="input" type="password" value={f.confirm} onChange={set('confirm')} /></Field>
      </div>
      <Field label="Role">
        <div className="grid grid-cols-2 gap-2">
          {[['owner', '👑 Owner', 'Full access'], ['worker', '👷 Worker', 'Add records only']].map(([r, l, d]) => (
            <button type="button" key={r} onClick={() => setF({ ...f, role: r })} className={clsx('rounded-xl border-2 p-3 text-left', f.role === r ? 'border-farm bg-farm-pale' : 'border-gray-200 bg-white')}>
              <div className="font-bold">{l}</div><div className="text-xs text-gray-500">{d}</div>
            </button>
          ))}
        </div>
      </Field>
      <Field label="4-digit PIN for quick login (optional)" error={errs.pin}><input className="input" value={f.pin} onChange={set('pin')} maxLength={4} inputMode="numeric" placeholder="1234" /></Field>
      {errs.form && <p className="text-red-600 font-medium mb-3">{errs.form}</p>}
      {f.role === 'worker' && <p className="text-sm text-gray-600 mb-3">The owner will assign you to farms in the Workers page.</p>}
      <button className="btn-primary w-full text-lg" disabled={busy}>Create Account</button>
    </form>
  )
}
