// Crop rotation checks, fish feeding schedule and livestock reminders.
import { PRODUCT_MAP, isCrop, isFish, isLivestock } from './constants'
import { addDays, today } from './utils'

const FAMILY_NAME = {
  cereal: 'cereal (maize)', nightshade: 'tomato/potato family', brassica: 'cabbage family', leafy: 'leafy vegetables', legume: 'legumes (beans/soya/groundnuts)', allium: 'onion family'
}
const NEXT = {
  cereal: ['Soya Beans', 'Groundnuts', 'Beans'],
  legume: ['Maize', 'Cabbage/Rape', 'Tomatoes'],
  nightshade: ['Beans', 'Maize', 'Cabbage/Rape'],
  brassica: ['Beans', 'Maize', 'Onions'],
  leafy: ['Beans', 'Maize', 'Onions'],
  allium: ['Tomatoes', 'Beans', 'Maize']
}

// Previous crop projects on the same farm + field, newest first.
export function fieldHistory(state, farmId, field, excludeId) {
  if (!field) return []
  const f = field.trim().toLowerCase()
  return state.projects
    .filter((p) => p.farmId === farmId && p.id !== excludeId && (p.field || '').trim().toLowerCase() === f && p.products.some(isCrop))
    .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))
}

// Returns { warnings: [], suggestion: string|null }
export function rotationCheck(state, { farmId, field, products = [], startDate, id }) {
  const warnings = []
  const crops = products.filter(isCrop)
  const hist = fieldHistory(state, farmId, field, id).filter((p) => !startDate || (p.startDate || '') <= startDate)
  const prev = hist[0]
  if (prev && crops.length) {
    const prevCrops = prev.products.filter(isCrop)
    for (const c of crops) {
      const fam = PRODUCT_MAP[c].family
      const same = prevCrops.find((pc) => pc === c)
      const sameFam = prevCrops.find((pc) => PRODUCT_MAP[pc].family === fam)
      if (same)
        warnings.push(`Warning: Planting ${PRODUCT_MAP[c].name} again on ${field} may reduce yield. It was planted there last season ("${prev.name}"). Pests and diseases build up when the same crop is repeated.`)
      else if (sameFam && fam !== 'legume')
        warnings.push(`Caution: ${PRODUCT_MAP[c].name} is in the same ${FAMILY_NAME[fam]} as ${PRODUCT_MAP[sameFam].name}, which was planted on ${field} last season.`)
    }
  }
  let suggestion = null
  if (prev) {
    const fam = PRODUCT_MAP[prev.products.find(isCrop)]?.family
    if (fam && NEXT[fam]) suggestion = `Last crop on ${field}: ${prev.products.filter(isCrop).map((p) => PRODUCT_MAP[p].name).join(' + ')}. Good next crops: ${NEXT[fam].join(', ')}.` + (fam === 'cereal' ? ' Legumes restore nitrogen to the soil after maize.' : '')
  }
  return { warnings, suggestion, previous: prev || null }
}

export function nextCropSuggestion(project) {
  const c = project.products.find(isCrop)
  if (!c) return null
  const fam = PRODUCT_MAP[c].family
  return NEXT[fam] ? `Next season on ${project.field || 'this field'}, plant: ${NEXT[fam].join(', ')}.` + (fam === 'cereal' ? ' (Legumes restore soil nitrogen after maize.)' : '') : null
}

// ---------- Fish ----------
export function fishFeeding(count, avgWeightG) {
  const n = Number(count) || 0
  const w = Number(avgWeightG) || 0
  let rate, times, feed
  if (w < 10) { rate = 0.09; times = 4; feed = 'Starter crumble (40-45% protein)' }
  else if (w < 50) { rate = 0.055; times = 3; feed = 'Starter/Pre-grower pellets (35-40%)' }
  else if (w < 200) { rate = 0.035; times = 3; feed = 'Grower pellets (30-35%)' }
  else { rate = 0.02; times = 2; feed = 'Finisher pellets (28-30%)' }
  const biomass = (n * w) / 1000
  const daily = biomass * rate
  return {
    biomassKg: Math.round(biomass),
    dailyKg: Math.round(daily * 10) / 10,
    perFeedingKg: Math.round((daily / times) * 10) / 10,
    times,
    ratePct: rate * 100,
    feed,
    bagsPerWeek: Math.round(((daily * 7) / 25) * 10) / 10,
    schedule: times === 4 ? ['07:00', '10:00', '13:00', '16:00'] : times === 3 ? ['08:00', '12:00', '16:00'] : ['09:00', '16:00']
  }
}

export const FISH_REMINDERS = [
  { title: 'Water change / top-up 10-20%', every: 7 },
  { title: 'Weigh sample of 20 fish', every: 21 },
  { title: 'Check water colour & oxygen (early morning)', every: 3 },
  { title: 'Check inlet/outlet screens and pond walls', every: 14 }
]

// ---------- Livestock ----------
export const LIVESTOCK_GUIDE = {
  goats: {
    feeding: 'Browse and grass all day. 1.5-2 kg dry feed per adult. 200-500 g dairy meal for pregnant/milking/fattening goats. Clean water and salt lick always. Store hay and crop residues for the dry season.',
    schedule: [
      { title: 'Deworm goats', every: 90 },
      { title: 'CCPP vaccination (yearly)', every: 365 },
      { title: 'PPR vaccination (yearly)', every: 365 },
      { title: 'Dip / spray goats for ticks', every: 14 },
      { title: 'Trim hooves', every: 120 }
    ]
  },
  pigs: {
    feeding: 'Creep feed for piglets, then grower meal (1.5-2 kg/day) and finisher (2.5-3 kg/day). Clean water at all times. Never feed swill containing pork (ASF risk).',
    schedule: [
      { title: 'Iron injection for new piglets (day 3)', every: 0 },
      { title: 'Deworm pigs', every: 90 },
      { title: 'Clean & disinfect pens', every: 7 }
    ]
  },
  broilers: {
    feeding: 'Starter day 1-14 (~0.5 kg/bird), Grower day 15-28 (~1.2 kg/bird), Finisher day 29-42 (~1.5 kg/bird). Total ~3.3 kg feed per bird.',
    schedule: [
      { title: 'Newcastle vaccine (day 7-10)', at: 8 },
      { title: 'Gumboro vaccine (day 14)', at: 14 },
      { title: 'Newcastle booster (day 21)', at: 21 },
      { title: 'Gumboro booster (day 24)', at: 24 },
      { title: 'Switch to finisher feed (day 29)', at: 29 },
      { title: 'Sell broilers (day 35-42)', at: 38 }
    ]
  },
  layers: {
    feeding: 'Chick mash to 8 weeks, growers mash to 18 weeks, then layers mash ~115 g per bird per day. 16 hours light.',
    schedule: [
      { title: 'Newcastle vaccine booster', every: 90 },
      { title: 'Deworm layers', every: 90 },
      { title: 'Clean drinkers & feeders', every: 3 }
    ]
  },
  cattle: {
    feeding: 'Grazing plus hay/stover in the dry season. Salt lick and clean water daily. Supplement milking cows with dairy meal.',
    schedule: [
      { title: 'Dip / spray cattle (rainy season weekly)', every: 7 },
      { title: 'Deworm calves', every: 90 },
      { title: 'Anthrax & Blackleg vaccination (yearly)', every: 365 },
      { title: 'Lumpy skin vaccination (yearly)', every: 365 }
    ]
  }
}

// Build task drafts for a project's reminders
export function reminderTasks(project, items) {
  const start = project.startDate || today()
  return items.map((it) => ({
    title: `${it.title} - ${project.name}`,
    dueDate: it.at != null ? addDays(start, it.at) : addDays(today(), Math.min(it.every || 0, 7)),
    farmId: project.farmId,
    projectId: project.id,
    notes: it.every ? `Repeat every ${it.every} days.` : ''
  }))
}

export const projectKinds = (p) => ({
  crop: p.products.some(isCrop),
  livestock: p.products.filter(isLivestock),
  fish: p.products.some(isFish)
})
