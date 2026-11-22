// Real farm photographs (Wikimedia Commons, free licences) bundled in public/photos
// so they work offline. Credits are shown in Settings → About & photo credits.

const base = import.meta.env.BASE_URL || './'
export const photo = (key, small = false) => `${base}photos/${key}${small ? '-sm' : ''}.webp`

export const PHOTO_CREDITS = [
  ['hero', 'Conservation farming, Zambia', '13tainonge', 'CC BY-SA 4.0'],
  ['farm_maize', 'A maize plantation', 'Tunde Akangbe', 'CC BY-SA 4.0'],
  ['farm_fish', 'Fish ponds near Luanshya', 'Blex02002', 'CC BY-SA 4.0'],
  ['maize', 'Maize in April', 'Nana Pearls', 'CC BY-SA 4.0'],
  ['goats', 'Goats in Mukuni village', 'Matti Blume', 'CC BY-SA 4.0'],
  ['fish', 'Tilapia harvest', 'MuthoniMwangi', 'CC BY-SA 4.0'],
  ['cattle', 'Cows in Zambia', 'Icem4k', 'CC BY-SA 4.0'],
  ['poultry', 'Broilers', 'ThereMazo', 'CC BY-SA 4.0'],
  ['vegetables', 'Vegetable farm', 'SuSanA Secretariat', 'CC BY 2.0'],
  ['market', 'Selling tomatoes and onions', 'Fredynjeje', 'CC BY-SA 4.0'],
  ['landscape', 'Landscapes in Zambia', 'Jae zambia', 'CC BY-SA 4.0'],
  ['farmers', 'Fighting army worms', 'Tigana chileshe', 'CC BY-SA 4.0']
]

const PRODUCT_PHOTO = {
  maize: 'maize', soya: 'farm_maize', groundnuts: 'farm_maize', beans: 'farm_maize', potatoes: 'vegetables',
  tomatoes: 'market', onions: 'market', cabbage: 'vegetables', rape: 'vegetables', spinach: 'vegetables',
  goats: 'goats', pigs: 'goats', cattle: 'cattle', broilers: 'poultry', layers: 'poultry',
  tilapia: 'fish', catfish: 'fish', custom: 'landscape'
}

export const productPhoto = (ids = [], small) => photo(PRODUCT_PHOTO[ids?.[0]] || 'landscape', small)

const TYPE_PHOTO = { 'Fish Farming': 'farm_fish', Crops: 'farm_maize', Livestock: 'cattle', Poultry: 'poultry', Horticulture: 'vegetables', Mixed: 'farm_maize' }
export const farmPhoto = (farm, small) => photo(TYPE_PHOTO[farm?.type] || 'landscape', small)
