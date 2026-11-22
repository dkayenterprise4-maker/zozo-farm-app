// 5-day weather from Open-Meteo (free, no key). Cached for offline use.
// If no internet and no cache, shows a seasonal estimate for Zambia (clearly labelled).
import { addDays, today } from './utils'

const CODES = {
  0: ['☀️', 'Sunny'], 1: ['🌤️', 'Mostly sunny'], 2: ['⛅', 'Partly cloudy'], 3: ['☁️', 'Cloudy'],
  45: ['🌫️', 'Fog'], 48: ['🌫️', 'Fog'], 51: ['🌦️', 'Light drizzle'], 53: ['🌦️', 'Drizzle'], 55: ['🌧️', 'Heavy drizzle'],
  61: ['🌦️', 'Light rain'], 63: ['🌧️', 'Rain'], 65: ['🌧️', 'Heavy rain'], 80: ['🌦️', 'Showers'], 81: ['🌧️', 'Showers'],
  82: ['⛈️', 'Heavy showers'], 95: ['⛈️', 'Thunderstorm'], 96: ['⛈️', 'Storm + hail'], 99: ['⛈️', 'Storm + hail']
}
export const codeInfo = (c) => CODES[c] || ['🌡️', 'Mixed']

async function geocode(name) {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5&language=en&format=json`)
  const j = await r.json()
  const hit = (j.results || []).find((x) => x.country_code === 'ZM') || (j.results || [])[0]
  return hit ? { lat: hit.latitude, lon: hit.longitude } : null
}

export async function fetchWeather(farm) {
  let { lat, lon } = farm
  if (lat == null || lon == null) {
    const g = (await geocode(farm.location)) || (await geocode(farm.district || 'Lusaka'))
    if (!g) throw new Error('Location not found')
    lat = g.lat
    lon = g.lon
  }
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=Africa%2FLusaka&forecast_days=5`
  const r = await fetch(url)
  if (!r.ok) throw new Error('Weather service error')
  const j = await r.json()
  const days = j.daily.time.map((date, i) => ({
    date,
    code: j.daily.weather_code[i],
    max: Math.round(j.daily.temperature_2m_max[i]),
    min: Math.round(j.daily.temperature_2m_min[i]),
    rain: Math.round(j.daily.precipitation_sum[i] * 10) / 10,
    prob: j.daily.precipitation_probability_max?.[i] ?? null
  }))
  return { days, fetchedAt: new Date().toISOString(), lat, lon, source: 'live' }
}

// Seasonal estimate for Lusaka province when offline with no cache.
export function seasonalEstimate() {
  const m = new Date().getMonth()
  const wet = [10, 11, 0, 1, 2].includes(m)
  const hot = [8, 9, 10].includes(m)
  const days = Array.from({ length: 5 }, (_, i) => {
    const rainy = wet && (i % 2 === 0)
    return {
      date: addDays(today(), i),
      code: rainy ? 61 : wet ? 2 : 0,
      max: hot ? 33 : wet ? 28 : m >= 5 && m <= 7 ? 23 : 27,
      min: hot ? 18 : wet ? 17 : m >= 5 && m <= 7 ? 8 : 13,
      rain: rainy ? 8 : 0,
      prob: rainy ? 60 : wet ? 30 : 5
    }
  })
  return { days, fetchedAt: null, source: 'estimate' }
}

export function plantingAdvice(days) {
  const total = days.reduce((a, d) => a + (d.rain || 0), 0)
  const heavy = days.find((d) => d.rain >= 20)
  const hot = days.find((d) => d.max >= 34)
  const tips = []
  const m = new Date().getMonth()
  if (total >= 25) tips.push(`About ${Math.round(total)} mm of rain expected in 5 days - good conditions for planting maize, soya and groundnuts once the soil is moist to a hand depth.`)
  else if (total >= 8) tips.push(`Some rain expected (${Math.round(total)} mm). Prepare land and inputs; plant after 25-30 mm has fallen.`)
  else if ([10, 11, 0, 1].includes(m)) tips.push('Little rain expected. Avoid dry planting unless you can irrigate; watch for a dry spell and mulch crops.')
  else tips.push('Dry days ahead - irrigate vegetables early morning or evening and mulch to keep moisture.')
  if (heavy) tips.push(`Heavy rain on ${heavy.date.slice(8, 10)}/${heavy.date.slice(5, 7)} - do not spray or apply Urea just before it; check pond overflows and drainage.`)
  if (hot) tips.push(`Very hot (${hot.max}°C) - give animals shade and extra water; feed fish less in the hottest hours and top up ponds.`)
  return tips
}
