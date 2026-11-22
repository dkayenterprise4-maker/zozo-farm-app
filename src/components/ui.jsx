import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, Search, X, ImagePlus, Loader2 } from 'lucide-react'
import { getImage, compressImage } from '../lib/db'
import { PERIODS, clsx, fmtDate } from '../lib/utils'

export function Logo({ size = 40, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={className} aria-label="Zozo Farm logo">
      <rect width="512" height="512" rx="112" fill="#1B5E20" />
      <path d="M256 70c-110 60-170 150-160 250 6 60 50 112 120 122 20-90 60-160 130-220-60 70-90 140-100 225 110-10 170-110 150-230C385 135 330 95 256 70z" fill="#4CAF50" />
      <text x="256" y="350" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="230" textAnchor="middle" fill="#fff">Z</text>
    </svg>
  )
}

export function PageHeader({ title, subtitle, back = true, right, onBack }) {
  const nav = useNavigate()
  return (
    <div className="flex items-center gap-2 mb-4">
      {back && (
        <button onClick={() => (onBack ? onBack() : nav(-1))} className="h-11 w-11 shrink-0 rounded-xl bg-white border border-gray-200 flex items-center justify-center active:scale-95" aria-label="Back">
          <ArrowLeft size={22} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 truncate">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 truncate">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return
    const k = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', k)
      document.body.style.overflow = ''
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={clsx('bg-page w-full max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl animate-pop', wide ? 'sm:max-w-2xl' : 'sm:max-w-lg')}>
        <div className="sticky top-0 z-10 flex items-center justify-between bg-page/95 backdrop-blur px-4 pt-4 pb-2">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="h-10 w-10 rounded-full bg-white border flex items-center justify-center" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="px-4 pb-6 safe-bottom">{children}</div>
      </div>
    </div>
  )
}

// ---- Confirm dialog (before delete etc.) ----
const ConfirmCtx = createContext(null)
export function ConfirmProvider({ children }) {
  const [req, setReq] = useState(null)
  const confirm = (opts) => new Promise((resolve) => setReq({ ...opts, resolve }))
  const close = (v) => {
    req?.resolve(v)
    setReq(null)
  }
  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {req && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-sm p-5 animate-pop">
            <h3 className="text-lg font-bold mb-2">{req.title || 'Are you sure?'}</h3>
            <p className="text-gray-600 mb-5 whitespace-pre-line">{req.message}</p>
            <div className="grid grid-cols-2 gap-3">
              <button className="btn-ghost" onClick={() => close(false)}>Cancel</button>
              <button className={req.danger === false ? 'btn-primary' : 'btn-danger'} onClick={() => close(true)}>{req.confirmText || 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  )
}
export const useConfirm = () => useContext(ConfirmCtx)

export function Field({ label, error, children, hint }) {
  return (
    <label className="block mb-3">
      {label && <span className="label">{label}</span>}
      {children}
      {hint && !error && <span className="text-xs text-gray-500 mt-1 block">{hint}</span>}
      {error && <span className="text-sm text-red-600 mt-1 block">{error}</span>}
    </label>
  )
}

export function Empty({ icon = '🌱', title, text, action }) {
  return (
    <div className="card p-8 text-center">
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="font-bold text-lg text-gray-800">{title}</h3>
      {text && <p className="text-gray-500 mt-1 mb-4">{text}</p>}
      {action}
    </div>
  )
}

export function Stat({ label, value, tone = 'default', sub, icon }) {
  const tones = {
    default: 'bg-white text-gray-900',
    green: 'bg-farm text-white',
    light: 'bg-farm-light text-white',
    earth: 'bg-earth text-white',
    red: 'bg-red-600 text-white',
    pale: 'bg-farm-pale text-farm'
  }
  return (
    <div className={clsx('rounded-2xl p-3 sm:p-4 shadow-sm', tones[tone])}>
      <div className="text-xs sm:text-sm opacity-80 flex items-center gap-1">{icon}{label}</div>
      <div className="text-lg sm:text-2xl font-extrabold mt-0.5 break-words">{value}</div>
      {sub && <div className="text-xs opacity-80 mt-0.5">{sub}</div>}
    </div>
  )
}

export function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative">
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input className="input pl-10 pr-10" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type="search" />
      {value && (
        <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400" onClick={() => onChange('')} aria-label="Clear search">
          <X size={16} />
        </button>
      )}
    </div>
  )
}

export function Chips({ options, value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {options.map((o) => {
        const id = typeof o === 'string' ? o : o.id
        const label = typeof o === 'string' ? o : o.label
        return (
          <button key={id} type="button" onClick={() => onChange(id)} className={value === id ? 'chip-on' : 'chip-off'}>
            {label}
          </button>
        )
      })}
    </div>
  )
}

export function PeriodFilter({ period, setPeriod, custom, setCustom, exclude = [] }) {
  return (
    <div className="space-y-2">
      <Chips options={PERIODS.filter((p) => !exclude.includes(p.id))} value={period} onChange={setPeriod} />
      {period === 'custom' && (
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm">From<input type="date" className="input" value={custom.from || ''} onChange={(e) => setCustom({ ...custom, from: e.target.value })} /></label>
          <label className="text-sm">To<input type="date" className="input" value={custom.to || ''} onChange={(e) => setCustom({ ...custom, to: e.target.value })} /></label>
        </div>
      )}
    </div>
  )
}

// Image stored in IndexedDB
export function Img({ id, className, alt = '', fallback = null, onClick }) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    let alive = true
    if (id) getImage(id).then((v) => alive && setSrc(v))
    else setSrc(null)
    return () => (alive = false)
  }, [id])
  if (!src) return fallback
  return <img src={src} alt={alt} className={className} onClick={onClick} loading="lazy" />
}

// Illustrated cover for farms without a photo
export function FarmCover({ farm, className }) {
  const fish = /fish/i.test(farm.type)
  const live = /livestock|poultry/i.test(farm.type)
  const sky = fish ? '#B3E5FC' : '#C8E6C9'
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className={className}>
      <rect width="400" height="200" fill={sky} />
      <circle cx="330" cy="50" r="26" fill="#FFD54F" />
      <path d="M0 120 Q100 80 200 115 T400 105 V200 H0Z" fill="#81C784" />
      {fish ? (
        <>
          <ellipse cx="200" cy="160" rx="150" ry="32" fill="#4FC3F7" />
          <text x="170" y="170" fontSize="30">🐟</text>
          <text x="230" y="160" fontSize="22">🐟</text>
        </>
      ) : (
        <>
          <path d="M0 150 Q200 120 400 150 V200 H0Z" fill="#8D6E63" />
          {[...Array(9)].map((_, i) => (
            <text key={i} x={20 + i * 44} y={150 + (i % 2) * 6} fontSize="26">{live ? (i % 3 ? '🌾' : '🐐') : i % 2 ? '🌽' : '🌱'}</text>
          ))}
        </>
      )}
      <rect x="40" y="70" width="46" height="36" fill="#795548" />
      <path d="M34 72 L63 48 L92 72Z" fill="#5D4037" />
    </svg>
  )
}

export function FarmImage({ farm, className }) {
  return <Img id={farm.photoId} className={clsx('object-cover', className)} alt={farm.name} fallback={<FarmCover farm={farm} className={className} />} />
}

// Pick or capture a photo (camera on phones). Returns compressed dataURL.
export function PhotoPicker({ value, onChange, label = 'Add Photo' }) {
  const ref = useRef()
  const [busy, setBusy] = useState(false)
  const pick = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setBusy(true)
    try {
      onChange(await compressImage(f))
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }
  return (
    <div>
      <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden" onChange={pick} />
      {value ? (
        <div className="relative">
          <img src={value} alt="" className="w-full h-48 object-cover rounded-xl" />
          <button type="button" onClick={() => onChange(null)} className="absolute top-2 right-2 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center" aria-label="Remove photo">
            <X size={18} />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current.click()} className="w-full h-28 rounded-xl border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-500 gap-1 active:bg-gray-50">
          {busy ? <Loader2 className="animate-spin" /> : <div className="flex gap-2"><Camera /><ImagePlus /></div>}
          <span className="text-sm font-medium">{label}</span>
        </button>
      )}
    </div>
  )
}

export function Badge({ children, tone = 'gray' }) {
  const t = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-700',
    orange: 'bg-orange-100 text-orange-700',
    blue: 'bg-blue-100 text-blue-700',
    brown: 'bg-earth-pale text-earth'
  }
  return <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', t[tone])}>{children}</span>
}

export const DateText = ({ d }) => <>{fmtDate(d)}</>

export function Select({ value, onChange, options, placeholder, className }) {
  return (
    <select className={clsx('input', className)} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
      {placeholder != null && <option value="">{placeholder}</option>}
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value
        const l = typeof o === 'string' ? o : o.label
        return <option key={v} value={v}>{l}</option>
      })}
    </select>
  )
}
