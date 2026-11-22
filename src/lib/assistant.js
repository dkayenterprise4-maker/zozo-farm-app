// "Zozo Assistant": built-in rule-based assistant that reads real farm data,
// plus optional Claude AI when an API key is added in Settings.
import { statement, projection, bestProject, insights, saleTotal } from './finance'
import { searchKnowledge } from './knowledge'
import { money, periodRange, today, fmtDate, pct } from './utils'
import { productNames } from './constants'

const MODEL = 'claude-opus-5-5'

function detectFarms(state, q, farms, ctxFarmId) {
  if (/\b(all|every|both|my) farms?\b|\boverall\b|\btotal\b|\bcombined\b/.test(q)) return { all: true, farms }
  const hits = farms.filter((f) => {
    const [short, place] = f.name.toLowerCase().split(' - ')
    return (short && q.includes(short)) || (place && q.includes(place)) || (f.location && q.includes(f.location.toLowerCase()))
  })
  if (hits.length) return { all: false, farms: hits }
  const ctx = farms.find((f) => f.id === ctxFarmId)
  if (ctx) return { all: false, farms: [ctx], implied: true }
  return { all: true, farms }
}

function detectPeriod(q, fallback = 'month') {
  if (/\btoday\b/.test(q)) return 'today'
  if (/this week|past week|7 days/.test(q)) return 'week'
  if (/last month|previous month/.test(q)) return 'lastmonth'
  if (/this month|monthly|month/.test(q)) return 'month'
  if (/this year|year|annual|ytd/.test(q)) return 'year'
  if (/all time|ever|since start|total/.test(q)) return 'all'
  return fallback
}

const has = (q, re) => re.test(q)

function farmSummary(state, farm, periodId, isOwner) {
  const range = periodRange(periodId)
  const st = statement(state, { farmId: farm.id, range })
  const name = farm.name
  if (!st.sales.length && !st.expenses.length) return `${name}: no sales or expenses recorded for ${range.label}.`
  let t = `${name} - ${range.label}\n`
  t += `• Sales: ${money(st.totalSales)} (${st.sales.length} sales)\n`
  t += `• Expenses: ${money(st.totalExpenses)} (${st.expenses.length} expenses)\n`
  if (isOwner) {
    t += `• ${st.net >= 0 ? 'Profit' : 'Loss'}: ${money(st.net)}${st.totalSales ? ` (margin ${pct(st.margin)})` : ''}\n`
    if (st.totalInvestment) t += `• Capital injected: ${money(st.totalInvestment)} (not counted as income)\n`
  }
  if (st.byCategory[0]) t += `• Biggest cost: ${st.byCategory[0].category} - ${money(st.byCategory[0].amount)} (${st.byCategory[0].share.toFixed(0)}%)\n`
  if (st.salesByItem[0]) t += `• Best seller: ${st.salesByItem[0].item} - ${money(st.salesByItem[0].amount)}\n`
  return t
}

export function ruleAnswer(state, user, question, ctxFarmId) {
  const isOwner = user.role === 'owner'
  const q = ' ' + question.toLowerCase().trim() + ' '
  const farms = isOwner ? state.farms : state.farms.filter((f) => (user.farmIds || []).includes(f.id))
  const { all, farms: target, implied } = detectFarms(state, q, farms, ctxFarmId)
  const actions = []

  // Greetings
  if (/^\s*(hi|hello|hey|good (morning|afternoon|evening)|muli shani|mwabuka)\b/.test(q) && q.trim().split(' ').length <= 4)
    return { text: `Hello ${user.name}! I am Zozo Assistant. Ask me about your farms (e.g. "How did Farm A do this month?") or any farming question (e.g. "How do I stop fall armyworm?").` }

  const moneyQ = has(q, /profit|loss|how (did|is|was|are)|doing|perform|summary|made|earn|income statement|statement|report|sales|sold|revenue|expense|cost|spend|spent|projection|projected|forecast|compare|best project|margin|money/)
  const farmingQ = searchKnowledge(question, 1)[0]

  if (!isOwner && has(q, /profit|loss|margin|statement|report|projection|forecast|compare/))
    return { text: 'Only the farm owner can see profit, statements and reports. I can help you with farming questions, your tasks, and adding sales or expenses.' }

  // ---- Report ----
  if (has(q, /report|statement/) && isOwner) {
    const periodId = detectPeriod(q, 'month')
    const range = periodRange(periodId)
    const f = all ? null : target[0]
    const st = statement(state, { farmId: f?.id, range })
    let t = `${periodId === 'month' || periodId === 'lastmonth' ? 'Monthly' : ''} Report - ${f ? f.name : 'All Farms'} (${range.label})\n\n`
    t += `Sales: ${money(st.totalSales)}\nExpenses: ${money(st.totalExpenses)}\n${st.net >= 0 ? 'Net Profit' : 'Net Loss'}: ${money(st.net)}\nMargin: ${pct(st.margin)}\nCapital injected: ${money(st.totalInvestment)}\n`
    if (st.byCategory.length) t += `\nTop expenses:\n` + st.byCategory.slice(0, 3).map((c, i) => `${i + 1}. ${c.category}: ${money(c.amount)} (${c.share.toFixed(0)}%)`).join('\n')
    const ins = insights(state, { farmId: f?.id, range })
    if (ins.length) t += `\n\nAdvice:\n` + ins.slice(0, 3).map((i) => `• ${i.title}. ${i.text}`).join('\n')
    t += `\n\nOpen the full statement to export it as Excel, PDF, Word or PowerPoint.`
    actions.push({ label: 'Open full statement & export', to: `/statement?farm=${f?.id || ''}&period=${periodId === 'lastmonth' ? 'month' : periodId}` })
    return { text: t, actions }
  }

  // ---- Compare farms ----
  if (has(q, /compare|which farm|best farm|worst farm/) && farms.length > 1) {
    const periodId = detectPeriod(q, 'month')
    const range = periodRange(periodId)
    const rows = farms.map((f) => ({ f, st: statement(state, { farmId: f.id, range }) })).sort((a, b) => b.st.net - a.st.net)
    let t = `Farm comparison - ${range.label}\n\n` + rows.map((r, i) => `${i + 1}. ${r.f.name}: sales ${money(r.st.totalSales)}, expenses ${money(r.st.totalExpenses)}, ${r.st.net >= 0 ? 'profit' : 'loss'} ${money(r.st.net)}`).join('\n')
    t += `\n\nBest: ${rows[0].f.name}.`
    return { text: t, actions: [{ label: 'All-farms statement', to: '/statement' }] }
  }

  // ---- Projection ----
  if (has(q, /projection|projected|forecast|by dec|end of (the )?year|at this rate|future/) && isOwner) {
    const lines = (all ? farms : target).map((f) => {
      const p = projection(state, { farmId: f.id })
      return `• ${f.name}: averaging ${money(p.avgMonthly, { decimals: 0 })} per month. At the current rate it is projected to ${p.projected >= 0 ? 'make' : 'lose'} ${money(Math.abs(p.projected), { decimals: 0 })} by ${p.target} (so far this year: ${money(p.ytd, { decimals: 0 })}).`
    })
    return { text: `Projections\n\n${lines.join('\n')}\n\nThis uses the average profit of the last 3 months with activity. Seasonal crops (like maize) earn mostly at harvest, so treat it as a guide.` }
  }

  // ---- Best project ----
  if (has(q, /best project|which project|top project|worst project/)) {
    const range = periodRange(detectPeriod(q, 'all'))
    const f = all ? null : target[0]
    const projects = state.projects.filter((p) => (f ? p.farmId === f.id : farms.some((x) => x.id === p.farmId)))
    const rows = projects.map((p) => ({ p, st: statement(state, { projectId: p.id, range }) })).filter((r) => r.st.sales.length || r.st.expenses.length).sort((a, b) => b.st.net - a.st.net)
    if (!rows.length) return { text: 'No project has sales or expenses yet.' }
    let t = `Projects ranked by ${isOwner ? 'profit' : 'sales'} (${range.label}):\n\n` + rows.map((r, i) => `${i + 1}. ${r.p.name} (${productNames(r.p.products)}): ${isOwner ? money(r.st.net) : money(r.st.totalSales) + ' sales'}`).join('\n')
    return { text: t }
  }

  // ---- Expenses ----
  if (has(q, /expense|cost|spend|spent|top 3|biggest|feed cost|where.*money/) && !farmingQ?.t?.includes('Feeding')) {
    const periodId = detectPeriod(q, 'month')
    const range = periodRange(periodId)
    const out = (all ? [null] : target).map((f) => {
      const st = statement(state, { farmId: f?.id, farmIds: f ? undefined : farms.map((x) => x.id), range })
      if (!st.expenses.length) return `${f ? f.name : 'All farms'}: no expenses in ${range.label}.`
      return `${f ? f.name : 'All farms'} - expenses ${range.label}: ${money(st.totalExpenses)}\n` + st.byCategory.slice(0, 5).map((c, i) => `${i + 1}. ${c.icon} ${c.category}: ${money(c.amount)} (${c.share.toFixed(0)}%)`).join('\n')
    })
    let t = out.join('\n\n')
    const top = statement(state, { farmId: all ? undefined : target[0]?.id, range }).byCategory[0]
    if (top) t += `\n\nYour biggest cost is ${top.category}. Cutting it by 10% saves about ${money(top.amount * 0.1, { decimals: 0 })}.` + (top.category === 'Feed' ? ' Buy feed in bulk, avoid spillage, and grow fodder or use crop residues.' : '')
    return { text: t }
  }

  // ---- Sales ----
  if (has(q, /\bsales?\b|sold|revenue|buyer|income\b/)) {
    const periodId = detectPeriod(q, 'month')
    const range = periodRange(periodId)
    const out = (all ? farms : target).map((f) => {
      const st = statement(state, { farmId: f.id, range })
      if (!st.sales.length) return `${f.name}: no sales in ${range.label}.`
      const last = st.sales.slice().sort((a, b) => b.date.localeCompare(a.date))[0]
      return `${f.name} - ${range.label}: ${money(st.totalSales)} from ${st.sales.length} sales\n` + st.salesByItem.slice(0, 4).map((s) => `• ${s.item}: ${s.qty} ${s.unit || ''} = ${money(s.amount)}`).join('\n') + `\nLast sale: ${fmtDate(last.date)} - ${last.qty} ${last.unit} ${last.item} to ${last.buyer || 'buyer'} (${money(saleTotal(last))})`
    })
    return { text: out.join('\n\n') }
  }

  // ---- Performance / profit ----
  if (moneyQ || has(q, /farm [a-z]\b/) && !farmingQ) {
    const periodId = detectPeriod(q, 'month')
    const list = all ? farms : target
    let t = list.map((f) => farmSummary(state, f, periodId, isOwner)).join('\n')
    if (all && isOwner && farms.length > 1) {
      const st = statement(state, { range: periodRange(periodId) })
      t += `\nALL FARMS: sales ${money(st.totalSales)}, expenses ${money(st.totalExpenses)}, ${st.net >= 0 ? 'profit' : 'loss'} ${money(st.net)}.`
    }
    if (isOwner) {
      const ins = insights(state, { farmId: all ? undefined : list[0]?.id, range: periodRange(periodId) })
      if (ins[0]) t += `\n\n${ins[0].title}. ${ins[0].text}`
      actions.push({ label: 'Open statement', to: `/statement?farm=${all ? '' : list[0]?.id}&period=${periodId === 'lastmonth' ? 'month' : periodId}` })
    }
    if (implied) t += `\n(Showing ${list[0].name}. Name another farm to switch.)`
    return { text: t, actions }
  }

  // ---- Stock ----
  if (has(q, /stock|inventory|low on|running out|how many bags|left/)) {
    const items = state.inventory.filter((i) => farms.some((f) => f.id === i.farmId) && (all || target.some((f) => f.id === i.farmId)))
    if (!items.length) return { text: 'No stock items recorded yet. Add them in the Stock page.' }
    const low = items.filter((i) => Number(i.qty) <= Number(i.lowStock))
    let t = items.map((i) => `${Number(i.qty) <= Number(i.lowStock) ? '' : ''} ${i.name}: ${i.qty} ${i.unit} (${state.farms.find((f) => f.id === i.farmId)?.name.split(' - ')[0]})`).join('\n')
    t = (low.length ? `${low.length} item(s) are low and need buying:\n${low.map((i) => '• ' + i.name).join('\n')}\n\nAll stock:\n` : 'Stock levels:\n') + t
    return { text: t, actions: [{ label: 'Open stock', to: '/inventory' }] }
  }

  // ---- Tasks ----
  if (has(q, /task|overdue|to do|todo|what should i do|remind|due/)) {
    const t0 = today()
    const tasks = state.tasks.filter((t) => !t.done && farms.some((f) => f.id === t.farmId) && (isOwner || t.assignedTo === user.id))
    if (!tasks.length) return { text: 'You have no open tasks. ' }
    const overdue = tasks.filter((t) => t.dueDate < t0)
    const todayT = tasks.filter((t) => t.dueDate === t0)
    const upcoming = tasks.filter((t) => t.dueDate > t0).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 5)
    const name = (id) => state.users.find((u) => u.id === id)?.name || 'Unassigned'
    let t = ''
    if (overdue.length) t += `Overdue:\n${overdue.map((x) => `• ${x.title} (due ${fmtDate(x.dueDate)}, ${name(x.assignedTo)})`).join('\n')}\n\n`
    if (todayT.length) t += `Today:\n${todayT.map((x) => `• ${x.title} (${name(x.assignedTo)})`).join('\n')}\n\n`
    if (upcoming.length) t += `Coming up:\n${upcoming.map((x) => `• ${x.title} - ${fmtDate(x.dueDate)}`).join('\n')}`
    return { text: t.trim(), actions: [{ label: 'Open tasks', to: '/tasks' }] }
  }

  // ---- Suggestions ----
  if (has(q, /advice|suggest|save money|reduce|improve|recommend|tips|what can i do better/) && isOwner && !farmingQ) {
    const f = all ? null : target[0]
    const ins = insights(state, { farmId: f?.id, range: periodRange('year') })
    const best = bestProject(state, f?.id)
    let t = `Suggestions for ${f ? f.name : 'your farms'}:\n\n` + ins.map((i) => `${i.icon} ${i.title}. ${i.text}`).join('\n\n')
    if (best) t += `\n\nBest performing project: ${best.project.name} (${money(best.net)}). Consider growing it.`
    const low = state.inventory.filter((i) => (!f || i.farmId === f.id) && Number(i.qty) <= Number(i.lowStock))
    if (low.length) t += `\n\nLow stock: ${low.map((i) => i.name).join(', ')}. Buy before you run out.`
    return { text: t }
  }

  // ---- Farming knowledge ----
  if (farmingQ) {
    const extra = searchKnowledge(question, 2)[1]
    return { text: `${farmingQ.t}\n\n${farmingQ.a}` + (extra ? `\n\nSee also: ask me about "${extra.t}".` : '') }
  }

  return {
    text: `I'm not sure about that one yet. Here are things I can help with:\n\n• "How did Farm A do this month?"\n• "Top expenses for Farm B this year"\n• "Create a monthly report for Farm B"\n• "Compare my farms"\n• "Which items are low in stock?"\n• "What tasks are overdue?"\n• Farming: "fall armyworm", "fertilizer for maize", "tilapia feeding", "goat vaccination", "crop rotation"` +
      (state.settings.apiKey ? '' : '\n\nTip: add an AI key in Settings to get smarter answers to any question.')
  }
}

// Compact snapshot of the farm data for the AI.
function dataContext(state, user) {
  const isOwner = user.role === 'owner'
  const farms = isOwner ? state.farms : state.farms.filter((f) => (user.farmIds || []).includes(f.id))
  const periods = ['month', 'lastmonth', 'year', 'all']
  return {
    today: fmtDate(today()),
    currency: 'ZMW (Kwacha, K)',
    user: { name: user.name, role: user.role },
    farms: farms.map((f) => ({
      name: f.name, location: f.location, size: `${f.size} ${f.sizeUnit}`, type: f.type, notes: f.notes,
      periods: Object.fromEntries(periods.map((p) => {
        const r = periodRange(p)
        const st = statement(state, { farmId: f.id, range: r })
        return [r.label, isOwner
          ? { sales: st.totalSales, expenses: st.totalExpenses, net: st.net, margin: Math.round(st.margin), capital: st.totalInvestment, expensesByCategory: st.byCategory.map((c) => [c.category, c.amount]), salesByItem: st.salesByItem.map((s) => [s.item, s.qty, s.unit, s.amount]) }
          : { sales: st.totalSales, expenses: st.totalExpenses }]
      })),
      projection: isOwner ? projection(state, { farmId: f.id }) : undefined,
      projects: state.projects.filter((p) => p.farmId === f.id).map((p) => {
        const st = statement(state, { projectId: p.id })
        return { name: p.name, products: productNames(p.products), field: p.field, status: p.status, start: p.startDate, harvest: p.harvestDate, ...(isOwner ? { sales: st.totalSales, expenses: st.totalExpenses, net: st.net } : {}) }
      }),
      stock: state.inventory.filter((i) => i.farmId === f.id).map((i) => `${i.name}: ${i.qty} ${i.unit}${Number(i.qty) <= Number(i.lowStock) ? ' (LOW)' : ''}`),
      openTasks: state.tasks.filter((t) => t.farmId === f.id && !t.done).map((t) => `${t.title} due ${fmtDate(t.dueDate)}`),
      recentVisits: state.visits.filter((v) => v.farmId === f.id).slice(0, 3).map((v) => `${fmtDate(v.date)} ${v.visitor}: saw "${v.saw}", fix "${v.fix}"`),
      weather: state.weather[f.id]?.days?.map((d) => `${d.date}: ${d.min}-${d.max}C rain ${d.rain}mm`)
    }))
  }
}

export async function aiAnswer(state, user, history, question, image) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey: state.settings.apiKey, dangerouslyAllowBrowser: true })
  const system = `You are "Zozo Assistant", a friendly farm advisor inside the Zozo Farm App, used by farmers in Zambia (mostly around Lusaka and Chongwe).
Speak simple, clear English. Keep answers short and practical (use short bullet points). Use Zambian context: rainy season Nov-Apr, local crops (maize, soya, groundnuts, vegetables), local markets (Soweto market, FRA), Kwacha (K) currency, DD/MM/YYYY dates.
When the user asks about their farms, use ONLY the real data below and quote exact Kwacha amounts. Never invent numbers. If data is missing, say so.
${user.role !== 'owner' ? 'The user is a WORKER: never reveal profit, margins or projections - say only the owner can see them.' : ''}
If a photo is attached, describe what you see and suggest likely causes and practical actions (e.g. yellow leaves -> nitrogen deficiency -> apply top dressing).
To create a downloadable report, tell the user to open the Statement page and tap Export.

FARM DATA (JSON):
${JSON.stringify(dataContext(state, user))}`
  const msgs = history.filter((m) => m.role === 'user' || m.role === 'assistant').slice(-10).map((m) => ({ role: m.role, content: m.text }))
  const content = []
  if (image) content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image.split(',')[1] } })
  content.push({ type: 'text', text: question || 'Please look at this photo.' })
  msgs.push({ role: 'user', content })
  // Make sure the conversation starts with a user turn
  while (msgs.length && msgs[0].role !== 'user') msgs.shift()
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    output_config: { effort: 'low' },
    system,
    messages: msgs
  })
  if (res.stop_reason === 'refusal') throw new Error('The AI could not answer that question.')
  return res.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim()
}
