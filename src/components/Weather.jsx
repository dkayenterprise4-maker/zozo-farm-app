import { useEffect, useState } from 'react'
import { RefreshCw, CloudRain } from 'lucide-react'
import { useStore } from '../lib/store'
import { fetchWeather, seasonalEstimate, plantingAdvice, codeInfo } from '../lib/weather'
import { fmtDateTime, parseISO } from '../lib/utils'

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Weather({ farm }) {
  const { state, setWeather, updateFarm, online } = useStore()
  const cached = state.weather[farm.id]
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const load = async () => {
    if (!navigator.onLine) return
    setLoading(true)
    setErr('')
    try {
      const w = await fetchWeather(farm)
      setWeather(farm.id, w)
      if (farm.lat == null) updateFarm(farm.id, { lat: w.lat, lon: w.lon })
    } catch (e) {
      setErr('Could not load weather. ' + (cached ? 'Showing last saved forecast.' : ''))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    const stale = !cached?.fetchedAt || Date.now() - new Date(cached.fetchedAt).getTime() > 3 * 3600 * 1000
    if (online && stale) load()
  }, [farm.id, online]) // eslint-disable-line

  const data = cached && cached.days?.[cached.days.length - 1]?.date >= new Date().toISOString().slice(0, 10) ? cached : null
  const w = data || seasonalEstimate()
  const tips = plantingAdvice(w.days)

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="section-title flex items-center gap-2"><CloudRain size={20} className="text-blue-500" /> 5-Day Weather</h3>
        <button onClick={load} disabled={loading || !online} className="btn-ghost btn-sm" aria-label="Refresh weather"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
      </div>
      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {w.days.map((d) => {
          const [icon, label] = codeInfo(d.code)
          return (
            <div key={d.date} className="rounded-xl bg-blue-50 p-1.5 sm:p-2 text-center" title={label}>
              <div className="text-xs font-bold text-gray-600">{DAY[parseISO(d.date).getDay()]}</div>
              <div className="text-2xl my-1">{icon}</div>
              <div className="text-xs font-semibold">{d.max}° / {d.min}°</div>
              <div className="text-[11px] text-blue-700 font-medium">{d.rain > 0 ? `${d.rain}mm` : 'dry'}</div>
              {d.prob != null && <div className="text-[10px] text-gray-500">{d.prob}%</div>}
            </div>
          )
        })}
      </div>
      <ul className="mt-3 space-y-1 text-sm text-gray-700">
        {tips.map((t, i) => <li key={i}>🌱 {t}</li>)}
      </ul>
      <p className="text-xs text-gray-400 mt-2">
        {data ? `${farm.location} · updated ${fmtDateTime(data.fetchedAt)}${!online ? ' (offline - saved forecast)' : ''}` : 'Seasonal estimate (offline). Connect to internet for the live forecast.'}
        {err && ` · ${err}`}
      </p>
    </div>
  )
}
