// Built-in farming knowledge for Zambia. Works fully offline.
// Each entry has keywords; the assistant picks the best match.

export const KNOWLEDGE = [
  // ---------------- MAIZE ----------------
  { k: ['fall armyworm', 'armyworm', 'worm maize', 'caterpillar maize', 'holes maize', 'funnel'], t: 'Fall Armyworm in Maize',
    a: `Fall armyworm is the most common maize pest in Zambia.\n\nSigns: ragged holes in leaves, sawdust-like droppings in the funnel (whorl), small green-brown caterpillars with a "Y" on the head.\n\nWhat to do:\n• Scout the field twice a week from planting to tasseling. Check 20 plants in a "W" pattern.\n• If more than 1 in 5 plants is damaged, spray. Use Emamectin benzoate, Lambda-cyhalothrin or Chlorantraniliprole (e.g. Coragen) into the funnel early morning or late afternoon.\n• Low-cost option: put a pinch of fine sand + ash or soil into the funnel.\n• Plant early with the first good rains and keep fields weed-free.\n• Rotate chemicals so the worms do not build resistance.` },
  { k: ['maize streak', 'streak virus', 'yellow stripes maize', 'leafhopper'], t: 'Maize Streak Virus',
    a: `Maize streak shows as thin yellow broken stripes along the leaves; plants stay short.\n\n• Spread by leafhoppers - there is no cure once infected.\n• Plant tolerant varieties (most ZARI, SeedCo, Pannar, MRI hybrids are tolerant).\n• Plant early, all at once, and remove grass weeds around the field.\n• Pull out and destroy badly infected young plants.` },
  { k: ['grey leaf spot', 'gray leaf spot', 'leaf blight maize', 'rectangular spots'], t: 'Grey Leaf Spot / Leaf Blight',
    a: `Long grey/brown rectangular spots on maize leaves = Grey Leaf Spot (common in wetter areas). Cigar-shaped spots = Northern Leaf Blight.\n\n• Use tolerant varieties.\n• Rotate maize with soya beans or groundnuts.\n• Bury or remove old maize stalks after harvest.\n• If severe before tasseling, spray a fungicide like Mancozeb or Azoxystrobin.` },
  { k: ['maize fertilizer', 'fertilizer maize', 'd compound', 'urea', 'top dressing', 'basal', 'how much fertilizer'], t: 'Fertilizer for Maize',
    a: `Standard Zambian maize recommendation (per hectare):\n• Basal at planting: 200 kg (4 x 50kg bags) D-Compound (10:20:10).\n• Top dressing: 200 kg (4 bags) Urea, applied 3-5 weeks after germination when the maize is knee high, on moist soil.\n\nPer Lima (0.25 ha): 1 bag D-Compound + 1 bag Urea.\n\nTips:\n• Put fertilizer 5 cm beside the seed, not touching it.\n• Never apply Urea on dry soil - it is lost to the air. Cover it with soil.\n• Add manure or compost to improve the soil and save money.\n• Do a soil test (ZARI Mount Makulu) every few years; acidic soils need agricultural lime.` },
  { k: ['maize plant', 'plant maize', 'maize spacing', 'maize seed rate', 'when to plant maize', 'grow maize', 'maize'], t: 'Growing Maize',
    a: `Maize in Zambia:\n• Plant with the first good rains (usually mid-November to early December in Lusaka) - after 25-30 mm of rain.\n• Spacing: 75-90 cm between rows, 25 cm between plants (1 seed per hole) or 50 cm (2 seeds).\n• Seed rate: about 25 kg per hectare.\n• Weed at 2-3 weeks and again at 5-6 weeks - weeds can cut yield by half.\n• Top dress with Urea at knee height.\n• Harvest when husks are dry and the grain is hard (about 4-5 months). Dry to 12.5% moisture before storage.\n• Store with Actellic Super dust or in hermetic (PICS) bags to stop weevils and larger grain borer.\n• Good yield: 5-8 tonnes/ha (100-160 bags of 50 kg) with good management.` },
  // ---------------- VEGETABLES ----------------
  { k: ['tomato blight', 'late blight', 'early blight', 'tomato spots', 'tomato leaves brown', 'tomato disease'], t: 'Tomato Blight',
    a: `Blight is the biggest tomato disease, especially in the rainy season.\n\n• Early blight: brown spots with rings ("target"), starting on lower leaves.\n• Late blight: dark, greasy patches spreading fast in cool wet weather; fruit rots.\n\nWhat to do:\n• Spray Mancozeb (Dithane) every 7-10 days in wet weather; for late blight use Ridomil Gold.\n• Stake tomatoes and remove lower leaves so air moves.\n• Water at the base, not on the leaves.\n• Do not plant tomatoes after potatoes, peppers or tomatoes in the same field.` },
  { k: ['tuta', 'tuta absoluta', 'tomato leaf miner', 'tomato fruit holes', 'tomato pests'], t: 'Tuta Absoluta (Tomato Leaf Miner)',
    a: `Tuta absoluta makes clear "windows" or mines in tomato leaves and small holes in fruit.\n\n• Use pheromone traps (from agro-dealers) to monitor and catch moths.\n• Remove and burn infested leaves and fruit.\n• Spray Coragen, Belt, Tracer or Emamectin; rotate products.\n• Keep a break period with no tomatoes and do not plant next to an old crop.` },
  { k: ['tomato', 'tomatoes', 'grow tomatoes'], t: 'Growing Tomatoes',
    a: `Tomatoes:\n• Raise seedlings in a nursery for 4-6 weeks, transplant at 4-6 leaves.\n• Spacing: 60 cm x 45-60 cm. Stake indeterminate varieties.\n• Basal: Compound D or manure; top dress with Calcium Nitrate or CAN to prevent blossom-end rot.\n• Water regularly - uneven watering causes cracked fruit and blossom-end rot.\n• Best prices in Lusaka are usually during the rainy season (Dec-Mar) because supply is low - plan dry-season production under irrigation or rain-season production with good spraying.` },
  { k: ['cabbage', 'rape', 'aphid', 'diamondback', 'dbm', 'holes in leaves cabbage', 'brassica', 'kale'], t: 'Cabbage & Rape Pests',
    a: `Main pests of cabbage and rape:\n• Aphids (small green/grey insects under leaves): spray Dimethoate or soapy water (1 bar soap in 20 L), or neem.\n• Diamondback moth (small green caterpillars making holes): spray Bacillus thuringiensis (Bt), Emamectin, or Tracer. Rotate chemicals.\n• Black rot (V-shaped yellow areas from the leaf edge): rotate away from brassicas for 2-3 years.\n\nTips: transplant at 4 weeks, spacing 60 x 45 cm for cabbage, 30 x 30 cm for rape. Top dress with Urea or Ammonium Nitrate. Harvest rape leaves weekly.` },
  { k: ['spinach', 'chinese cabbage', 'leafy vegetables', 'vegetables', 'garden'], t: 'Leafy Vegetables',
    a: `Leafy vegetables (rape, spinach, Chinese cabbage, impwa, pumpkin leaves) give quick cash every week.\n• Use rich soil with manure; water daily in hot weather.\n• Plant in small batches every 2-3 weeks so you always have something to sell.\n• Harvest early morning and keep in shade so leaves stay fresh for market.\n• Sell to markets (Soweto, Chilenje), shops, schools and restaurants.` },
  { k: ['onion', 'onions'], t: 'Growing Onions',
    a: `Onions:\n• Best planted in the cool dry season (March-May) under irrigation.\n• Nursery 6-8 weeks, transplant at pencil thickness, spacing 30 x 10 cm.\n• Keep weed-free - onions are poor competitors.\n• Stop watering 2-3 weeks before harvest. Harvest when tops fall over.\n• Cure in shade for 2 weeks before storage or sale. Watch for thrips (silver streaks) - spray if severe.` },
  { k: ['potato', 'potatoes', 'irish potato'], t: 'Growing Potatoes',
    a: `Irish potatoes:\n• Use certified seed potatoes; plant 75 cm x 30 cm, 10 cm deep.\n• Earth up soil around plants twice to protect tubers from light and pests.\n• Watch for late blight in wet cool weather - spray Mancozeb/Ridomil.\n• Do not plant after tomatoes or potatoes (same family) - rotate with maize or beans.\n• Harvest 2 weeks after leaves die back; store in a dark, cool, airy place.` },
  { k: ['soya', 'soya beans', 'soybean', 'inoculant'], t: 'Growing Soya Beans',
    a: `Soya beans are excellent after maize - they fix nitrogen and break disease cycles.\n• Plant Dec with good rains; rows 45-50 cm, 5 cm between seeds. Seed rate ~80-100 kg/ha.\n• Use inoculant (rhizobium) on seed before planting if the field has not grown soya before - it can save fertilizer.\n• Basal: 100-150 kg/ha D-Compound or a low-nitrogen fertilizer. No Urea needed.\n• Harvest when 95% of pods are brown; do not delay or pods shatter.\n• Sell to millers, stockfeed companies (e.g. for chicken feed) or keep for animal feed.` },
  { k: ['groundnut', 'groundnuts', 'peanut', 'rosette'], t: 'Growing Groundnuts',
    a: `Groundnuts:\n• Plant early with first rains; rows 45 cm, 10-15 cm between seeds.\n• Groundnut rosette (stunted, yellow, bushy plants) is spread by aphids - plant early, plant densely and use resistant varieties (e.g. MGV 5, Chishango).\n• Apply gypsum at flowering for well-filled pods.\n• Harvest when inside of shells turns dark; dry well to avoid aflatoxin (mould). Store dry and off the floor.` },
  { k: ['beans', 'common bean', 'sugar beans'], t: 'Growing Beans',
    a: `Beans: plant in Feb-March (end of rains) or with irrigation in the dry season. Spacing 45 x 10 cm. Like soya, beans add nitrogen to the soil and are a great crop after maize. Watch for bean stem maggot and rust; use dressed seed.` },
  // ---------------- ROTATION / SOIL ----------------
  { k: ['crop rotation', 'rotation', 'rotate', 'same crop', 'plant again', 'next season', 'what should i plant'], t: 'Crop Rotation',
    a: `Crop rotation keeps the soil healthy and reduces pests.\n\nSimple rotation for Zambia:\n1. Maize (cereal - heavy feeder)\n2. Soya beans, groundnuts or beans (legumes - add nitrogen)\n3. Vegetables / sunflower / cotton\n4. Back to maize\n\nRules:\n• Do not plant maize after maize on the same field - yield drops and pests (armyworm, stalk borer) build up.\n• Do not plant tomatoes, potatoes or peppers after each other (same family).\n• Do not plant cabbage/rape after cabbage/rape.\n• Maize after soya can yield 20-30% more and needs less Urea.\n\nThe app checks your projects: when you start a new crop project on the same field, it warns you and suggests what to plant.` },
  { k: ['soil', 'compost', 'manure', 'acidic', 'lime', 'soil test'], t: 'Soil Health',
    a: `Healthy soil = higher yields and lower fertilizer costs.\n• Add manure (goat, chicken, cattle) or compost every season.\n• Many Zambian soils are acidic - apply agricultural lime (about 1-2 t/ha) if a soil test shows pH below 5.\n• Keep crop residues on the field (conservation farming) and use minimum tillage/basins or rippers.\n• Rotate with legumes.\n• Get a soil test from ZARI or an agro-dealer every 2-3 years.` },
  { k: ['weather', 'rain', 'rainy season', 'season', 'when do rains', 'drought', 'dry spell', 'lusaka weather'], t: 'Seasons in Zambia',
    a: `Zambia's seasons (Lusaka region):\n• Rainy season: mid-November to March/April. Main planting time for maize, soya, groundnuts.\n• Cool dry season: May to August - good for irrigated vegetables, onions, tomatoes, wheat.\n• Hot dry season: September to mid-November - prepare land, buy inputs early, irrigate.\n\nTips:\n• Plant after 25-30 mm of rain has fallen and the soil is moist to a hand depth.\n• Watch for dry spells in January-February - mulch and conservation farming help keep moisture.\n• Check the 5-day forecast on each farm's dashboard before spraying or applying fertilizer.` },
  { k: ['irrigation', 'water', 'drip', 'borehole', 'watering'], t: 'Irrigation',
    a: `Irrigation lets you grow and sell when prices are high (dry season).\n• Drip irrigation saves up to 50% water and reduces leaf diseases.\n• Water early morning or late afternoon.\n• Most vegetables need about 25-35 mm of water per week (more in October heat).\n• Mulch with grass to keep moisture in the soil.\n• Solar pumps cut fuel costs - check your fuel spending in the Expenses report.` },
  // ---------------- LIVESTOCK ----------------
  { k: ['goat disease', 'goat sick', 'goat cough', 'ccpp', 'pneumonia goat', 'goat diarrhoea', 'goat'], t: 'Goat Health',
    a: `Common goat problems in Zambia:\n• Worms (pale eyelids, thin, diarrhoea): deworm every 3 months (Albendazole, Ivermectin). Check eyelids (FAMACHA).\n• CCPP / pneumonia (coughing, fast breathing, fever): vaccinate yearly against CCPP; treat with Oxytetracycline (Terramycin LA) quickly - call the vet.\n• Heartwater & tick diseases: dip or spray every 1-2 weeks in the rainy season.\n• Foot rot: keep the pen dry, trim hooves, foot bath with copper sulphate.\n• Orf (scabs on lips): isolate, clean with iodine.\n\nGood practice: dry raised pen, clean water always, mineral lick, separate sick animals, record all treatments.` },
  { k: ['goat feed', 'feeding goats', 'goat feeding'], t: 'Feeding Goats',
    a: `Goats eat browse (leaves, shrubs) and grass.\n• Adult goat: about 3-4% of body weight in dry feed per day (1.5-2 kg for a 50 kg goat).\n• Give a concentrate/dairy meal (200-500 g) only to pregnant, milking and fattening goats.\n• Dry season: feed hay, maize stover, groundnut tops, soya residues, Leucaena or Moringa leaves - store them after harvest.\n• Always provide clean water and a mineral/salt lick.\n• If feed cost is high, plant fodder (Napier, Leucaena) and make hay.` },
  { k: ['pig', 'pigs', 'african swine fever', 'asf', 'piglet'], t: 'Pig Farming',
    a: `Pigs:\n• African Swine Fever (ASF) has no cure or vaccine - prevent it: do not feed kitchen waste with pork, control visitors, foot bath at the gate, buy pigs only from trusted farms.\n• Give piglets iron injection at 3 days, deworm at 6 weeks and every 3 months.\n• Feeding: creep feed for piglets, grower then finisher meal. A finisher pig eats 2.5-3 kg/day.\n• Market pigs at 90-100 kg (about 6 months).` },
  { k: ['broiler', 'broilers', 'chicken', 'chickens', 'poultry', 'chicks'], t: 'Broiler Chickens',
    a: `Broilers (6 weeks):\n• Before chicks: clean, disinfect, put litter (wood shavings), heat to 32-35°C.\n• Feed: Starter (day 1-14, ~0.5 kg/bird), Grower (day 15-28, ~1.2 kg/bird), Finisher (day 29-42, ~1.5 kg/bird). Total about 3.2-3.5 kg feed per bird.\n• Vaccines: Newcastle (day 7-10 and 21), Gumboro (day 14 and 24) - in drinking water, no chlorine.\n• Space: 10 birds per square metre.\n• Sell at 5-6 weeks (1.8-2.2 kg). Feed is ~70% of the cost - buy in bulk and avoid wastage.` },
  { k: ['layer', 'layers', 'eggs', 'egg production'], t: 'Layer Chickens',
    a: `Layers:\n• Start laying at about 18-20 weeks; peak 90% at 26-30 weeks; productive for ~72 weeks.\n• Feed: about 110-120 g layers mash per bird per day + clean water always.\n• Light: 16 hours per day for good laying.\n• Vaccinate: Newcastle, Gumboro, Fowl pox, Infectious Bronchitis; repeat Newcastle every 3 months.\n• A tray is 30 eggs - track trays sold daily in Sales.` },
  { k: ['newcastle', 'chicken disease', 'chickens dying', 'gumboro', 'coccidiosis'], t: 'Chicken Diseases',
    a: `• Newcastle disease: twisted necks, green diarrhoea, many deaths - no cure; vaccinate (day 7, 21, then every 3 months).\n• Gumboro: young birds (3-6 weeks) depressed, white diarrhoea - vaccinate.\n• Coccidiosis: bloody droppings, wet litter - treat with Amprolium in water, keep litter dry.\n• Remove dead birds quickly, keep visitors out, disinfect boots.` },
  { k: ['cattle', 'cow', 'cows', 'east coast fever', 'corridor disease', 'dipping', 'ticks', 'lumpy skin'], t: 'Cattle Health',
    a: `Cattle in Zambia:\n• Tick-borne diseases (East Coast Fever/Corridor disease, heartwater, anaplasmosis) are the biggest killers - dip or spray weekly in the rainy season, every 2 weeks in the dry season.\n• Vaccinate: ECF (where available), Anthrax and Blackleg yearly, Lumpy skin disease, FMD as advised by the veterinary office.\n• Deworm calves every 3 months and adults at the start of the rains.\n• Provide salt licks and clean water. Supplement in the dry season with hay and crop residues.` },
  { k: ['vaccination', 'vaccine', 'vaccinate', 'deworm', 'deworming'], t: 'Vaccination Reminders',
    a: `Open a livestock project and tap "Guidance" to see the vaccination and deworming schedule for that animal, and add reminders to your Tasks with one tap.\n\nQuick guide:\n• Goats: CCPP & PPR yearly, deworm every 3 months, dip/spray 1-2 weeks.\n• Chickens: Newcastle day 7 & 21 (+ every 3 months for layers), Gumboro day 14 & 24.\n• Pigs: iron at 3 days, deworm every 3 months.\n• Cattle: Anthrax/Blackleg yearly, weekly dipping in rains.` },
  // ---------------- FISH ----------------
  { k: ['fish feed', 'feeding fish', 'tilapia feed', 'how much feed fish', 'fish feeding'], t: 'Feeding Tilapia',
    a: `Feeding tilapia (per day, as % of total fish weight):\n• Fingerlings (1-10 g): 8-10%, 4 times a day, starter crumbs.\n• Juveniles (10-50 g): 5-6%, 3 times a day.\n• Growers (50-200 g): 3-4%, 2-3 times a day.\n• Finishers (200 g+): 1.5-2.5%, 2 times a day.\n\nExample: 4,000 fish x 200 g = 800 kg of fish; at 3% = 24 kg feed per day.\n\nTips:\n• Feed at the same place and time; stop when fish stop eating (about 15 minutes).\n• Feed less on cold mornings (June-July) and when water is very green or fish gasp at the surface.\n• Weigh a sample of 20 fish every 2-4 weeks to adjust feed. The Guidance tab on your fish project calculates this for you.` },
  { k: ['pond', 'water change', 'water quality', 'oxygen', 'fish gasping', 'fish dying', 'dead fish', 'green water'], t: 'Pond Water Quality',
    a: `Good water = healthy fish.\n• Fish gasping at the surface in the early morning = low oxygen. Stop feeding, add fresh water, use an aerator if you have one.\n• Water colour: light green (you can see your hand at elbow depth, ~30-40 cm) is good. Too dark green = reduce feed/manure and change water.\n• Top up or change 10-20% of water weekly; more in the hot season (Sept-Nov).\n• Lime new ponds (agricultural lime ~ 1 kg per 10 m²) and between cycles.\n• Remove dead fish immediately; check for predators (birds, otters, snakes) and theft.` },
  { k: ['catfish'], t: 'Catfish Farming',
    a: `Catfish (Clarias):\n• Grow faster than tilapia and tolerate low oxygen, but need high-protein feed (40%+).\n• Stocking: 10-20 fish per m² in ponds with good water exchange.\n• Feed 3-5% of body weight; they reach 800 g-1 kg in 6-8 months.\n• Sort by size every month - big catfish eat small ones.\n• Cover tanks/ponds with nets - catfish jump out.` },
  { k: ['tilapia', 'fish farming', 'fish', 'fingerlings', 'stocking'], t: 'Tilapia Farming',
    a: `Tilapia farming in Zambia:\n• Buy mono-sex (all male) fingerlings from a certified hatchery - they grow bigger and do not breed in the pond.\n• Stocking: 3-5 fish per m² in ponds (without aeration).\n• Cycle: 6-8 months to reach 300-450 g.\n• Feed is 60-70% of costs - use good floating pellets and do not overfeed.\n• Lusaka, Chongwe and Kafue markets pay well for fresh tilapia; hotels and lodges pay more for consistent size.\n• Partial harvests (selling the biggest fish) give cash flow and let the rest grow.` },
  // ---------------- BUSINESS ----------------
  { k: ['market', 'price', 'sell', 'buyer', 'fra', 'where to sell'], t: 'Selling & Markets',
    a: `Getting better prices:\n• Maize: compare FRA floor price with private millers and traders. Store well and sell when prices rise (Oct-Jan).\n• Vegetables: Soweto market (Lusaka) moves big volumes; supermarkets and hotels pay more but want steady quality.\n• Livestock: sell goats before holidays (Christmas, Easter, weddings) for higher prices.\n• Fish: sell fresh to hotels/restaurants, or partial harvests to local traders.\n• Always record buyer name and payment method - see "Best seller" in your reports.` },
  { k: ['loan', 'capital', 'investment', 'finance', 'money', 'credit', 'bank'], t: 'Farm Finance',
    a: `Money tips:\n• Record capital (your savings, loans) under "Investment" - it is not income. The app keeps it separate so your profit is real.\n• Only borrow for things that make money quickly (inputs, fingerlings, feed) and have a repayment plan from expected sales.\n• Separate farm money from home money (use a separate Mobile Money line).\n• Check your Income Statement every month and cut costs that do not bring sales.` },
  { k: ['record', 'keeping records', 'how to use', 'help', 'app'], t: 'Using Zozo Farm App',
    a: `How to use the app:\n• My Farms: tap a farm to open its dashboard.\n• Add Sale / Expense / Investment with the big buttons on the farm dashboard.\n• Projects: create crop, livestock or fish projects; each one tracks its own cost and profit.\n• Reports: tap "Statement" for the income statement and export to Excel, PDF, Word or PowerPoint.\n• Tasks, Stock (inventory), Photos and Visits are in the farm menu.\n• Ask me things like "How did Farm A do this month?", "Top expenses for Farm B", "Create a monthly report for Farm B", or any farming question.` }
]

function score(q, entry) {
  let s = 0
  for (const kw of entry.k) {
    if (q.includes(kw)) s += kw.split(' ').length * 3
    else {
      const parts = kw.split(' ')
      for (const p of parts) if (p.length > 3 && q.includes(p)) s += 1
    }
  }
  return s
}

export function searchKnowledge(question, n = 1) {
  const q = ' ' + question.toLowerCase().replace(/[^a-z0-9 ]/g, ' ') + ' '
  return KNOWLEDGE.map((e) => ({ e, s: score(q, e) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((x) => x.e)
}

// ---------------- PHOTO PROBLEM HINTS ----------------
export const SYMPTOMS = [
  { id: 'yellow', label: 'Yellow leaves', cause: 'Yellow leaves (especially older, lower leaves) are usually lack of nitrogen. Can also be waterlogging or too little water.', action: 'Apply top dressing (Urea or CAN) on moist soil, or add manure. Check drainage. If yellow stripes, it may be maize streak virus.' },
  { id: 'purple', label: 'Purple leaves', cause: 'Purple/reddish leaves on young plants often mean lack of phosphorus, or cold soil.', action: 'Use a basal fertilizer with phosphorus (D-Compound) at planting next time. Usually improves as soil warms.' },
  { id: 'holes', label: 'Holes in leaves', cause: 'Holes and chewing damage are caused by caterpillars (e.g. fall armyworm in maize, diamondback moth in cabbage) or beetles.', action: 'Scout the field. Spray a suitable insecticide (Emamectin, Lambda-cyhalothrin, or Bt for vegetables) early morning. Rotate chemicals.' },
  { id: 'spots', label: 'Spots / blight', cause: 'Brown or black spots and patches usually mean a fungal disease like blight or leaf spot, common in wet weather.', action: 'Remove badly affected leaves. Spray a fungicide (Mancozeb; Ridomil for late blight). Improve spacing and avoid wetting leaves.' },
  { id: 'wilting', label: 'Wilting', cause: 'Wilting can be lack of water, root damage, or bacterial/fusarium wilt (plant wilts even when soil is wet).', action: 'Check soil moisture. If soil is wet and plants still wilt, pull one out and check roots/stem. Remove and burn infected plants and rotate crops.' },
  { id: 'insects', label: 'Small insects', cause: 'Small insects under leaves are often aphids or whiteflies. They suck sap and spread viruses.', action: 'Spray soapy water or neem, or an insecticide like Dimethoate/Imidacloprid. Remove weeds around the field.' },
  { id: 'sickanimal', label: 'Sick animal', cause: 'A sick animal that is weak, not eating, coughing or has diarrhoea may have worms, pneumonia or a tick-borne disease.', action: 'Separate it from the herd. Check temperature, eyelids (pale = worms). Give clean water and call the vet. Record the treatment in Expenses (Vet/Medicine).' },
  { id: 'deadfish', label: 'Dead fish', cause: 'Fish deaths are most often low oxygen (early morning), poor water quality, overfeeding, or disease.', action: 'Stop feeding for a day, add fresh water, remove dead fish. Check water colour and smell. Reduce stocking/feeding if water is very green.' },
  { id: 'fence', label: 'Broken fence / building', cause: 'Damaged fences and structures let animals escape and thieves or predators in.', action: 'Create a task to repair it, assign a worker and record the cost under Maintenance.' },
  { id: 'pests', label: 'Rats / birds / pests', cause: 'Rodents and birds damage stored grain, seedlings and fish.', action: 'Store grain in sealed bags/containers off the floor, use traps, and cover fish ponds with bird nets.' }
]

export function diagnose(caption = '', symptomIds = []) {
  const text = caption.toLowerCase()
  const found = new Map()
  for (const s of SYMPTOMS) {
    if (symptomIds.includes(s.id)) found.set(s.id, s)
  }
  const kw = {
    yellow: ['yellow', 'pale leaf', 'chlorosis'], purple: ['purple', 'red leaves'], holes: ['hole', 'eaten', 'worm', 'caterpillar', 'armyworm'],
    spots: ['spot', 'blight', 'brown patch', 'black patch', 'rot', 'mould', 'mold'], wilting: ['wilt', 'drooping', 'dying plant'],
    insects: ['aphid', 'insect', 'whitefly', 'bugs'], sickanimal: ['sick', 'cough', 'diarr', 'not eating', 'weak', 'limping', 'goat', 'cow', 'pig', 'chicken'],
    deadfish: ['dead fish', 'fish dying', 'gasping', 'floating fish'], fence: ['fence', 'broken', 'roof', 'gate', 'pen', 'leak'], pests: ['rat', 'bird', 'monkey', 'weevil', 'mice']
  }
  for (const [id, words] of Object.entries(kw)) {
    if (words.some((w) => text.includes(w))) found.set(id, SYMPTOMS.find((s) => s.id === id))
  }
  const list = [...found.values()]
  if (!list.length)
    return 'Add a short description (e.g. "yellow leaves on maize" or "goat coughing") or pick a symptom, and I will suggest possible causes and actions.'
  return list.map((s) => `• ${s.label}: ${s.cause}\n  ➜ ${s.action}`).join('\n\n')
}
