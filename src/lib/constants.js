// Product catalogue, categories and lists used across the app.

export const PRODUCTS = [
  // Crops
  { id: 'maize', name: 'Maize', group: 'Crops', icon: '🌽', family: 'cereal' },
  { id: 'tomatoes', name: 'Tomatoes', group: 'Crops', icon: '🍅', family: 'nightshade' },
  { id: 'cabbage', name: 'Cabbage', group: 'Crops', icon: '🥬', family: 'brassica' },
  { id: 'rape', name: 'Rape', group: 'Crops', icon: '🥗', family: 'brassica' },
  { id: 'spinach', name: 'Spinach', group: 'Crops', icon: '🍃', family: 'leafy' },
  { id: 'soya', name: 'Soya Beans', group: 'Crops', icon: '🫘', family: 'legume' },
  { id: 'groundnuts', name: 'Groundnuts', group: 'Crops', icon: '🥜', family: 'legume' },
  { id: 'beans', name: 'Beans', group: 'Crops', icon: '🫛', family: 'legume' },
  { id: 'onions', name: 'Onions', group: 'Crops', icon: '🧅', family: 'allium' },
  { id: 'potatoes', name: 'Potatoes', group: 'Crops', icon: '🥔', family: 'nightshade' },
  // Livestock
  { id: 'goats', name: 'Goats', group: 'Livestock', icon: '🐐' },
  { id: 'pigs', name: 'Pigs', group: 'Livestock', icon: '🐖' },
  { id: 'broilers', name: 'Chickens (Broilers)', group: 'Livestock', icon: '🐔' },
  { id: 'layers', name: 'Chickens (Layers)', group: 'Livestock', icon: '🥚' },
  { id: 'cattle', name: 'Cattle', group: 'Livestock', icon: '🐄' },
  // Fish
  { id: 'tilapia', name: 'Tilapia', group: 'Fish Farming', icon: '🐟' },
  { id: 'catfish', name: 'Catfish', group: 'Fish Farming', icon: '🐠' },
  // Other
  { id: 'custom', name: 'Custom Project', group: 'Other', icon: '🧺' }
]
export const PRODUCT_MAP = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]))
export const PRODUCT_GROUPS = ['Crops', 'Livestock', 'Fish Farming', 'Other']
export const productIcons = (ids = []) => ids.map((i) => PRODUCT_MAP[i]?.icon || '🧺').join(' ')
export const productNames = (ids = []) => ids.map((i) => PRODUCT_MAP[i]?.name || i).join(' + ')
export const isCrop = (id) => PRODUCT_MAP[id]?.group === 'Crops'
export const isLivestock = (id) => PRODUCT_MAP[id]?.group === 'Livestock'
export const isFish = (id) => PRODUCT_MAP[id]?.group === 'Fish Farming'

export const FARM_TYPES = ['Mixed', 'Crops', 'Livestock', 'Fish Farming', 'Horticulture', 'Poultry']

export const EXPENSE_CATEGORIES = [
  { id: 'Seeds', icon: '🌱', color: '#66BB6A' },
  { id: 'Fertilizer', icon: '🧪', color: '#8D6E63' },
  { id: 'Feed', icon: '🌾', color: '#FFA726' },
  { id: 'Vet/Medicine', icon: '💉', color: '#EF5350' },
  { id: 'Labour', icon: '👷', color: '#42A5F5' },
  { id: 'Fuel', icon: '⛽', color: '#AB47BC' },
  { id: 'Transport', icon: '🚚', color: '#26A69A' },
  { id: 'Equipment', icon: '🛠️', color: '#5C6BC0' },
  { id: 'Maintenance', icon: '🔧', color: '#78909C' },
  { id: 'Other', icon: '📦', color: '#BDBDBD' }
]
export const CAT_MAP = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.id, c]))

export const UNITS = ['kg', 'bags', 'crates', 'heads', 'litres', 'trays', 'pieces', 'tonnes', 'boxes', 'bundles']
export const STOCK_UNITS = ['bags', 'kg', 'litres', 'pieces', 'birds', 'chicks', 'fingerlings', 'bottles', 'packets', 'tonnes']
export const PAYMENT_METHODS = ['Cash', 'Mobile Money', 'Bank']
export const CAPITAL_SOURCES = ['Owner Savings', 'Loan', 'Family Support', 'Grant', 'Partner', 'Other']
export const PROJECT_STATUSES = ['Active', 'Harvested', 'Completed']
export const PHOTO_KINDS = [
  { id: 'farm', label: 'Farm' },
  { id: 'project', label: 'Project' },
  { id: 'receipt', label: 'Receipt' },
  { id: 'visit', label: 'Visit Note' },
  { id: 'problem', label: 'Problem' }
]
export const SIZE_UNITS = ['Hectares', 'Lima']
// 1 Lima = 0.25 ha (Zambian traditional measure)
export const toHectares = (size, unit) => (unit === 'Lima' ? (Number(size) || 0) * 0.25 : Number(size) || 0)
