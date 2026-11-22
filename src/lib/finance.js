// All money calculations live here so every screen, export and the
// assistant use exactly the same numbers.
import { inRange, monthKey, monthLabel, round2, toISO, MONTHS, periodRange } from './utils'
import { CAT_MAP, EXPENSE_CATEGORIES } from './constants'

const scope = (list, { farmIds, farmId, projectId, range }) =>
  list.filter(
    (x) =>
      (!farmId || x.farmId === farmId) &&
      (!farmIds || farmIds.includes(x.farmId)) &&
      (!projectId || x.projectId === projectId) &&
      (!range || inRange(x.date, range))
  )

export const saleTotal = (s) => round2(s.total ?? (Number(s.qty) || 0) * (Number(s.unitPrice) || 0))

export function statement(state, opts = {}) {
  const sales = scope(state.sales, opts)
  const expenses = scope(state.expenses, opts)
  const investments = scope(state.investments, opts)
  const totalSales = round2(sales.reduce((a, s) => a + saleTotal(s), 0))
  const totalExpenses = round2(expenses.reduce((a, e) => a + (Number(e.amount) || 0), 0))
  const totalInvestment = round2(investments.reduce((a, i) => a + (Number(i.amount) || 0), 0))
  const net = round2(totalSales - totalExpenses)
  const margin = totalSales > 0 ? (net / totalSales) * 100 : totalExpenses > 0 ? -100 : 0

  const byCat = {}
  for (const e of expenses) byCat[e.category] = (byCat[e.category] || 0) + (Number(e.amount) || 0)
  const byCategory = EXPENSE_CATEGORIES.filter((c) => byCat[c.id])
    .map((c) => ({
      category: c.id,
      icon: c.icon,
      color: c.color,
      amount: round2(byCat[c.id]),
      share: totalExpenses ? (byCat[c.id] / totalExpenses) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount)

  const byItem = {}
  for (const s of sales) {
    const k = s.item || 'Other'
    byItem[k] = byItem[k] || { item: k, amount: 0, qty: 0, unit: s.unit }
    byItem[k].amount += saleTotal(s)
    byItem[k].qty += Number(s.qty) || 0
  }
  const salesByItem = Object.values(byItem)
    .map((x) => ({ ...x, amount: round2(x.amount) }))
    .sort((a, b) => b.amount - a.amount)

  const byMethod = {}
  for (const s of sales) byMethod[s.method || 'Cash'] = round2((byMethod[s.method || 'Cash'] || 0) + saleTotal(s))

  return {
    sales,
    expenses,
    investments,
    totalSales,
    totalExpenses,
    totalInvestment,
    net,
    margin,
    byCategory,
    salesByItem,
    byMethod,
    monthly: monthlySeries(sales, expenses, opts.range)
  }
}

// Income vs expenses per month. Covers the range (max 24 months) or last 6 months.
export function monthlySeries(sales, expenses, range) {
  const now = new Date()
  let start, end
  if (range && range.from > '1900-01-02' && range.to < '2999-01-01') {
    start = range.from.slice(0, 7)
    end = range.to.slice(0, 7)
  } else {
    const all = [...sales, ...expenses].map((x) => x.date).sort()
    const d6 = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    start = all.length && all[0].slice(0, 7) < toISO(d6).slice(0, 7) ? all[0].slice(0, 7) : toISO(d6).slice(0, 7)
    end = toISO(now).slice(0, 7)
  }
  const keys = []
  let [y, m] = start.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  while ((y < ey || (y === ey && m <= em)) && keys.length < 24) {
    keys.push(`${y}-${String(m).padStart(2, '0')}`)
    m++
    if (m > 12) {
      m = 1
      y++
    }
  }
  if (keys.length > 24) keys.splice(0, keys.length - 24)
  const map = Object.fromEntries(keys.map((k) => [k, { key: k, month: monthLabel(k), income: 0, expenses: 0 }]))
  for (const s of sales) {
    const k = monthKey(s.date)
    if (map[k]) map[k].income += saleTotal(s)
  }
  for (const e of expenses) {
    const k = monthKey(e.date)
    if (map[k]) map[k].expenses += Number(e.amount) || 0
  }
  return keys.map((k) => ({
    ...map[k],
    income: round2(map[k].income),
    expenses: round2(map[k].expenses),
    profit: round2(map[k].income - map[k].expenses)
  }))
}

export function projectFinance(state, projectId) {
  const st = statement(state, { projectId })
  return { cost: st.totalExpenses, income: st.totalSales, profit: st.net, investment: st.totalInvestment }
}

// Projection: average monthly profit of the last 3 full-or-current months
// that had any activity, carried to the end of the year.
export function projection(state, opts = {}) {
  const now = new Date()
  const year = now.getFullYear()
  const ytd = statement(state, { ...opts, range: periodRange('year') })
  const last = statement(state, {
    ...opts,
    range: { from: toISO(new Date(year, now.getMonth() - 2, 1)), to: toISO(now) }
  }).monthly.slice(-3)
  const active = last.filter((m) => m.income || m.expenses)
  const avg = active.length ? active.reduce((a, m) => a + m.profit, 0) / active.length : 0
  const remaining = 11 - now.getMonth() // full months after this one
  const target = `Dec ${year}`
  const projected = round2(ytd.net + avg * remaining)
  // Also a 6-month forward line for charts
  const forward = []
  let running = ytd.net
  for (let i = 1; i <= 6; i++) {
    const d = new Date(year, now.getMonth() + i, 1)
    running += avg
    forward.push({ month: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, cumulative: round2(running) })
  }
  return { avgMonthly: round2(avg), ytd: ytd.net, projected, target, remaining, forward, basedOn: active.length }
}

export function bestProject(state, farmId, range) {
  const projects = state.projects.filter((p) => !farmId || p.farmId === farmId)
  let best = null
  for (const p of projects) {
    const st = statement(state, { projectId: p.id, range })
    if (!st.sales.length && !st.expenses.length) continue
    if (!best || st.net > best.net) best = { project: p, net: st.net, sales: st.totalSales, expenses: st.totalExpenses }
  }
  return best
}

// Plain-language insight cards from the numbers.
export function insights(state, opts = {}) {
  const out = []
  const st = statement(state, opts)
  if (st.byCategory.length && st.totalExpenses > 0) {
    const top = st.byCategory[0]
    const save = round2(top.amount * 0.1)
    out.push({
      tone: top.share > 40 ? 'warn' : 'info',
      icon: top.icon,
      title: `Your biggest cost is ${top.category} (${top.share.toFixed(0)}%)`,
      text: `Reducing ${top.category.toLowerCase()} costs by 10% would save about K ${save.toLocaleString()}.` +
        (top.category === 'Feed' ? ' Try buying feed in bulk or mixing some of your own feed.' : '') +
        (top.category === 'Fertilizer' ? ' Use soil testing and apply only what the crop needs. Add manure/compost.' : '') +
        (top.category === 'Labour' ? ' Plan work in batches so casual workers finish more in a day.' : '') +
        (top.category === 'Transport' ? ' Share transport with other farmers when taking produce to market.' : '')
    })
  }
  if (st.totalSales > 0) {
    if (st.margin < 0)
      out.push({ tone: 'bad', icon: '⚠️', title: 'You are making a loss', text: `Expenses are higher than sales by K ${Math.abs(st.net).toLocaleString()}. Check costs that are not bringing income.` })
    else if (st.margin < 15)
      out.push({ tone: 'warn', icon: '📉', title: `Low profit margin (${st.margin.toFixed(1)}%)`, text: 'Look for better prices: sell in bulk, sell direct to buyers, or wait for better market days.' })
    else
      out.push({ tone: 'good', icon: '✅', title: `Healthy margin of ${st.margin.toFixed(1)}%`, text: 'Keep recording every sale and expense so you can see what works best.' })
  } else if (st.totalExpenses > 0) {
    out.push({ tone: 'info', icon: '🌱', title: 'No sales yet in this period', text: 'You are investing in the season. Plan your market early so you get a good price at harvest.' })
  }
  const top = st.salesByItem[0]
  if (top) out.push({ tone: 'good', icon: '💰', title: `Best seller: ${top.item}`, text: `${top.item} brought in K ${top.amount.toLocaleString()} (${st.totalSales ? ((top.amount / st.totalSales) * 100).toFixed(0) : 0}% of sales).` })
  if (st.totalInvestment > 0)
    out.push({ tone: 'info', icon: '🏦', title: `Capital injected: K ${st.totalInvestment.toLocaleString()}`, text: st.net > 0 ? `Profit has paid back ${Math.min(100, (st.net / st.totalInvestment) * 100).toFixed(0)}% of the money put in.` : 'Profit has not yet started paying back the money put in.' })
  return out
}

export const catColor = (c) => CAT_MAP[c]?.color || '#9E9E9E'
