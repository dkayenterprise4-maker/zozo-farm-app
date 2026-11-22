// Demo data so Zozo can see how everything works on first open.
// Dates are relative to "today" so the charts always look current.
import { addDays, hashPassword, today, uid } from './utils'
import { saveImage, getImage, deleteImage } from './db'
import { photo } from './photos'

export const DEMO_PHOTO_SRC = { ph_demo1: photo('farmers'), ph_demo2: photo('fish'), ph_demo3: photo('goats') }

// Older installs saved simple drawings for the demo photos. Swap them for the real photos.
export async function upgradeDemoPhotos() {
  let changed = false
  for (const [id, src] of Object.entries(DEMO_PHOTO_SRC)) {
    try {
      const v = await getImage(id)
      if (typeof v === 'string' && v.startsWith('data:image/svg')) { await saveImage(id, src); changed = true }
    } catch {}
  }
  return changed
}

export const DATA_VERSION = 2

export function emptyState() {
  return {
    version: DATA_VERSION,
    users: [],
    farms: [],
    projects: [],
    sales: [],
    expenses: [],
    investments: [],
    tasks: [],
    inventory: [],
    photos: [],
    visits: [],
    activity: [],
    chats: {},
    weather: {},
    settings: { apiKey: '', supabaseUrl: '', supabaseKey: '', lastSync: null, notifyEnabled: false },
    seen: {},
    dirty: 0
  }
}

const DEMO_PROJECTS = ['p_maize25', 'p_mg26', 'p_pond2', 'p_pond1']
const DEMO_INVENTORY = ['inv1', 'inv2', 'inv3', 'inv4', 'inv5', 'inv6', 'inv7']
const DEMO_PHOTOS = ['ph_demo1', 'ph_demo2', 'ph_demo3']
const DEMO_CAPITAL_NOTES = ['Start-up money for the new season and goat herd.', 'Bank loan for pond 1 fingerlings and feed. 12 months.', 'Inputs for 2026/27 season.']
const DEMO_FARM_NOTES = ['Main farm. Borehole near the goat pen. Field 1 is the big maize field by the road.', 'Two tilapia ponds fed by the stream. Check pump fuel weekly.']

// Clean start for real use: logins and the two farms, but no sample figures.
export async function buildStarter() {
  const s = await buildSeed()
  for (const id of DEMO_PHOTOS) await deleteImage(id).catch(() => {})
  return stripDemoRecords(s)
}

// Removes the sample projects, money records, stock, tasks, visits, photos and activity
// that came with the demo, and keeps anything the user entered themselves.
export function stripDemoRecords(s) {
  const owner = (s.users || []).find((u) => u.id === 'u_owner')
  const seedTs = Number(owner?.createdAt) || 0
  const isSeedTime = (x) => seedTs && Number(x.createdAt) > 0 && Number(x.createdAt) <= seedTs + 60000
  return {
    ...s,
    projects: (s.projects || []).filter((x) => !DEMO_PROJECTS.includes(x.id)),
    sales: (s.sales || []).filter((x) => !isSeedTime(x)),
    expenses: (s.expenses || []).filter((x) => !isSeedTime(x)),
    investments: (s.investments || []).filter((x) => !(x.createdAt == null && DEMO_CAPITAL_NOTES.includes(x.note))),
    tasks: (s.tasks || []).filter((x) => !isSeedTime(x)),
    visits: (s.visits || []).filter((x) => !isSeedTime(x)),
    inventory: (s.inventory || []).filter((x) => !DEMO_INVENTORY.includes(x.id)),
    photos: (s.photos || []).filter((x) => !DEMO_PHOTOS.includes(x.id)),
    activity: (s.activity || []).filter((a) => !seedTs || new Date(a.ts).getTime() > seedTs),
    farms: (s.farms || []).map((f) => (DEMO_FARM_NOTES.includes(f.notes) ? { ...f, notes: '' } : f)),
    chats: {}
  }
}

export async function buildSeed() {
  const s = emptyState()
  const t = today()
  const d = (n) => addDays(t, n)
  const pw = await hashPassword('123456')
  const pin = await hashPassword('pin:1234')

  const owner = { id: 'u_owner', name: 'Zozo', email: 'zozo@gmail.com', phone: '0977 000 001', password: pw, pin, role: 'owner', farmIds: [], createdAt: Date.now() }
  const worker = { id: 'u_worker', name: 'John Banda', email: 'worker@gmail.com', phone: '0966 000 002', password: pw, pin, role: 'worker', jobTitle: 'Farm Supervisor', farmIds: ['f_a'], createdAt: Date.now() }
  const worker2 = { id: 'u_mary', name: 'Mary Phiri', email: 'mary@gmail.com', phone: '0955 000 003', password: pw, pin, role: 'worker', jobTitle: 'Pond Attendant', farmIds: ['f_b'], createdAt: Date.now() }
  s.users = [owner, worker, worker2]

  s.farms = [
    { id: 'f_a', name: 'Farm A - Lusaka West', location: 'Lusaka West', district: 'Lusaka', size: 8, sizeUnit: 'Hectares', type: 'Mixed', notes: 'Main farm. Borehole near the goat pen. Field 1 is the big maize field by the road.', photoId: null, lat: -15.43, lon: 28.17, createdAt: d(-400) },
    { id: 'f_b', name: 'Farm B - Chongwe', location: 'Chongwe', district: 'Chongwe', size: 12, sizeUnit: 'Lima', type: 'Fish Farming', notes: 'Two tilapia ponds fed by the stream. Check pump fuel weekly.', photoId: null, lat: -15.33, lon: 28.68, createdAt: d(-300) }
  ]

  s.projects = [
    { id: 'p_maize25', farmId: 'f_a', name: 'Maize Season 2025/26', products: ['maize'], field: 'Field 1', startDate: d(-365), harvestDate: d(-190), status: 'Harvested', notes: 'SC 513 variety, 5 hectares.', createdAt: d(-365) },
    { id: 'p_mg26', farmId: 'f_a', name: 'Farm A - Maize + Goats Project', products: ['maize', 'goats'], field: 'Field 1', startDate: d(-12), harvestDate: d(170), status: 'Active', notes: 'New season maize on Field 1 plus the goat herd (32 goats).', herd: 32, createdAt: d(-12) },
    { id: 'p_pond2', farmId: 'f_b', name: 'Tilapia Pond 2 (Cycle 1)', products: ['tilapia'], field: 'Pond 2', startDate: d(-260), harvestDate: d(-70), status: 'Harvested', notes: '3,000 fingerlings stocked.', fishCount: 3000, avgWeight: 350, createdAt: d(-260) },
    { id: 'p_pond1', farmId: 'f_b', name: 'Tilapia Pond 1', products: ['tilapia'], field: 'Pond 1', startDate: d(-150), harvestDate: d(30), status: 'Active', notes: '4,000 fingerlings stocked. Growing well.', fishCount: 4000, avgWeight: 220, createdAt: d(-150) }
  ]

  const sale = (farmId, projectId, days, item, qty, unit, unitPrice, buyer, method, by = 'u_owner') => ({
    id: uid('s_'), farmId, projectId, date: d(days), item, qty, unit, unitPrice, total: qty * unitPrice, buyer, method, photoId: null, createdBy: by, createdAt: Date.now()
  })
  const exp = (farmId, projectId, days, category, description, amount, paidBy = 'Zozo', by = 'u_owner') => ({
    id: uid('e_'), farmId, projectId, date: d(days), category, description, amount, paidBy, photoId: null, createdBy: by, createdAt: Date.now()
  })

  s.expenses = [
    // Farm A - last season maize
    exp('f_a', 'p_maize25', -362, 'Seeds', 'SC 513 maize seed, 10 x 25kg bags', 9500),
    exp('f_a', 'p_maize25', -360, 'Fertilizer', 'D-Compound basal, 30 bags', 25500),
    exp('f_a', 'p_maize25', -320, 'Fertilizer', 'Urea top dressing, 25 bags', 22000),
    exp('f_a', 'p_maize25', -300, 'Labour', 'Weeding, 8 casual workers', 4800),
    exp('f_a', 'p_maize25', -200, 'Labour', 'Harvesting and shelling', 6500),
    exp('f_a', 'p_maize25', -185, 'Transport', 'Truck hire to FRA depot', 3200),
    exp('f_a', 'p_maize25', -150, 'Transport', 'Transport to Lusaka market', 1800),
    // Farm A - goats and new season
    exp('f_a', 'p_mg26', -170, 'Feed', 'Goat feed / dairy meal, 10 bags', 3900),
    exp('f_a', 'p_mg26', -140, 'Vet/Medicine', 'Dewormer and CCPP vaccine', 1650),
    exp('f_a', 'p_mg26', -110, 'Feed', 'Goat feed, 10 bags', 3900),
    exp('f_a', 'p_mg26', -80, 'Maintenance', 'Goat pen roof repair', 2200),
    exp('f_a', 'p_mg26', -60, 'Feed', 'Goat feed, 12 bags', 4680, 'John Banda', 'u_worker'),
    exp('f_a', 'p_mg26', -30, 'Labour', 'Herdsman wages - October', 2500),
    exp('f_a', 'p_mg26', -14, 'Seeds', 'SC 513 maize seed, 10 bags', 10200),
    exp('f_a', 'p_mg26', -12, 'Fertilizer', 'D-Compound basal, 30 bags', 26400),
    exp('f_a', 'p_mg26', -8, 'Labour', 'Planting team, 10 workers x 3 days', 4500, 'John Banda', 'u_worker'),
    exp('f_a', 'p_mg26', -5, 'Feed', 'Goat feed, 8 bags', 3120, 'John Banda', 'u_worker'),
    exp('f_a', 'p_mg26', -2, 'Fuel', 'Diesel for tractor', 1350, 'John Banda', 'u_worker'),
    // Farm B - pond 2
    exp('f_b', 'p_pond2', -258, 'Other', '3,000 tilapia fingerlings', 4500),
    exp('f_b', 'p_pond2', -230, 'Feed', 'Fish feed starter, 20 bags', 9000),
    exp('f_b', 'p_pond2', -180, 'Feed', 'Fish feed grower, 30 bags', 12600),
    exp('f_b', 'p_pond2', -130, 'Feed', 'Fish feed grower, 30 bags', 12600),
    exp('f_b', 'p_pond2', -90, 'Labour', 'Pond attendant wages (3 months)', 4500),
    exp('f_b', 'p_pond2', -72, 'Labour', 'Harvest team and nets', 1800),
    // Farm B - pond 1
    exp('f_b', 'p_pond1', -150, 'Other', '4,000 tilapia fingerlings', 6000),
    exp('f_b', 'p_pond1', -148, 'Maintenance', 'Pond liming and repairs', 2100),
    exp('f_b', 'p_pond1', -120, 'Feed', 'Fish feed starter, 20 bags', 9000),
    exp('f_b', 'p_pond1', -75, 'Feed', 'Fish feed grower, 30 bags', 12900),
    exp('f_b', 'p_pond1', -45, 'Fuel', 'Petrol for water pump', 1200, 'Mary Phiri', 'u_mary'),
    exp('f_b', 'p_pond1', -40, 'Feed', 'Fish feed grower, 30 bags', 12900),
    exp('f_b', 'p_pond1', -20, 'Labour', 'Pond attendant wages', 1500),
    exp('f_b', 'p_pond1', -10, 'Feed', 'Fish feed grower, 20 bags', 8600, 'Mary Phiri', 'u_mary'),
    exp('f_b', 'p_pond1', -4, 'Fuel', 'Petrol for water pump', 900, 'Mary Phiri', 'u_mary')
  ]

  s.sales = [
    // Maize harvest sales
    sale('f_a', 'p_maize25', -186, 'Maize', 400, 'bags', 280, 'FRA Depot Lusaka', 'Bank'),
    sale('f_a', 'p_maize25', -160, 'Maize', 120, 'bags', 300, 'Soweto Market Traders', 'Cash'),
    sale('f_a', 'p_maize25', -120, 'Maize', 80, 'bags', 320, 'Mr. Mwansa (miller)', 'Mobile Money'),
    sale('f_a', 'p_maize25', -75, 'Maize', 50, 'bags', 340, 'Chilenje Hammer Mill', 'Mobile Money'),
    // Goats
    sale('f_a', 'p_mg26', -150, 'Goats', 4, 'heads', 1500, 'Kalingalinga Butchery', 'Cash'),
    sale('f_a', 'p_mg26', -100, 'Goats', 3, 'heads', 1600, 'Neighbour - Mr. Tembo', 'Cash'),
    sale('f_a', 'p_mg26', -45, 'Goats', 5, 'heads', 1650, 'Chawama Butchery', 'Mobile Money'),
    sale('f_a', 'p_mg26', -18, 'Goats', 2, 'heads', 1700, 'Wedding order - Mrs. Zulu', 'Mobile Money', 'u_worker'),
    sale('f_a', 'p_mg26', -6, 'Goats', 4, 'heads', 1700, 'Kalingalinga Butchery', 'Cash', 'u_worker'),
    // Fish
    sale('f_b', 'p_pond2', -70, 'Tilapia (fresh)', 650, 'kg', 75, 'Chongwe Fish Traders', 'Cash'),
    sale('f_b', 'p_pond2', -66, 'Tilapia (fresh)', 300, 'kg', 80, 'Lusaka Shoprite supplier', 'Bank'),
    sale('f_b', 'p_pond1', -25, 'Tilapia (partial harvest)', 180, 'kg', 80, 'Chongwe Market', 'Cash', 'u_mary'),
    sale('f_b', 'p_pond1', -3, 'Tilapia (partial harvest)', 220, 'kg', 85, 'Lusaka Hotel Kitchen', 'Mobile Money')
  ]

  s.investments = [
    { id: uid('i_'), farmId: 'f_a', projectId: '', date: d(-330), amount: 50000, source: 'Owner Savings', note: 'Start-up money for the new season and goat herd.', createdBy: 'u_owner' },
    { id: uid('i_'), farmId: 'f_b', projectId: 'p_pond1', date: d(-155), amount: 30000, source: 'Loan', note: 'Bank loan for pond 1 fingerlings and feed. 12 months.', createdBy: 'u_owner' },
    { id: uid('i_'), farmId: 'f_a', projectId: 'p_mg26', date: d(-15), amount: 20000, source: 'Owner Savings', note: 'Inputs for 2026/27 season.', createdBy: 'u_owner' }
  ]

  s.inventory = [
    { id: 'inv1', farmId: 'f_a', name: 'Goat Feed (bags)', qty: 4, unit: 'bags', lowStock: 5 },
    { id: 'inv2', farmId: 'f_a', name: 'Urea Fertilizer', qty: 25, unit: 'bags', lowStock: 10 },
    { id: 'inv3', farmId: 'f_a', name: 'Dewormer (Albendazole)', qty: 2, unit: 'litres', lowStock: 1 },
    { id: 'inv4', farmId: 'f_a', name: 'Maize Seed SC 513', qty: 1, unit: 'bags', lowStock: 2 },
    { id: 'inv5', farmId: 'f_b', name: 'Fish Feed Grower (25kg)', qty: 14, unit: 'bags', lowStock: 10 },
    { id: 'inv6', farmId: 'f_b', name: 'Agricultural Lime', qty: 3, unit: 'bags', lowStock: 2 },
    { id: 'inv7', farmId: 'f_b', name: 'Pump Petrol', qty: 8, unit: 'litres', lowStock: 10 }
  ]

  s.tasks = [
    { id: uid('t_'), title: 'Vaccinate goats (CCPP)', farmId: 'f_a', projectId: 'p_mg26', dueDate: d(-2), assignedTo: 'u_worker', done: false, notes: 'Vet coming from Lusaka West.', createdBy: 'u_owner', createdAt: Date.now() },
    { id: uid('t_'), title: 'Apply top dressing (Urea) on Field 1', farmId: 'f_a', projectId: 'p_mg26', dueDate: d(18), assignedTo: 'u_worker', done: false, notes: 'About 4-6 weeks after planting.', createdBy: 'u_owner', createdAt: Date.now() },
    { id: uid('t_'), title: 'Water change - Pond 1 (top up 20%)', farmId: 'f_b', projectId: 'p_pond1', dueDate: t, assignedTo: 'u_mary', done: false, notes: '', createdBy: 'u_owner', createdAt: Date.now() },
    { id: uid('t_'), title: 'Pay workers - November wages', farmId: 'f_a', projectId: '', dueDate: d(8), assignedTo: 'u_owner', done: false, notes: 'Herdsman + casuals.', createdBy: 'u_owner', createdAt: Date.now() },
    { id: uid('t_'), title: 'Buy goat feed (stock is low)', farmId: 'f_a', projectId: 'p_mg26', dueDate: d(1), assignedTo: 'u_worker', done: false, notes: '', createdBy: 'u_owner', createdAt: Date.now() },
    { id: uid('t_'), title: 'Weigh sample fish - Pond 1', farmId: 'f_b', projectId: 'p_pond1', dueDate: d(-6), assignedTo: 'u_mary', done: true, notes: '', createdBy: 'u_owner', createdAt: Date.now() }
  ]

  s.visits = [
    { id: uid('v_'), farmId: 'f_b', date: d(-3), visitor: 'Zozo', saw: 'Fish in Pond 1 look healthy and active at feeding. Water slightly green - good.', fix: 'Inlet pipe leaking near the pump. Fence on east side has a gap.', photoIds: [], createdBy: 'u_owner', createdAt: Date.now() },
    { id: uid('v_'), farmId: 'f_a', date: d(-7), visitor: 'John Banda', saw: 'Maize germination about 90% on Field 1. Two goats coughing.', fix: 'Replant gaps on the lower side. Call vet for coughing goats.', photoIds: [], createdBy: 'u_worker', createdAt: Date.now() }
  ]

  const act = (daysAgo, userId, userName, farmId, text, type) => ({
    id: uid('a_'), ts: new Date(Date.now() - daysAgo * 86400000 - Math.random() * 3600000).toISOString(), userId, userName, farmId, text, type
  })
  s.activity = [
    act(14, 'u_owner', 'Zozo', 'f_a', 'created project "Farm A - Maize + Goats Project"', 'project'),
    act(8, 'u_worker', 'John Banda', 'f_a', 'added K4,500.00 Labour expense to Farm A', 'expense'),
    act(7, 'u_worker', 'John Banda', 'f_a', 'logged a visit to Farm A', 'visit'),
    act(6, 'u_worker', 'John Banda', 'f_a', 'recorded a sale of 4 heads Goats (K6,800.00) at Farm A', 'sale'),
    act(5, 'u_worker', 'John Banda', 'f_a', 'added K3,120.00 Feed expense to Farm A', 'expense'),
    act(4, 'u_mary', 'Mary Phiri', 'f_b', 'added K900.00 Fuel expense to Farm B', 'expense'),
    act(3, 'u_owner', 'Zozo', 'f_b', 'visited Farm B - Chongwe', 'visit'),
    act(3, 'u_owner', 'Zozo', 'f_b', 'recorded a sale of 220 kg Tilapia (K18,700.00) at Farm B', 'sale'),
    act(2, 'u_worker', 'John Banda', 'f_a', 'added K1,350.00 Fuel expense to Farm A', 'expense')
  ].sort((a, b) => b.ts.localeCompare(a.ts))

  // Demo photos (real photos bundled with the app in public/photos)
  const demoPhotos = [
    { id: 'ph_demo1', kind: 'problem', farmId: 'f_a', projectId: 'p_mg26', date: d(-4), caption: 'Checking young maize for fall armyworm, Field 1', symptoms: ['holes'],
      suggestion: '• Holes in leaves: Holes and chewing damage are caused by caterpillars (e.g. fall armyworm in maize, diamondback moth in cabbage) or beetles.\n  ➜ Scout the field. Spray a suitable insecticide (Emamectin, Lambda-cyhalothrin, or Bt for vegetables) early morning. Rotate chemicals.' },
    { id: 'ph_demo2', kind: 'project', farmId: 'f_b', projectId: 'p_pond1', date: d(-3), caption: 'Tilapia from Pond 1 at harvest', symptoms: [], suggestion: '' },
    { id: 'ph_demo3', kind: 'project', farmId: 'f_a', projectId: 'p_mg26', date: d(-2), caption: 'Goats in the night pen', symptoms: [], suggestion: '' }
  ]
  for (const p of demoPhotos) {
    try { await saveImage(p.id, DEMO_PHOTO_SRC[p.id]) } catch {}
    s.photos.push({ ...p, createdBy: p.kind === 'project' && p.farmId === 'f_b' ? 'u_mary' : 'u_owner', createdAt: Date.now() })
  }
  s.visits[0].photoIds = ['ph_demo2']

  return s
}
