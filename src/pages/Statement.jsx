import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FileSpreadsheet, FileText, FileType, Presentation, Loader2, Download } from 'lucide-react'
import { useStore } from '../lib/store'
import { buildReport, EXPORTERS } from '../lib/exports'
import { money, pct, periodRange, clsx } from '../lib/utils'
import { PageHeader, PeriodFilter, Select, Stat, Logo } from '../components/ui'
import { IncomeExpenseChart, ExpensePie } from '../components/Charts'

const FORMATS = [
  { id: 'xlsx', label: 'Excel', icon: FileSpreadsheet, cls: 'bg-green-700' },
  { id: 'pdf', label: 'PDF', icon: FileText, cls: 'bg-red-600' },
  { id: 'docx', label: 'Word', icon: FileType, cls: 'bg-blue-700' },
  { id: 'pptx', label: 'PowerPoint', icon: Presentation, cls: 'bg-orange-600' }
]

export default function Statement() {
  const [sp] = useSearchParams()
  const { state, toast } = useStore()
  const [farmId, setFarmId] = useState(sp.get('farm') || '')
  const [projectId, setProjectId] = useState(sp.get('project') || '')
  const [period, setPeriod] = useState(sp.get('period') || 'month')
  const [custom, setCustom] = useState({})
  const [busy, setBusy] = useState('')
  const range = periodRange(period, custom)
  const r = useMemo(() => buildReport(state, { farmId, projectId, range, periodLabel: range.label }), [state, farmId, projectId, range.from, range.to, range.label]) // eslint-disable-line
  const { st } = r
  const projects = state.projects.filter((p) => !farmId || p.farmId === farmId)

  const doExport = async (fmt) => {
    setBusy(fmt)
    try {
      await EXPORTERS[fmt](r)
      toast(`${FORMATS.find((f) => f.id === fmt).label} file downloaded`)
    } catch (e) {
      console.error(e)
      toast('Export failed: ' + e.message, 'bad')
    } finally {
      setBusy('')
    }
  }

  return (
    <div>
      <PageHeader title="Income Statement" subtitle="Reports & exports" />
      <div className="card p-4 mb-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-semibold">Farm<Select value={farmId} onChange={(v) => { setFarmId(v); setProjectId('') }} options={state.farms.map((f) => ({ value: f.id, label: f.name }))} placeholder="All Farms Combined" /></label>
          <label className="text-sm font-semibold">Project<Select value={projectId} onChange={setProjectId} options={projects.map((p) => ({ value: p.id, label: p.name }))} placeholder="All projects" /></label>
        </div>
        <PeriodFilter period={period} setPeriod={setPeriod} custom={custom} setCustom={setCustom} />
      </div>

      {/* Export */}
      <div className="card p-4 mb-4">
        <h3 className="font-bold mb-2 flex items-center gap-2"><Download size={18} /> Export this statement</h3>
        <div className="grid grid-cols-4 gap-2">
          {FORMATS.map((f) => (
            <button key={f.id} onClick={() => doExport(f.id)} disabled={!!busy} className={clsx('btn text-white flex-col !gap-0.5 min-h-[68px] text-xs sm:text-sm', f.cls)}>
              {busy === f.id ? <Loader2 className="animate-spin" size={22} /> : <f.icon size={22} />} <span className={f.id === 'pptx' ? 'hidden sm:inline' : ''}>{f.label}</span>{f.id === 'pptx' && <span className="sm:hidden">PPT</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Printable statement */}
      <div className="card p-4 sm:p-6 mb-4">
        <div className="flex items-center gap-3 border-b-4 border-farm-light pb-3 mb-4">
          <Logo size={40} className="shrink-0" />
          <div className="shrink-0">
            <div className="font-extrabold text-farm leading-tight whitespace-nowrap">Zozo Farm App</div>
            <div className="text-[11px] text-earth italic whitespace-nowrap">Your Farms, In Your Pocket</div>
          </div>
          <div className="flex-1 min-w-0 text-right text-sm">
            <div className="font-bold">{r.scopeName}</div>
            <div className="text-gray-500">{r.period}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <Stat label="Total Sales" value={money(st.totalSales, { decimals: 0 })} tone="light" />
          <Stat label="Total Expenses" value={money(st.totalExpenses, { decimals: 0 })} tone="earth" />
          <Stat label={st.net >= 0 ? 'Net Profit' : 'Net Loss'} value={money(st.net, { decimals: 0 })} tone={st.net >= 0 ? 'green' : 'red'} />
          <Stat label="Profit Margin" value={pct(st.margin)} tone="pale" />
        </div>

        <table className="w-full text-sm sm:text-base">
          <tbody>
            <tr className="bg-farm-pale font-bold"><td className="p-2">Total Sales (Income)</td><td className="p-2 text-right">{money(st.totalSales)}</td></tr>
            {st.salesByItem.map((s) => <tr key={s.item} className="text-gray-600"><td className="py-1 px-2 pl-6">{s.item} ({s.qty} {s.unit})</td><td className="py-1 px-2 text-right">{money(s.amount)}</td></tr>)}
            <tr className="bg-earth-pale font-bold"><td className="p-2">Less: Expenses</td><td className="p-2 text-right" /></tr>
            {st.byCategory.length === 0 && <tr><td className="py-1 px-2 pl-6 text-gray-500">No expenses</td><td /></tr>}
            {st.byCategory.map((c) => <tr key={c.category} className="text-gray-700"><td className="py-1 px-2 pl-6">{c.icon} {c.category} <span className="text-gray-400 text-xs">({c.share.toFixed(1)}%)</span></td><td className="py-1 px-2 text-right">({money(c.amount)})</td></tr>)}
            <tr className="font-bold border-t"><td className="p-2">Total Expenses</td><td className="p-2 text-right">({money(st.totalExpenses)})</td></tr>
            <tr className={clsx('font-extrabold text-lg border-t-2 border-b-4 border-double', st.net >= 0 ? 'text-farm border-farm' : 'text-red-600 border-red-600')}><td className="p-2">{st.net >= 0 ? 'NET PROFIT' : 'NET LOSS'}</td><td className="p-2 text-right">{money(st.net)}</td></tr>
            <tr><td className="p-2 text-gray-600">Profit Margin</td><td className="p-2 text-right font-semibold">{pct(st.margin)}</td></tr>
            <tr className="bg-blue-50"><td className="p-2 text-gray-700">Capital Injected <span className="text-xs">(separate - not income)</span></td><td className="p-2 text-right font-semibold">{money(st.totalInvestment)}</td></tr>
          </tbody>
        </table>
        {Object.keys(st.byMethod).length > 0 && <p className="text-xs text-gray-500 mt-3">Payments received: {Object.entries(st.byMethod).map(([k, v]) => `${k} ${money(v, { decimals: 0 })}`).join(' · ')}</p>}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="card p-4"><h3 className="section-title mb-2">Income vs Expenses</h3><IncomeExpenseChart data={st.monthly} /></div>
        <div className="card p-4">
          <h3 className="section-title mb-2">Expense Breakdown</h3>
          <ExpensePie data={st.byCategory} />
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mt-1">{st.byCategory.map((c) => <span key={c.category} className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />{c.category}</span>)}</div>
        </div>
      </div>

      {(r.farms.length > 0 || r.projects.length > 0) && (
        <div className="card p-4 mb-4 overflow-x-auto">
          <h3 className="section-title mb-2">{r.farms.length ? 'By Farm' : 'By Project'}</h3>
          <table className="w-full text-sm min-w-[420px]">
            <thead><tr className="text-left text-gray-500 border-b"><th className="py-2">{r.farms.length ? 'Farm' : 'Project'}</th><th className="text-right">Sales</th><th className="text-right">Expenses</th><th className="text-right">Net</th></tr></thead>
            <tbody>
              {(r.farms.length ? r.farms : r.projects).map((x) => (
                <tr key={x.name} className="border-b last:border-0"><td className="py-2 font-medium">{x.name}</td><td className="text-right">{money(x.sales, { decimals: 0 })}</td><td className="text-right">{money(x.expenses, { decimals: 0 })}</td><td className={clsx('text-right font-bold', x.net >= 0 ? 'text-farm' : 'text-red-600')}>{money(x.net, { decimals: 0 })}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card p-4">
        <h3 className="section-title mb-2">Recommendations</h3>
        <ul className="space-y-2 text-sm text-gray-700">{r.recs.map((x, i) => <li key={i}>💡 {x}</li>)}</ul>
      </div>
    </div>
  )
}
