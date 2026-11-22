// Demo data so Zozo can see how everything works on first open.
// Dates are relative to "today" so the charts always look current.
import { addDays, hashPassword, today, uid } from './utils'
import { saveImage } from './db'

export const DATA_VERSION = 1

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

  // Demo photos (simple drawings so the gallery is not empty)
  const svg = (body, bg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="${bg}"/>${body}</svg>`)
  const demoPhotos = [
    { id: 'ph_demo1', kind: 'problem', farmId: 'f_a', projectId: 'p_mg26', date: d(-4), caption: 'Yellow leaves on young maize, Field 1 lower side', symptoms: ['yellow'],
      suggestion: '• Yellow leaves: Yellow leaves (especially older, lower leaves) are usually lack of nitrogen. Can also be waterlogging or too little water.\n  ➜ Apply top dressing (Urea or CAN) on moist soil, or add manure. Check drainage. If yellow stripes, it may be maize streak virus.',
      img: svg('<rect y="220" width="400" height="80" fill="#6D4C41"/><path d="M200 230 C190 160 150 120 90 100 C150 140 175 180 192 230Z" fill="#C0CA33"/><path d="M205 230 C215 150 260 110 320 90 C260 140 230 180 210 230Z" fill="#AFB42B"/><path d="M198 230 C200 150 205 90 200 40 C215 100 212 170 206 230Z" fill="#7CB342"/><text x="20" y="40" font-family="Arial" font-size="22" fill="#333">Field 1 - maize</text>', '#E3F2FD') },
    { id: 'ph_demo2', kind: 'farm', farmId: 'f_b', projectId: 'p_pond1', date: d(-3), caption: 'Pond 1 at feeding time', symptoms: [], suggestion: '',
      img: svg('<path d="M0 120 Q200 90 400 120 V300 H0Z" fill="#81C784"/><ellipse cx="200" cy="210" rx="170" ry="60" fill="#4FC3F7"/><text x="150" y="225" font-size="40">🐟</text><text x="220" y="205" font-size="30">🐟</text><circle cx="340" cy="50" r="28" fill="#FFD54F"/>', '#B3E5FC') },
    { id: 'ph_demo3', kind: 'problem', farmId: 'f_b', projectId: '', date: d(-3), caption: 'Broken fence on east side of the ponds', symptoms: ['fence'],
      suggestion: '• Broken fence / building: Damaged fences and structures let animals escape and thieves or predators in.\n  ➜ Create a task to repair it, assign a worker and record the cost under Maintenance.',
      img: svg('<rect y="200" width="400" height="100" fill="#8D6E63"/><g stroke="#5D4037" stroke-width="10"><line x1="40" y1="110" x2="40" y2="230"/><line x1="150" y1="110" x2="150" y2="230"/><line x1="260" y1="140" x2="300" y2="235"/></g><g stroke="#9E9E9E" stroke-width="3"><line x1="40" y1="130" x2="150" y2="130"/><line x1="40" y1="170" x2="150" y2="170"/><path d="M150 130 Q190 200 230 240" fill="none"/></g>', '#C8E6C9') }
  ]
  for (const p of demoPhotos) {
    const { img, ...meta } = p
    try { await saveImage(p.id, img) } catch {}
    s.photos.push({ ...meta, createdBy: p.kind === 'farm' ? 'u_mary' : 'u_owner', createdAt: Date.now() })
  }
  s.visits[0].photoIds = ['ph_demo3']

  return s
}
